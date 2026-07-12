import { useCallback, useEffect, useRef, useState } from "react";
import type { CommentItem, SubtitleLine, SubtitleTrackInfo, VideoInfo } from "@bili/types";
import { feedPlayer, mergeDualLines, subtitleLinesToVtt } from "@bili/player";
import type { FeedSubtitleTrack } from "@bili/player";
import { bridge } from "../lib/bridge";
import { formatCount } from "../lib/format";
import { CommentsPanel } from "./CommentsPanel";

interface Props {
  video: VideoInfo;
  sessionEpoch: number;
}

type CaptionMode = "original" | "translated" | "dual";

const REFRESH_COOLDOWN_MS = 15_000;
const STALL_GRACE_MS = 8_000;
const TRANSLATE_BATCH = 50;
const PLAYER_SRC = "/player/index.html";

/** Session-scoped VTT cache: cid + track url + mode → built subtitle track. */
const vttCache = new Map<string, FeedSubtitleTrack>();

function cacheKey(cid: number, trackUrl: string, mode: CaptionMode): string {
  return `${cid}|${trackUrl}|${mode}`;
}

function modeLabel(track: SubtitleTrackInfo, mode: CaptionMode, targetLang: string): string {
  if (mode === "original") return track.lanDoc;
  if (mode === "dual") return "Dual";
  const lang = targetLang.trim() || "en";
  const pretty = lang.toLowerCase() === "en" ? "English" : lang;
  return `${pretty} (translated)`;
}

async function translateAllLines(
  lines: SubtitleLine[],
  onProgress: (pct: number) => void,
): Promise<string[]> {
  const texts = lines.map((l) => l.content);
  const out: string[] = new Array(texts.length);
  if (texts.length === 0) {
    onProgress(100);
    return out;
  }
  let done = 0;
  for (let i = 0; i < texts.length; i += TRANSLATE_BATCH) {
    const batch = texts.slice(i, i + TRANSLATE_BATCH);
    const translated = await bridge.translate(batch, {
      context: "bilibili video captions",
    });
    for (let j = 0; j < batch.length; j++) {
      out[i + j] = translated[j] ?? batch[j]!;
    }
    done += batch.length;
    onProgress(Math.min(100, Math.round((done / texts.length) * 100)));
  }
  return out;
}

function waitForIframeLoad(iframe: HTMLIFrameElement): Promise<void> {
  return new Promise((resolve) => {
    const onLoad = () => {
      iframe.removeEventListener("load", onLoad);
      resolve();
    };
    iframe.addEventListener("load", onLoad);
  });
}

async function seekAndPlay(iframe: HTMLIFrameElement, time: number): Promise<void> {
  const deadline = Date.now() + 8_000;
  while (Date.now() < deadline) {
    const video = iframe.contentDocument?.querySelector("video");
    if (video) {
      try {
        if (Number.isFinite(time) && time > 0) {
          video.currentTime = time;
        }
        void video.play();
      } catch {
        // autoplay / seek may be rejected; ignore
      }
      return;
    }
    await new Promise((r) => setTimeout(r, 50));
  }
}

