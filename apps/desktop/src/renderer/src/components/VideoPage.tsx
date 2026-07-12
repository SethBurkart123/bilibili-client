import { useCallback, useEffect, useRef, useState } from "react";
import type { CommentItem, SubtitleLine, SubtitleTrackInfo, VideoInfo } from "@bili/types";
import { addSubtitleTracks, feedPlayer, mergeDualLines, subtitleLinesToVtt } from "@bili/player";
import type { FeedSubtitleTrack } from "@bili/player";
import { bridge } from "../lib/bridge";
import { formatCount, parseCjkCount } from "../lib/format";
import { CommentsPanel } from "./CommentsPanel";

interface Props {
  video: VideoInfo;
  sessionEpoch: number;
  settingsEpoch?: number;
  onOpenChannel?: (mid: number) => void;
}

const REFRESH_COOLDOWN_MS = 12_000;
const STALL_GRACE_MS = 6_000;
/** How long the media element can sit in `waiting` before we re-fetch streams. */
const WAITING_REFRESH_MS = 10_000;
/** How long currentTime can freeze while "playing" before treating as a hang. */
const FREEZE_REFRESH_MS = 12_000;
const TRANSLATE_BATCH = 50;
const PLAYER_SRC = "./player/index.html";
const PLAYER_READY_TIMEOUT_MS = 12_000;
const EN_LABEL = "English (translated)";
const DUAL_LABEL = "Dual (EN + 中文)";

interface CaptionCacheEntry {
  lines: SubtitleLine[];
  original: FeedSubtitleTrack;
  translated?: FeedSubtitleTrack[];
}

/** Session-scoped cache keyed by cid + track url. */
const captionCache = new Map<string, CaptionCacheEntry>();

function cacheKey(cid: number, trackUrl: string): string {
  return `${cid}|${trackUrl}`;
}

function originalLabel(track: SubtitleTrackInfo): string {
  return track.lanDoc + (track.aiGenerated ? " (AI)" : "");
}

function pickTranslateSource(tracks: SubtitleTrackInfo[]): SubtitleTrackInfo {
  return (
    tracks.find((t) => t.lan.startsWith("zh") || t.lan.startsWith("ai-zh")) ?? tracks[0]!
  );
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

async function ensureOriginalCached(
  cid: number,
  track: SubtitleTrackInfo,
): Promise<CaptionCacheEntry> {
  const key = cacheKey(cid, track.url);
  const existing = captionCache.get(key);
  if (existing) return existing;

  const lines = await bridge.getSubtitleLines(track.url);
  const label = originalLabel(track);
  const vtt = subtitleLinesToVtt(lines, { label });
  const entry: CaptionCacheEntry = {
    lines,
    original: { label, language: track.lan, vtt },
  };
  captionCache.set(key, entry);
  return entry;
}

async function restorePosition(
  iframe: HTMLIFrameElement,
  time: number,
  previousVideo: HTMLVideoElement | null,
): Promise<void> {
  const deadline = Date.now() + 8_000;
  while (Date.now() < deadline) {
    const video = iframe.contentDocument?.querySelector("video");
    if (video && video !== previousVideo && video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
      if (Number.isFinite(time) && time > 0) {
        video.currentTime = time;
      }
      return;
    }
    await new Promise((r) => setTimeout(r, 50));
  }
}

type PlayerWindow = Window & {
  fastStream?: unknown;
  __biliPlayerReady?: boolean;
};

/** Wait until FastStream has finished setup (and can accept postMessage sources). */
function waitForPlayerReady(
  iframe: HTMLIFrameElement,
  isCancelled: () => boolean,
): Promise<boolean> {
  return new Promise((resolve) => {
    const win = iframe.contentWindow as PlayerWindow | null;
    if (!win) {
      resolve(false);
      return;
    }

    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      window.removeEventListener("message", onMessage);
      clearInterval(poll);
      clearTimeout(timer);
      resolve(ok);
    };

    const isReady = (): boolean => {
      try {
        return Boolean(win.__biliPlayerReady && win.fastStream);
      } catch {
        return false;
      }
    };

    const onMessage = (event: MessageEvent) => {
      if (event.source !== win) return;
      if (event.data?.type === "player-ready") finish(true);
    };

    const poll = setInterval(() => {
      if (isCancelled()) {
        finish(false);
        return;
      }
      if (isReady()) finish(true);
    }, 50);

    const timer = setTimeout(() => {
      // Last-chance fallback: fastStream may exist even if the ready flag was missed.
      try {
        if (win.fastStream) {
          finish(true);
          return;
        }
      } catch {
        // ignore cross-origin / destroyed frame
      }
      finish(false);
    }, PLAYER_READY_TIMEOUT_MS);

    window.addEventListener("message", onMessage);
    if (isReady()) finish(true);
  });
}

