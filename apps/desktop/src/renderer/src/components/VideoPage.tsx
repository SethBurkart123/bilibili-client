import { useCallback, useEffect, useRef, useState } from "react";
import type { CommentItem, VideoInfo } from "@bili/types";
import { feedPlayer } from "@bili/player";
import { bridge } from "../lib/bridge";
import { formatCount } from "../lib/format";
import { CommentsPanel } from "./CommentsPanel";

interface Props {
  video: VideoInfo;
}

const REFRESH_COOLDOWN_MS = 15_000;
const STALL_GRACE_MS = 8_000;

export function VideoPage({ video }: Props) {
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

  const lastRefreshAt = useRef(0);
  const lastFeedAt = useRef(0);
  const refreshing = useRef(false);

  const feed = useCallback((xml: string) => {
    const iframe = iframeRef.current;
    if (!iframe?.contentWindow) return;
    feedPlayer(iframe, xml);
    lastFeedAt.current = Date.now();
    setFed(true);
  }, []);

  const refreshStreams = useCallback(async (reason: string) => {
    const now = Date.now();
    if (refreshing.current) return;
    if (now - lastRefreshAt.current < REFRESH_COOLDOWN_MS) return;
    if (now - lastFeedAt.current < STALL_GRACE_MS && reason === "stalled") return;

    refreshing.current = true;
    lastRefreshAt.current = now;
    try {
      const { mpdXml: next } = await bridge.getStreams(
        { bvid: video.bvid, aid: video.aid },
        video.cid,
      );
      setMpdXml(next);
      if (iframeRef.current && iframeLoaded) {
        feed(next);
      }
    } catch (err) {
      setMetaError(err instanceof Error ? err.message : String(err));
    } finally {
      refreshing.current = false;
    }
  }, [feed, iframeLoaded, video.aid, video.bvid, video.cid]);

  useEffect(() => {
    let cancelled = false;
    setMetaError(null);
    setTitleEn(null);
    setDescEn(null);
    setMpdXml(null);
    setFed(false);
    setTranslations(new Map());
    setShowOriginalDesc(false);
    lastRefreshAt.current = 0;
    lastFeedAt.current = 0;

    void (async () => {
      try {
        const [{ mpdXml: xml }, translated] = await Promise.all([
          bridge.getStreams({ bvid: video.bvid, aid: video.aid }, video.cid),
          bridge.translate([video.title, video.desc], {
            context: "bilibili video title and description",
          }),
        ]);
        if (cancelled) return;
        setMpdXml(xml);
        setTitleEn(translated[0] ?? null);
        setDescEn(translated[1] ?? null);
      } catch (err) {
        if (!cancelled) setMetaError(err instanceof Error ? err.message : String(err));
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [video]);

  useEffect(() => {
    if (!iframeLoaded || !mpdXml) return;
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

  const descText = descEn && !showOriginalDesc ? descEn : video.desc;
  const showSpinner = !fed && !metaError;

  return (
    <div className="video-page">
      <div className="video-main">
        {metaError && <div className="error-banner">{metaError}</div>}
        <div className="player-wrap">
          <iframe
            ref={iframeRef}
            id="player"
            title="Player"
            src="/player/index.html"
            allow="autoplay; fullscreen"
            onLoad={() => setIframeLoaded(true)}
          />
          {showSpinner && (
            <div className="player-overlay" aria-busy="true" aria-label="Loading player">
              <div className="player-spinner" />
            </div>
          )}
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
