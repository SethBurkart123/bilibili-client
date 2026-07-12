import { useCallback, useEffect, useState, type FormEvent } from "react";
import type { UserCard, VideoCard } from "@bili/types";
import { bridge } from "../lib/bridge";
import { formatCount } from "../lib/format";
import { VideoCardGrid } from "./VideoCardGrid";

const TRANSLATE_QUERY_KEY = "bili.search.translateQuery";

/** Session cache: mid -> translated name */
const userNameCache = new Map<number, string>();

function loadTranslateQueryPref(): boolean {
  try {
    return localStorage.getItem(TRANSLATE_QUERY_KEY) === "1";
  } catch {
    return false;
  }
}

function saveTranslateQueryPref(on: boolean): void {
  try {
    localStorage.setItem(TRANSLATE_QUERY_KEY, on ? "1" : "0");
  } catch {
    // ignore
  }
}

type Tab = "videos" | "channels";

interface Props {
  initialQuery: string;
  onOpenVideo: (bvid: string) => void;
  onOpenChannel: (mid: number) => void;
  onQueryChange?: (query: string) => void;
}

export function SearchPage({
  initialQuery,
  onOpenVideo,
  onOpenChannel,
  onQueryChange,
}: Props) {
  const [input, setInput] = useState(initialQuery);
  const [activeQuery, setActiveQuery] = useState(initialQuery.trim());
  const [searchedFor, setSearchedFor] = useState<string | null>(null);
  const [translateQuery, setTranslateQuery] = useState(loadTranslateQueryPref);
  const [tab, setTab] = useState<Tab>("videos");

  const [videos, setVideos] = useState<VideoCard[]>([]);
  const [videoPage, setVideoPage] = useState(1);
  const [videosHasMore, setVideosHasMore] = useState(false);

  const [users, setUsers] = useState<UserCard[]>([]);
  const [userPage, setUserPage] = useState(1);
  const [usersHasMore, setUsersHasMore] = useState(false);
  const [userNamesEn, setUserNamesEn] = useState<Map<number, string>>(() => new Map());

  const [busy, setBusy] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setInput(initialQuery);
  }, [initialQuery]);

  const resolveKeyword = useCallback(
    async (trimmed: string, shouldTranslate: boolean): Promise<{ keyword: string; zh: string | null }> => {
      if (!shouldTranslate) return { keyword: trimmed, zh: null };
      const [zh] = await bridge.translate([trimmed], { to: "zh-CN" });
      const keyword = (zh ?? trimmed).trim() || trimmed;
      return { keyword, zh: keyword };
    },
    [],
  );

  const runSearch = useCallback(
    async (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return;

      setBusy(true);
      setError(null);
      setVideos([]);
      setUsers([]);
      setVideoPage(1);
      setUserPage(1);
      setVideosHasMore(false);
      setUsersHasMore(false);
      setSearchedFor(null);
      onQueryChange?.(trimmed);

      try {
        const { keyword, zh } = await resolveKeyword(trimmed, translateQuery);
        if (zh) setSearchedFor(zh);

        setActiveQuery(trimmed);
        const [videoPageResult, userPageResult] = await Promise.all([
          bridge.searchVideos(keyword, 1),
          bridge.searchUsers(keyword, 1),
        ]);
        setVideos(videoPageResult.items);
        setVideosHasMore(videoPageResult.hasMore);
        setVideoPage(1);
        setUsers(userPageResult.items);
        setUsersHasMore(userPageResult.hasMore);
        setUserPage(1);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setBusy(false);
      }
    },
    [onQueryChange, resolveKeyword, translateQuery],
  );

  useEffect(() => {
    if (initialQuery.trim()) {
      void runSearch(initialQuery);
    }
    // Mount-only: seed results when opened with a query.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const pending: UserCard[] = [];
    const cached = new Map<number, string>();
    for (const user of users) {
      const hit = userNameCache.get(user.mid);
      if (hit != null) cached.set(user.mid, hit);
      else pending.push(user);
    }
    if (cached.size > 0) {
      setUserNamesEn((prev) => {
        const next = new Map(prev);
        for (const [k, v] of cached) next.set(k, v);
        return next;
      });
    }
    if (pending.length === 0) return;
    let cancelled = false;
    void bridge
      .translate(
        pending.map((u) => u.name),
        { context: "bilibili user names" },
      )
      .then((results) => {
        if (cancelled) return;
        setUserNamesEn((prev) => {
          const next = new Map(prev);
          pending.forEach((user, i) => {
            const t = results[i] ?? user.name;
            userNameCache.set(user.mid, t);
            next.set(user.mid, t);
          });
          return next;
        });
      })
      .catch(() => {
        /* ignore */
      });
    return () => {
      cancelled = true;
    };
  }, [users]);

  function onToggleTranslateQuery(on: boolean): void {
    setTranslateQuery(on);
    saveTranslateQueryPref(on);
  }

  function onSubmit(e: FormEvent): void {
    e.preventDefault();
    void runSearch(input);
  }

  const loadMoreVideos = useCallback(async () => {
    if (loadingMore || !videosHasMore || !activeQuery) return;
    setLoadingMore(true);
    try {
      const keyword = searchedFor ?? (await resolveKeyword(activeQuery, translateQuery)).keyword;
      const next = videoPage + 1;
      const result = await bridge.searchVideos(keyword, next);
      setVideos((prev) => [...prev, ...result.items]);
      setVideosHasMore(result.hasMore);
      setVideoPage(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingMore(false);
    }
  }, [
    activeQuery,
    loadingMore,
    resolveKeyword,
    searchedFor,
    translateQuery,
    videoPage,
    videosHasMore,
  ]);

  const loadMoreUsers = useCallback(async () => {
    if (loadingMore || !usersHasMore || !activeQuery) return;
    setLoadingMore(true);
    try {
      const keyword = searchedFor ?? (await resolveKeyword(activeQuery, translateQuery)).keyword;
      const next = userPage + 1;
      const result = await bridge.searchUsers(keyword, next);
      setUsers((prev) => [...prev, ...result.items]);
      setUsersHasMore(result.hasMore);
      setUserPage(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingMore(false);
    }
  }, [
    activeQuery,
    loadingMore,
    resolveKeyword,
    searchedFor,
    translateQuery,
    userPage,
    usersHasMore,
  ]);

  return (
    <div className="search-page">
      <form className="search-bar" onSubmit={onSubmit}>
        <input
          className="url-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search videos or channels…"
          aria-label="Search"
          autoFocus
        />
        <label className="search-translate-toggle">
          <input
            type="checkbox"
            checked={translateQuery}
            onChange={(e) => onToggleTranslateQuery(e.target.checked)}
          />
          Translate query to Chinese
        </label>
        <button className="primary-btn" type="submit" disabled={busy || !input.trim()}>
          {busy ? "Searching…" : "Search"}
        </button>
      </form>
      {searchedFor && (
        <p className="search-queried-for">searched for: {searchedFor}</p>
      )}
      {error && <div className="error-banner">{error}</div>}

      <div className="search-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "videos"}
          className={`search-tab${tab === "videos" ? " active" : ""}`}
          onClick={() => setTab("videos")}
        >
          Videos
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "channels"}
          className={`search-tab${tab === "channels" ? " active" : ""}`}
          onClick={() => setTab("channels")}
        >
          Channels
        </button>
      </div>

      {busy && <p className="status-line">Searching…</p>}

      {!busy && tab === "videos" && (
        <>
          {activeQuery ? (
            <VideoCardGrid items={videos} onOpen={onOpenVideo} />
          ) : (
            <p className="status-line">Enter a query to search</p>
          )}
          {videosHasMore && (
            <button
              type="button"
              className="ghost-btn load-more"
              onClick={() => void loadMoreVideos()}
              disabled={loadingMore}
            >
              {loadingMore ? "Loading…" : "Load more"}
            </button>
          )}
        </>
      )}

      {!busy && tab === "channels" && (
        <>
          {users.length === 0 ? (
            <p className="status-line">
              {activeQuery ? "No channels found" : "Enter a query to search"}
            </p>
          ) : (
            <ul className="user-card-list">
              {users.map((user) => {
                const nameEn = userNamesEn.get(user.mid);
                return (
                  <li key={user.mid}>
                    <button
                      type="button"
                      className="user-card"
                      onClick={() => onOpenChannel(user.mid)}
                    >
                      <img
                        className="user-card-face"
                        src={user.face}
                        alt=""
                        referrerPolicy="no-referrer"
                      />
                      <div className="user-card-body">
                        <div className="user-card-name">
                          {user.name}
                          {nameEn && nameEn !== user.name && (
                            <span className="user-card-name-translated"> ({nameEn})</span>
                          )}
                        </div>
                        <div className="user-card-stats">
                          {formatCount(user.followers)} followers · {formatCount(user.videos)}{" "}
                          videos
                        </div>
                        {user.sign && (
                          <div className="user-card-sign">{user.sign}</div>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          {usersHasMore && (
            <button
              type="button"
              className="ghost-btn load-more"
              onClick={() => void loadMoreUsers()}
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