export function VideoPage({ video, sessionEpoch, settingsEpoch = 0, onOpenChannel }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeLoaded, setIframeLoaded] = useState(false);
  const [mpdXml, setMpdXml] = useState<string | null>(null);
  const [fed, setFed] = useState(false);
  const [titleEn, setTitleEn] = useState<string | null>(null);
  const [descEn, setDescEn] = useState<string | null>(null);
  const [ownerEn, setOwnerEn] = useState<string | null>(null);
  const [showOriginalDesc, setShowOriginalDesc] = useState(false);
  const [translateComments, setTranslateComments] = useState(false);
  const [translations, setTranslations] = useState<Map<number, string>>(() => new Map());
  const [metaError, setMetaError] = useState<string | null>(null);
  const translationsRef = useRef(translations);
  translationsRef.current = translations;

  const [tracks, setTracks] = useState<SubtitleTrackInfo[] | null>(null);
  const [translateProgress, setTranslateProgress] = useState<number | null>(null);
  const [captionsTranslated, setCaptionsTranslated] = useState(false);
  const [captionError, setCaptionError] = useState<string | null>(null);
  const subtitlesRef = useRef<FeedSubtitleTrack[] | undefined>(undefined);
  /** Translated tracks to re-inject after a feed (stream-expiry / login). */
  const translatedTracksRef = useRef<FeedSubtitleTrack[] | undefined>(undefined);
  const pendingSeekRef = useRef<number | null>(null);
  const fedRef = useRef(false);

  const lastRefreshAt = useRef(0);
  const lastFeedAt = useRef(0);
  const refreshing = useRef(false);
  const sessionEpochRef = useRef(sessionEpoch);

  const reinjectTranslated = useCallback(() => {
    const iframe = iframeRef.current;
    const translated = translatedTracksRef.current;
    if (!iframe?.contentWindow || !translated?.length) return;
    addSubtitleTracks(iframe, translated, { activateLabel: EN_LABEL });
  }, []);

  const feed = useCallback(
    (xml: string) => {
      const iframe = iframeRef.current;
      if (!iframe?.contentWindow) return false;
      const previousVideo = iframe.contentDocument?.querySelector("video") ?? null;
      const subs = subtitlesRef.current;
      feedPlayer(iframe, xml, subs ? { subtitles: subs } : undefined);
      lastFeedAt.current = Date.now();
      fedRef.current = true;
      setFed(true);

      const seekTo = pendingSeekRef.current;
      pendingSeekRef.current = null;
      if (seekTo != null) {
        // FastStream owns autoplay. We only restore position after a refresh;
        // a second play() call here races its source replacement.
        void restorePosition(iframe, seekTo, previousVideo);
      }

      // Re-inject user-translated tracks after re-feed (from cache; no re-translation).
      reinjectTranslated();
      return true;
    },
    [reinjectTranslated],
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
      // Capture position before re-feed; the mpdXml effect feeds + seeks + re-injects.
      if (iframeRef.current && iframeLoaded) {
        const videoEl = iframeRef.current.contentDocument?.querySelector("video");
        pendingSeekRef.current = videoEl?.currentTime ?? 0;
      }
      setMpdXml(next);
    } catch (err) {
      setMetaError(err instanceof Error ? err.message : String(err));
    } finally {
      refreshing.current = false;
    }
  }, [iframeLoaded, video.aid, video.bvid, video.cid]);

  // Reset + load streams / meta / captions independently so translate or subtitle
  // failures never block playback.
  useEffect(() => {
    let cancelled = false;
    setMetaError(null);
    setTitleEn(null);
    setDescEn(null);
    setOwnerEn(null);
    setMpdXml(null);
    setFed(false);
    fedRef.current = false;
    setIframeLoaded(false);
    setTranslations(new Map());
    setShowOriginalDesc(false);
    setTracks(null);
    setTranslateProgress(null);
    setCaptionsTranslated(false);
    setCaptionError(null);
    subtitlesRef.current = undefined;
    translatedTracksRef.current = undefined;
    pendingSeekRef.current = null;
    lastRefreshAt.current = 0;
    lastFeedAt.current = 0;

    void (async () => {
      try {
        const { mpdXml: xml } = await bridge.getStreams(
          { bvid: video.bvid, aid: video.aid },
          video.cid,
        );
        if (!cancelled) setMpdXml(xml);
      } catch (err) {
        if (!cancelled) setMetaError(err instanceof Error ? err.message : String(err));
      }
    })();

    void (async () => {
      try {
        const translated = await bridge.translate([video.title, video.desc, video.owner.name], {
          context: "bilibili video title and description",
        });
        if (cancelled) return;
        setTitleEn(translated[0] ?? null);
        setDescEn(translated[1] ?? null);
        setOwnerEn(translated[2] ?? null);
      } catch {
        // Keep Chinese originals; translation is best-effort.
      }
    })();

    void (async () => {
      try {
        const subs = await bridge.getSubtitles({ bvid: video.bvid, aid: video.aid }, video.cid);
        if (cancelled) return;

        const originals: CaptionCacheEntry[] = [];
        for (const track of subs) {
          try {
            originals.push(await ensureOriginalCached(video.cid, track));
          } catch (err) {
            console.warn("Failed to load subtitle track", track.lan, err);
          }
        }
        if (cancelled) return;

        const originalTracks =
          originals.length > 0 ? originals.map((e) => e.original) : undefined;
        subtitlesRef.current = originalTracks;

        if (subs.length > 0) {
          const source = pickTranslateSource(subs);
          const cached = captionCache.get(cacheKey(video.cid, source.url));
          if (cached?.translated) {
            translatedTracksRef.current = cached.translated;
            setCaptionsTranslated(true);
          }
        }

        setTracks(subs);

        // Captions often arrive after the first feed — inject without reloading the stream.
        const iframe = iframeRef.current;
        if (fedRef.current && iframe?.contentWindow && originalTracks?.length) {
          addSubtitleTracks(iframe, originalTracks);
          reinjectTranslated();
        }
      } catch (err) {
        if (!cancelled) {
          console.warn("Failed to load subtitles", err);
          setTracks([]);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [video, reinjectTranslated]);

  useEffect(() => {
    if (sessionEpochRef.current === sessionEpoch) return;
    sessionEpochRef.current = sessionEpoch;
    if (sessionEpoch > 0) {
      void refreshStreams("login");
    }
  }, [sessionEpoch, refreshStreams]);

  useEffect(() => {
    if (!iframeLoaded || !mpdXml) return;
    let cancelled = false;

    void (async () => {
      const iframe = iframeRef.current;
      if (!iframe) return;
      const ready = await waitForPlayerReady(iframe, () => cancelled);
      if (cancelled) return;
      if (!ready) {
        setMetaError("Player failed to initialize");
        return;
      }
      if (!feed(mpdXml) && !cancelled) {
        setMetaError("Player iframe is not ready");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [feed, iframeLoaded, mpdXml]);

  useEffect(() => {
    if (!iframeLoaded || !fed) return;
    const iframe = iframeRef.current;
    const doc = iframe?.contentDocument;
    if (!iframe || !doc) return;

    const hooked = new WeakSet<HTMLMediaElement>();
    const waitingTimers = new Map<HTMLMediaElement, ReturnType<typeof setTimeout>>();
    let freezeTimer: ReturnType<typeof setInterval> | undefined;
    let lastTime = -1;
    let frozenSince: number | null = null;
    let playbackStarted = false;

    const onError = () => {
      void refreshStreams("error");
    };
    const onStalled = () => {
      if (!playbackStarted) return;
      void refreshStreams("stalled");
    };
    const clearWaiting = (el: HTMLMediaElement) => {
      const t = waitingTimers.get(el);
      if (t) clearTimeout(t);
      waitingTimers.delete(el);
    };
    const onWaiting = (event: Event) => {
      if (!playbackStarted) return;
      const el = event.currentTarget as HTMLMediaElement;
      clearWaiting(el);
      waitingTimers.set(
        el,
        setTimeout(() => {
          waitingTimers.delete(el);
          void refreshStreams("waiting");
        }, WAITING_REFRESH_MS),
      );
    };
    const onPlaying = (event: Event) => {
      playbackStarted = true;
      clearWaiting(event.currentTarget as HTMLMediaElement);
      frozenSince = null;
    };
    const onCanPlay = (event: Event) => {
      clearWaiting(event.currentTarget as HTMLMediaElement);
    };

    const hookMedia = (el: HTMLMediaElement) => {
      if (hooked.has(el)) return;
      hooked.add(el);
      el.addEventListener("error", onError);
      el.addEventListener("stalled", onStalled);
      el.addEventListener("waiting", onWaiting);
      el.addEventListener("playing", onPlaying);
      el.addEventListener("canplay", onCanPlay);
    };

    const scan = () => {
      doc.querySelectorAll("video, audio").forEach((node) => {
        hookMedia(node as HTMLMediaElement);
      });
    };

    scan();
    const observer = new MutationObserver(scan);
    observer.observe(doc.documentElement, { childList: true, subtree: true });

    // Detect "playing" freezes where the element never fires stalled/error.
    freezeTimer = setInterval(() => {
      const videoEl = doc.querySelector("video");
      if (!playbackStarted || !videoEl || videoEl.paused || videoEl.ended) {
        frozenSince = null;
        lastTime = videoEl?.currentTime ?? -1;
        return;
      }
      const t = videoEl.currentTime;
      if (Math.abs(t - lastTime) < 0.05) {
        if (frozenSince == null) frozenSince = Date.now();
        else if (Date.now() - frozenSince >= FREEZE_REFRESH_MS) {
          frozenSince = null;
          void refreshStreams("frozen");
        }
      } else {
        frozenSince = null;
      }
      lastTime = t;
    }, 1500);

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
      if (freezeTimer) clearInterval(freezeTimer);
      for (const t of waitingTimers.values()) clearTimeout(t);
      waitingTimers.clear();
    };
  }, [fed, iframeLoaded, refreshStreams]);

  // Drop cached rows when toggling off so a later toggle-on retries after silent provider fallbacks.
  useEffect(() => {
    if (!translateComments) {
      setTranslations(new Map());
    }
  }, [translateComments]);

  const onNeedTranslate = useCallback(
    (items: CommentItem[]) => {
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
    },
    [translateComments],
  );

  const onTranslateCaptions = useCallback(async () => {
    if (!tracks?.length || captionsTranslated || translateProgress != null) return;
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;

    const source = pickTranslateSource(tracks);
    const key = cacheKey(video.cid, source.url);
    setCaptionError(null);

    try {
      let entry = captionCache.get(key);
      if (!entry) {
        entry = await ensureOriginalCached(video.cid, source);
      }

      if (entry.translated) {
        translatedTracksRef.current = entry.translated;
        setCaptionsTranslated(true);
        addSubtitleTracks(iframe, entry.translated, { activateLabel: EN_LABEL });
        return;
      }

      setTranslateProgress(0);
      const translatedTexts = await translateAllLines(entry.lines, setTranslateProgress);
      const enLines = entry.lines.map((line, i) => ({
        from: line.from,
        to: line.to,
        content: translatedTexts[i] ?? line.content,
      }));
      const dualLines = mergeDualLines(entry.lines, translatedTexts);
      const built: FeedSubtitleTrack[] = [
        {
          label: EN_LABEL,
          language: "en",
          vtt: subtitleLinesToVtt(enLines, { label: EN_LABEL }),
        },
        {
          label: DUAL_LABEL,
          language: "en",
          vtt: subtitleLinesToVtt(dualLines, { label: DUAL_LABEL }),
        },
      ];
      entry.translated = built;
      captionCache.set(key, entry);
      translatedTracksRef.current = built;
      setTranslateProgress(null);
      setCaptionsTranslated(true);
      addSubtitleTracks(iframe, built, { activateLabel: EN_LABEL });
    } catch (err) {
      setTranslateProgress(null);
      setCaptionError(err instanceof Error ? err.message : String(err));
    }
  }, [captionsTranslated, tracks, translateProgress, video.cid]);

  const descText = descEn && !showOriginalDesc ? descEn : video.desc;
  const showSpinner = !fed && !metaError;
  const noCaptions = tracks !== null && tracks.length === 0;
  const hasCaptions = tracks !== null && tracks.length > 0;

  let translateBtnLabel = "Translate captions";
  if (captionsTranslated) {
    translateBtnLabel = "Captions translated ✓";
  } else if (translateProgress != null) {
    translateBtnLabel = `Translating… ${translateProgress}%`;
  }

  return (
    <div className="video-page">
      <div className="video-main">
        {metaError && <div className="error-banner">{metaError}</div>}
        <div className="player-wrap">
          <iframe
            key={video.bvid}
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
          {noCaptions && <span className="captions-note">No captions available</span>}
          {hasCaptions && (
            <button
              type="button"
              className={`translate-captions-btn${captionsTranslated ? " done" : ""}`}
              disabled={captionsTranslated || translateProgress != null}
              onClick={() => void onTranslateCaptions()}
            >
              {translateBtnLabel}
            </button>
          )}
          {captionError && <span className="captions-error">{captionError}</span>}
        </div>
        <div className="video-meta">
          <h1>{titleEn ?? video.title}</h1>
          {titleEn && <p className="original-title">{video.title}</p>}
          <button
            type="button"
            className="uploader"
            onClick={() => onOpenChannel?.(video.owner.mid)}
            disabled={!onOpenChannel}
            title="Open channel"
          >
            {video.owner.name}
            {ownerEn && ownerEn !== video.owner.name && (
              <span className="uploader-translated"> ({ownerEn})</span>
            )}
          </button>
          <div className="stats-row">
            {`${formatCount(parseCjkCount(video.stat.view))} views · ${formatCount(parseCjkCount(video.stat.like))} likes · ${formatCount(parseCjkCount(video.stat.reply))} comments`}
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
        settingsEpoch={settingsEpoch}
      />
    </div>
  );
}
