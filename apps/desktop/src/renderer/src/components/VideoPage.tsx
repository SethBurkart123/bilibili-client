import { useCallback, useEffect, useRef, useState } from "react";
import type { CommentItem, PlayUrlResult, VideoInfo } from "@bili/types";
import { bridge } from "../lib/bridge";
import { formatCount } from "../lib/format";
import { CommentsPanel } from "./CommentsPanel";

interface Props {
  video: VideoInfo;
}

export function VideoPage({ video }: Props) {
  const [playUrl, setPlayUrl] = useState<PlayUrlResult | null>(null);
  const [titleEn, setTitleEn] = useState<string | null>(null);
  const [descEn, setDescEn] = useState<string | null>(null);
  const [showOriginalDesc, setShowOriginalDesc] = useState(false);
  const [translateComments, setTranslateComments] = useState(false);
  const [translations, setTranslations] = useState<Map<number, string>>(() => new Map());
  const [metaError, setMetaError] = useState<string | null>(null);
  const translationsRef = useRef(translations);
  translationsRef.current = translations;

  useEffect(() => {
    let cancelled = false;
    setMetaError(null);
    setTitleEn(null);
    setDescEn(null);
    setPlayUrl(null);
    setTranslations(new Map());
    setShowOriginalDesc(false);

    void (async () => {
      try {
        const [{ playUrl: streams }, translated] = await Promise.all([
          bridge.getStreams({ bvid: video.bvid, aid: video.aid }, video.cid),
          bridge.translate([video.title, video.desc], {
            context: "bilibili video title and description",
          }),
        ]);
        if (cancelled) return;
        setPlayUrl(streams);
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

  return (
    <div className="video-page">
      <div className="video-main">
        {metaError && <div className="error-banner">{metaError}</div>}
        <div className="player-wrap">
          <iframe id="player" title="Player" src="/player/index.html" />
          <div className="player-overlay">
            FastStream player placeholder — assets land here after integration
          </div>
        </div>
        {playUrl && (
          <div className="quality-chips" aria-label="Available qualities">
            {playUrl.acceptDescription.map((label) => (
              <span key={label} className="chip">
                {label}
              </span>
            ))}
          </div>
        )}
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
