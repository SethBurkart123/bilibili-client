import { useEffect, useRef, useState } from "react";
import type { CommentItem } from "@bili/types";
import { bridge } from "../lib/bridge";
import { formatCount, parseCjkCount, relativeTime } from "../lib/format";
import { EmoteMessage } from "./EmoteMessage";

interface Props {
  aid: number;
  translateOn: boolean;
  onTranslateToggle: (on: boolean) => void;
  translations: Map<number, string>;
  onNeedTranslate: (items: CommentItem[]) => void;
  settingsEpoch?: number;
}

function CommentRow({
  item,
  aid,
  translateOn,
  translations,
  onNeedTranslate,
  showOriginalOnHover,
}: {
  item: CommentItem;
  aid: number;
  translateOn: boolean;
  translations: Map<number, string>;
  onNeedTranslate: (items: CommentItem[]) => void;
  showOriginalOnHover: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [replies, setReplies] = useState<CommentItem[]>(item.replies);
  const [loadingReplies, setLoadingReplies] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const translated = translations.get(item.rpid);

  async function toggleReplies(): Promise<void> {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
    if (replies.length > 0) {
      onNeedTranslate(replies);
      return;
    }
    setLoadingReplies(true);
    try {
      const page = await bridge.getReplies(aid, item.rpid, 1);
      setReplies(page.items);
      onNeedTranslate(page.items);
    } finally {
      setLoadingReplies(false);
    }
  }

  const likeCount = formatCount(parseCjkCount(item.like));
  const replyLabelCount = formatCount(parseCjkCount(item.replyCount));

  return (
    <article
      className={`comment-item${showOriginalOnHover ? " show-original-hover" : ""}`}
    >
      <img className="avatar" src={item.author.avatar} alt="" />
      <div>
        <div className="comment-head">
          <span className="uname">{item.author.uname}</span>
          <span className="ctime">{relativeTime(item.ctime)}</span>
        </div>
        <div className="comment-body">
          <div className="comment-message">
            {translateOn && translated ? (
              translated
            ) : (
              <EmoteMessage message={item.message} emotes={item.emotes} />
            )}
          </div>
          {translateOn && translated && (
            <div
              className={`comment-original${showOriginal ? " open" : ""}`}
              onClick={() => setShowOriginal((v) => !v)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setShowOriginal((v) => !v);
                }
              }}
            >
              Original: <EmoteMessage message={item.message} emotes={item.emotes} />
            </div>
          )}
        </div>
        <div className="comment-meta">
          <span>👍 {likeCount}</span>
          {item.replyCount > 0 && (
            <button type="button" className="linkish" onClick={() => void toggleReplies()}>
              {expanded ? "Hide replies" : `${replyLabelCount} replies`}
            </button>
          )}
        </div>
        {expanded && (
          <div className="replies">
            {loadingReplies && <div className="status-line">Loading replies…</div>}
            {replies.map((reply) => (
              <CommentRow
                key={reply.rpid}
                item={reply}
                aid={aid}
                translateOn={translateOn}
                translations={translations}
                onNeedTranslate={onNeedTranslate}
                showOriginalOnHover={showOriginalOnHover}
              />
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

export function CommentsPanel({
  aid,
  translateOn,
  onTranslateToggle,
  translations,
  onNeedTranslate,
  settingsEpoch = 0,
}: Props) {
  const [items, setItems] = useState<CommentItem[]>([]);
  const [hots, setHots] = useState<CommentItem[]>([]);
  const [nextOffset, setNextOffset] = useState<string | null>(null);
  const [isEnd, setIsEnd] = useState(false);
  const [allCount, setAllCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOriginalOnHover, setShowOriginalOnHover] = useState(true);
  const onNeedTranslateRef = useRef(onNeedTranslate);
  onNeedTranslateRef.current = onNeedTranslate;

  useEffect(() => {
    let cancelled = false;
    void bridge.getSettings().then((s) => {
      if (!cancelled) {
        setShowOriginalOnHover(s.ui?.showOriginalOnHover !== false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [settingsEpoch]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setItems([]);
    setHots([]);
    void bridge
      .getComments(aid, null)
      .then((page) => {
        if (cancelled) return;
        setItems(page.items);
        setHots(page.hots ?? []);
        setNextOffset(page.nextOffset);
        setIsEnd(page.isEnd);
        setAllCount(page.allCount);
        onNeedTranslateRef.current([...(page.hots ?? []), ...page.items]);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [aid]);

  useEffect(() => {
    if (!translateOn) return;
    onNeedTranslateRef.current([...hots, ...items]);
  }, [translateOn, hots, items]);

  async function loadMore(): Promise<void> {
    if (isEnd || nextOffset === null) return;
    setLoadingMore(true);
    try {
      const page = await bridge.getComments(aid, nextOffset);
      setItems((prev) => [...prev, ...page.items]);
      setNextOffset(page.nextOffset);
      setIsEnd(page.isEnd);
      setAllCount(page.allCount);
      onNeedTranslate(page.items);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <aside className="comments-panel">
      <div className="comments-header">
        <h2>{allCount ? `${formatCount(parseCjkCount(allCount))} comments` : "… comments"}</h2>
        <button
          type="button"
          className={`toggle-btn${translateOn ? " active" : ""}`}
          aria-pressed={translateOn}
          onClick={() => onTranslateToggle(!translateOn)}
        >
          Translate comments
        </button>
      </div>
      <div className="comments-list">
        {error && <div className="status-line">{error}</div>}
        {loading && <div className="status-line">Loading comments…</div>}
        {hots.map((item) => (
          <CommentRow
            key={`hot-${item.rpid}`}
            item={item}
            aid={aid}
            translateOn={translateOn}
            translations={translations}
            onNeedTranslate={onNeedTranslate}
            showOriginalOnHover={showOriginalOnHover}
          />
        ))}
        {items.map((item) => (
          <CommentRow
            key={item.rpid}
            item={item}
            aid={aid}
            translateOn={translateOn}
            translations={translations}
            onNeedTranslate={onNeedTranslate}
            showOriginalOnHover={showOriginalOnHover}
          />
        ))}
        {!isEnd && !loading && (
          <button
            type="button"
            className="ghost-btn load-more"
            onClick={() => void loadMore()}
            disabled={loadingMore}
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        )}
      </div>
    </aside>
  );
}
