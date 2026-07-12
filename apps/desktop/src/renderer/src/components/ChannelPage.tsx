import { useCallback, useEffect, useState } from "react";
import type { ChannelInfo, VideoCard } from "@bili/types";
import { bridge } from "../lib/bridge";
import { formatCount } from "../lib/format";
import { VideoCardGrid } from "./VideoCardGrid";

/** Session caches keyed by mid */
const nameCache = new Map<number, string>();
const signCache = new Map<number, string>();

interface Props {
  mid: number;
  onOpenVideo: (bvid: string) => void;
}

export function ChannelPage({ mid, onOpenVideo }: Props) {
  const [info, setInfo] = useState<ChannelInfo | null>(null);
  const [nameEn, setNameEn] = useState<string | null>(() => nameCache.get(mid) ?? null);
  const [signEn, setSignEn] = useState<string | null>(() => signCache.get(mid) ?? null);
  const [showOriginalSign, setShowOriginalSign] = useState(false);
  const [items, setItems] = useState<VideoCard[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [busy, setBusy] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setInfo(null);
    setItems([]);
    setPage(1);
    setHasMore(false);
    setBusy(true);
    setError(null);
    setShowOriginalSign(false);
    setNameEn(nameCache.get(mid) ?? null);
    setSignEn(signCache.get(mid) ?? null);

    void (async () => {
      try {
        const [channel, videos] = await Promise.all([
          bridge.getChannelInfo(mid),
          bridge.getChannelVideos(mid, 1),
        ]);
        if (cancelled) return;
        setInfo(channel);
        setItems(videos.items);
        setHasMore(videos.hasMore);
        setPage(1);

        const cachedName = nameCache.get(mid);
        const cachedSign = signCache.get(mid);
        if (cachedName != null && cachedSign != null) {
          setNameEn(cachedName);
          setSignEn(cachedSign);
        } else {
          const translated = await bridge.translate([channel.name, channel.sign], {
            context: "bilibili channel name and bio",
          });
          if (cancelled) return;
          const n = translated[0] ?? channel.name;
          const s = translated[1] ?? channel.sign;
          nameCache.set(mid, n);
          signCache.set(mid, s);
          setNameEn(n);
          setSignEn(s);
        }
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setBusy(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [mid]);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const videos = await bridge.getChannelVideos(mid, nextPage);
      setItems((prev) => [...prev, ...videos.items]);
      setHasMore(videos.hasMore);
      setPage(nextPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, mid, page]);

  const signText = signEn && !showOriginalSign ? signEn : (info?.sign ?? "");

  return (
    <div className="channel-page">
      {error && <div className="error-banner">{error}</div>}
      {busy && !info && <p className="status-line">Loading channel…</p>}
      {info && (
        <header className="channel-header">
          <img
            className="channel-face"
            src={info.face}
            alt=""
            referrerPolicy="no-referrer"
          />
          <div className="channel-header-body">
            <h1 className="channel-name">
              {info.name}
              {nameEn && nameEn !== info.name && (
                <span className="channel-name-translated"> ({nameEn})</span>
              )}
            </h1>
            {info.follower != null && (
              <div className="channel-followers">
                {formatCount(info.follower)} followers
              </div>
            )}
            {info.sign && (
              <div className="channel-sign">
                <div className="desc-toolbar">
                  <button
                    type="button"
                    className="toggle-btn"
                    aria-pressed={!showOriginalSign && !!signEn}
                    onClick={() => setShowOriginalSign((v) => !v)}
                    disabled={!signEn}
                  >
                    {showOriginalSign || !signEn ? "Translate" : "Show original"}
                  </button>
                </div>
                <div className="channel-sign-text">{signText}</div>
              </div>
            )}
          </div>
        </header>
      )}
      {!busy && (
        <>
          <VideoCardGrid items={items} onOpen={onOpenVideo} />
          {hasMore && (
            <button
              type="button"
              className="ghost-btn load-more"
              onClick={() => void loadMore()}
              disabled={loadingMore}
            >
              {loadingMore ? "Loading…" : "Load more"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
