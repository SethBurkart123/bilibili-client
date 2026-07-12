import { useEffect, useState } from "react";
import type { VideoCard } from "@bili/types";
import { bridge } from "../lib/bridge";
import { formatCount } from "../lib/format";

/** Session cache: bvid -> translated title */
const titleCache = new Map<string, string>();

export function formatDuration(duration?: number | string): string {
  if (duration == null || duration === "") return "";
  if (typeof duration === "string") {
    const trimmed = duration.trim();
    if (/^\d+:\d{2}(:\d{2})?$/.test(trimmed)) return trimmed;
    const n = Number.parseFloat(trimmed);
    if (!Number.isFinite(n)) return trimmed;
    return formatDuration(n);
  }
  const total = Math.max(0, Math.floor(duration));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${m}:${String(s).padStart(2, "0")}`;
}

export function formatPubdate(pubdate?: number): string {
  if (pubdate == null || !Number.isFinite(pubdate)) return "";
  const d = new Date(pubdate * 1000);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

interface Props {
  items: VideoCard[];
  onOpen: (bvid: string) => void;
}

export function VideoCardGrid({ items, onOpen }: Props) {
  const [titlesEn, setTitlesEn] = useState<Map<string, string>>(() => new Map());

  useEffect(() => {
    const fromCache = new Map<string, string>();
    const pending: VideoCard[] = [];
    for (const item of items) {
      const cached = titleCache.get(item.bvid);
      if (cached != null) {
        fromCache.set(item.bvid, cached);
      } else {
        pending.push(item);
      }
    }
    if (fromCache.size > 0) {
      setTitlesEn((prev) => {
        const next = new Map(prev);
        for (const [k, v] of fromCache) next.set(k, v);
        return next;
      });
    }
    if (pending.length === 0) return;

    let cancelled = false;
    void (async () => {
      const batchSize = 50;
      for (let i = 0; i < pending.length; i += batchSize) {
        const batch = pending.slice(i, i + batchSize);
        try {
          const results = await bridge.translate(
            batch.map((c) => c.title),
            { context: "bilibili video titles" },
          );
          if (cancelled) return;
          setTitlesEn((prev) => {
            const next = new Map(prev);
            batch.forEach((card, j) => {
              const t = results[j] ?? card.title;
              titleCache.set(card.bvid, t);
              next.set(card.bvid, t);
            });
            return next;
          });
        } catch {
          if (cancelled) return;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [items]);

  if (items.length === 0) {
    return <p className="status-line">No videos</p>;
  }

  return (
    <div className="video-card-grid">
      {items.map((card) => {
        const titleEn = titlesEn.get(card.bvid);
        const duration = formatDuration(card.duration);
        const pubdate = formatPubdate(card.pubdate);
        const views =
          card.views != null ? `${formatCount(card.views)} views` : null;
        return (
          <button
            key={card.bvid}
            type="button"
            className="video-card"
            onClick={() => onOpen(card.bvid)}
          >
            <div className="video-card-thumb">
              <img src={card.pic} alt="" referrerPolicy="no-referrer" loading="lazy" />
              {duration && <span className="video-card-duration">{duration}</span>}
            </div>
            <div className="video-card-body">
              <div className="video-card-title">{titleEn ?? card.title}</div>
              {titleEn && titleEn !== card.title && (
                <div className="video-card-title-original">{card.title}</div>
              )}
              <div className="video-card-meta">
                {[views, pubdate].filter(Boolean).join(" · ")}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