export function VideoPage({ video, sessionEpoch }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [mpdXml, setMpdXml] = useState<string | null>(null);
  const [fed, setFed] = useState(false);
  const [titleEn, setTitleEn] = useState<string | null>(null);
  const [descEn, setDescEn] = useState<string | null>(null);
  const [showOriginalDesc, setShowOriginalDesc] = useState(false);
  const [translateComments, setTranslateComments] = useState(false);
  const [translations, setTranslations] = useState<Map<number, string>>(() => new Map());
  const [metaError, setMetaError] = useState<string | null>(null);
  const translationsRef = useRef(translations);
  translationsRef.current = translations;

  const [tracks, setTracks] = useState<SubtitleTrackInfo[] | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [captionProgress, setCaptionProgress] = useState<number | null>(null);
  const [captionError, setCaptionError] = useState<string | null>(null);
  const [activeCaption, setActiveCaption] = useState<string | null>(null);
  const subtitlesRef = useRef<FeedSubtitleTrack[] | undefined>(undefined);
  const pendingSeekRef = useRef<number | null>(null);
  /** When true, the next iframeLoaded→feed effect is skipped (manual feed already done). */
  const skipAutoFeedRef = useRef(false);

  const lastRefreshAt = useRef(0);
  const lastFeedAt = useRef(0);
  const refreshing = useRef(false);
  const sessionEpochRef = useRef(sessionEpoch);

  const feed = useCallback((xml: string) => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    const subs = subtitlesRef.current;
    feedPlayer(iframe, xml, subs ? { subtitles: subs } : undefined);
    lastFeedAt.current = Date.now();
    setFed(true);

    const seekTo = pendingSeekRef.current;
    if (seekTo != null) {
      pendingSeekRef.current = null;
      void seekAndPlay(iframe, seekTo);
    }
  }, []);

  const reloadPlayerAndFeed = useCallback(
    async (xml: string, seekTo: number) => {
      const iframe = iframeRef.current;
      if (!iframe) return;
      pendingSeekRef.current = seekTo;
      skipAutoFeedRef.current = true;
      setIframeLoaded(false);
      setFed(false);
      // Force a real navigation even when src is already PLAYER_SRC.
      const blankLoad = waitForIframeLoad(iframe);
      iframe.src = "about:blank";
      await blankLoad;
      const playerLoad = waitForIframeLoad(iframe);
      iframe.src = PLAYER_SRC;
      await playerLoad;
      setIframeLoaded(true);
      feed(xml);
    },
    [feed],
  );

  const refreshStreams = useCallback(async (reason: string) => {
    const now = Date.now();
    if (refreshing.current) return;
    if (reason !== "login" && now - lastRefreshAt.current < REFRESH_COOLDOWN_MS) return;
    if (now - lastFeedAt.current < STALL_GRACE_MS && reason === "stalled") return;

    refreshing.current = true;
    lastRefreshAt.current = now;
    try {
      const { mpdXml: next } = await bridge.getStreams(
        { bvid: video.bvid, aid: video.aid },
        video.cid,
      );
      setMpdXml(next);
      if (iframeRef.current && iframeLoaded && reason === "login") {
        const videoEl = iframeRef.current.contentDocument?.querySelector("video");
        await reloadPlayerAndFeed(next, videoEl?.currentTime ?? 0);
      } else if (iframeRef.current && iframeLoaded) {
        feed(next);
      }
    } catch (err) {
      setMetaError(err instanceof Error ? err.message : String(err));
    } finally {
      refreshing.current = false;
    }
  }, [feed, iframeLoaded, reloadPlayerAndFeed, video.aid, video.bvid, video.cid]);

  useEffect(() => {
    let cancelled = false;
    setMetaError(null);
    setTitleEn(null);
    setDescEn(null);
    setMpdXml(null);
    setFed(false);
    setTranslations(new Map());
    setShowOriginalDesc(false);
    setTracks(null);
    setMenuOpen(false);
    setCaptionProgress(null);
    setCaptionError(null);
    setActiveCaption(null);
    subtitlesRef.current = undefined;
    pendingSeekRef.current = null;
    lastRefreshAt.current = 0;
    lastFeedAt.current = 0;

    void (async () => {
      try {
        const [{ mpdXml: xml }, translated, subs] = await Promise.all([
          bridge.getStreams({ bvid: video.bvid, aid: video.aid }, video.cid),
          bridge.translate([video.title, video.desc], {
            context: "bilibili video title and description",
          }),
          bridge.getSubtitles({ bvid: video.bvid, aid: video.aid }, video.cid),
        ]);
        if (cancelled) return;
        setMpdXml(xml);
        setTitleEn(translated[0] ?? null);
        setDescEn(translated[1] ?? null);
        setTracks(subs);
      } catch (err) {
        if (!cancelled) setMetaError(err instanceof Error ? err.message : String(err));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [video]);

  useEffect(() => {
    if (sessionEpochRef.current === sessionEpoch) return;
    sessionEpochRef.current = sessionEpoch;
    if (sessionEpoch > 0) {
      void refreshStreams("login");
    }
  }, [sessionEpoch, refreshStreams]);

  useEffect(() => {
    if (!iframeLoaded || !mpdXml) return;
    if (skipAutoFeedRef.current) {
      skipAutoFeedRef.current = false;
      return;
    }
    feed(mpdXml);
  }, [feed, iframeLoaded, mpdXml]);

  useEffect(() => {
    if (!iframeLoaded || !fed) return;
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    if (!iframe || !doc) return;

    const hooked = new WeakSet<HTMLMediaElement>();

    const onError = () => {
      void refreshStreams("error");
    };
    const onStalled = () => {
      void refreshStreams("stalled");
    };

    const hookMedia = (el: HTMLMediaElement) => {
      if (hooked.has(el)) return;
      hooked.add(el);
      el.addEventListener("error", onError);
      el.addEventListener("stalled", onStalled);
    };

    const scan = () => {
      doc.querySelectorAll("video, audio").forEach((node) => {
        hookMedia(node as HTMLMediaElement);
      });
    };

    scan();
    const observer = new MutationObserver(scan);
    observer.observe(doc.documentElement, { childList: true, subtree: true });

    const onResetFailed = (event: Event) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      if (target.closest(".reset_failed")) {
        void refreshStreams("reload");
      }
    };
    doc.addEventListener("click", onResetFailed, true);

    return () => {
      observer.disconnect();
      doc.removeEventListener("click", onResetFailed, true);
    };
  }, [fed, iframeLoaded, refreshStreams]);

  // Drop cached rows when toggling off so a later toggle-on retries after silent provider fallbacks.
  useEffect(() => {
    if (!translateComments) {
      setTranslations(new Map());
    }
  }, [translateComments]);

  const onNeedTranslate = useCallback((items: CommentItem[]) => {
    if (!translateComments || items.length === 0) return;
    const pending = items.filter((item) => !translationsRef.current.has(item.rpid));
    if (pending.length === 0) return;
    const texts = pending.map((item) => item.message);
    void bridge.translate(texts, { context: "bilibili video comments" }).then((results) => {
      setTranslations((prev) => {
        const next = new Map(prev);
        pending.forEach((item, i) => {
          next.set(item.rpid, results[i] ?? item.message);
        });
        return next;
      });
    });
  }, [translateComments]);

  const applyCaption = useCallback(
    async (track: SubtitleTrackInfo, mode: CaptionMode) => {
      if (!mpdXml) return;
      const iframe = iframeRef.current;
      if (!iframe) return;

      const key = cacheKey(video.cid, track.url, mode);
      setCaptionError(null);
      setMenuOpen(false);

      try {
        let built = vttCache.get(key);
        if (!built) {
          const lines = await bridge.getSubtitleLines(track.url);
          const settings = await bridge.getSettings();
          const targetLang = settings.targetLang || "en";
          const label = modeLabel(track, mode, targetLang);
          let vttLines: SubtitleLine[];
          let language = track.lan;

          if (mode === "original") {
            vttLines = lines;
            setCaptionProgress(null);
          } else {
            setCaptionProgress(0);
            const translated = await translateAllLines(lines, setCaptionProgress);
            if (mode === "translated") {
              vttLines = lines.map((line, i) => ({
                from: line.from,
                to: line.to,
                content: translated[i] ?? line.content,
              }));
              language = targetLang;
            } else {
              vttLines = mergeDualLines(lines, translated);
            }
            setCaptionProgress(null);
          }

          const vtt = subtitleLinesToVtt(vttLines, { label });
          built = { label, language, vtt };
          vttCache.set(key, built);
        }

        const videoEl = iframe.contentDocument?.querySelector("video");
        const t = videoEl?.currentTime ?? 0;
        subtitlesRef.current = [built];
        setActiveCaption(built.label);
        await reloadPlayerAndFeed(mpdXml, t);
      } catch (err) {
        setCaptionProgress(null);
        skipAutoFeedRef.current = false;
        setCaptionError(err instanceof Error ? err.message : String(err));
      }
    },
    [mpdXml, reloadPlayerAndFeed, video.cid],
  );

  const descText = descEn && !showOriginalDesc ? descEn : video.desc;
  const showSpinner = !fed && !metaError;
  const noCaptions = tracks !== null && tracks.length === 0;
  const ccLabel =
    captionProgress != null
      ? `${captionProgress}%`
      : activeCaption
        ? "CC"
        : "CC";

  return (
    <div className="video-page">
      <div className="video-main">
        {metaError && <div className="error-banner">{metaError}</div>}
        <div className="player-wrap">
          <iframe
            ref={iframeRef}
            id="player"
            title="Player"
            src={PLAYER_SRC}
            allow="autoplay; fullscreen"
            onLoad={() => setIframeLoaded(true)}
          />
          {showSpinner && (
            <div className="player-overlay" aria-busy="true" aria-label="Loading player">
              <div className="player-spinner" />
            </div>
          )}
        </div>
        <div className="player-bar">
          <div className="captions-control">
            <button
              type="button"
              className={`cc-btn${activeCaption ? " active" : ""}`}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              disabled={tracks === null || captionProgress != null}
              onClick={() => setMenuOpen((o) => !o)}
              title="Captions"
            >
              {captionProgress != null ? `${captionProgress}%` : ccLabel}
            </button>
            {menuOpen && (
              <div className="captions-menu" role="menu">
                {noCaptions ? (
                  <div className="captions-empty">No captions available</div>
                ) : (
                  tracks?.map((track) => (
                    <div key={track.url} className="captions-track">
                      <div className="captions-track-label">
                        <span>{track.lanDoc}</span>
                        {track.aiGenerated && <span className="ai-badge">AI</span>}
                      </div>
                      <div className="captions-track-actions">
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => void applyCaption(track, "original")}
                        >
                          Original
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => void applyCaption(track, "translated")}
                        >
                          Translated
                        </button>
                        <button
                          type="button"
                          role="menuitem"
                          onClick={() => void applyCaption(track, "dual")}
                        >
                          Dual
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          {captionError && <span className="captions-error">{captionError}</span>}
        </div>
        <div className="video-meta">
          <h1>{titleEn ?? video.title}</h1>
          {titleEn && <p className="original-title">{video.title}</p>}
          <div className="uploader">{video.owner.name}</div>
          <div className="stats-row">
            <span>{formatCount(video.stat.view)} views</span>
            <span>{formatCount(video.stat.like)} likes</span>
            <span>{formatCount(video.stat.reply)} comments</span>
          </div>
          <div className="desc-block">
            <div className="desc-toolbar">
              <button
                type="button"
                className="toggle-btn"
                aria-pressed={!showOriginalDesc && !!descEn}
                onClick={() => setShowOriginalDesc((v) => !v)}
                disabled={!descEn}
              >
                {showOriginalDesc || !descEn ? "Translate" : "Show original"}
              </button>
            </div>
            {descText}
          </div>
        </div>
      </div>
      <CommentsPanel
        aid={video.aid}
        translateOn={translateComments}
        onTranslateToggle={setTranslateComments}
        translations={translations}
        onNeedTranslate={onNeedTranslate}
      />
    </div>
  );
}
