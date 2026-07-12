import { useCallback, useEffect, useRef, useState } from "react";
import type { VideoInfo } from "@bili/types";
import { bridge } from "./lib/bridge";
import { loadRecent, pushRecent, type RecentEntry } from "./lib/format";
import { ChannelPage } from "./components/ChannelPage";
import { Landing } from "./components/Landing";
import { SearchPage } from "./components/SearchPage";
import { SettingsModal } from "./components/SettingsModal";
import { VideoPage } from "./components/VideoPage";

type View =
  | { kind: "landing" }
  | { kind: "video"; video: VideoInfo; sourceUrl: string }
  | { kind: "channel"; mid: number }
  | { kind: "search"; query: string };

export default function App() {
  const [view, setView] = useState<View>({ kind: "landing" });
  const [history, setHistory] = useState<View[]>([]);
  const viewRef = useRef(view);
  const historyRef = useRef(history);
  viewRef.current = view;
  historyRef.current = history;

  const [url, setUrl] = useState("");
  const [recent, setRecent] = useState<RecentEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loginState, setLoginState] = useState<{
    loggedIn: boolean;
    uname?: string;
    mid?: number;
    face?: string;
  }>({ loggedIn: false });
  const [sessionEpoch, setSessionEpoch] = useState(0);
  const [settingsEpoch, setSettingsEpoch] = useState(0);
  /** Bumps on every openVideo call so slower earlier resolves cannot overwrite newer ones. */
  const openVideoSeq = useRef(0);

  useEffect(() => {
    setRecent(loadRecent());
    void bridge.getLoginState().then(setLoginState);
  }, []);

  const navigate = useCallback((next: View) => {
    setHistory((prev) => [...prev, viewRef.current]);
    setView(next);
    setError(null);
  }, []);

  const openVideo = useCallback(async (raw: string, opts?: { replace?: boolean }) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    const seq = ++openVideoSeq.current;
    setBusy(true);
    setError(null);
    try {
      const video = await bridge.resolveVideo(trimmed);
      if (seq !== openVideoSeq.current) return;
      // Always replace with a single canonical URL — never keep a pasted/concatenated raw value.
      const canonical = `https://www.bilibili.com/video/${video.bvid}`;
      setRecent(pushRecent({ url: canonical, title: video.title, visitedAt: Date.now() }));
      setUrl(canonical);
      const next: View = { kind: "video", video, sourceUrl: canonical };
      const current = viewRef.current;
      if (opts?.replace || current.kind === "video") {
        setView(next);
      } else {
        setHistory((prev) => [...prev, current]);
        setView(next);
      }
    } catch (err) {
      if (seq !== openVideoSeq.current) return;
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      if (seq === openVideoSeq.current) setBusy(false);
    }
  }, []);

  function goBack(): void {
    const stack = historyRef.current;
    if (stack.length === 0) {
      setView({ kind: "landing" });
      setError(null);
      return;
    }
    setHistory(stack.slice(0, -1));
    setView(stack[stack.length - 1]!);
    setError(null);
  }

  function onHeaderSubmit(): void {
    void openVideo(url, { replace: true });
  }

  function openChannel(mid: number): void {
    const current = viewRef.current;
    if (current.kind === "channel" && current.mid === mid) return;
    navigate({ kind: "channel", mid });
  }

  function openSearch(query = ""): void {
    if (viewRef.current.kind === "search") {
      setView({ kind: "search", query });
      return;
    }
    navigate({ kind: "search", query });
  }

  function onLoginStateChange(state: typeof loginState): void {
    const wasLoggedIn = loginState.loggedIn;
    setLoginState(state);
    if (state.loggedIn !== wasLoggedIn) {
      setSessionEpoch((n) => n + 1);
    }
  }

  const showBack = view.kind !== "landing";
  const showVideoUrlBar = view.kind === "video";

  return (
    <div className="app-shell">
      <header className="header">
        {showBack ? (
          <button
            type="button"
            className="icon-btn"
            aria-label="Back"
            onClick={goBack}
            title="Back"
          >
            ←
          </button>
        ) : (
          <div className="header-brand">
            Bili <span>Translate</span>
          </div>
        )}
        {showVideoUrlBar && (
          <>
            <input
              className="url-input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onFocus={(e) => e.currentTarget.select()}
              onKeyDown={(e) => {
                if (e.key === "Enter") onHeaderSubmit();
              }}
              placeholder="bilibili URL / BV id"
              aria-label="Video URL"
              autoComplete="off"
            />
            <button
              type="button"
              className="primary-btn"
              onClick={onHeaderSubmit}
              disabled={busy || !url.trim()}
            >
              Go
            </button>
          </>
        )}
        <div
          style={{
            flex:
              view.kind === "landing" || view.kind === "channel" || view.kind === "search"
                ? 1
                : undefined,
          }}
        />
        {view.kind !== "search" && (
          <button
            type="button"
            className="icon-btn"
            aria-label="Search"
            title="Search"
            onClick={() => openSearch("")}
          >
            ⌕
          </button>
        )}
        <button
          type="button"
          className="login-indicator"
          aria-label={loginState.loggedIn ? `Account: ${loginState.uname ?? "Logged in"}` : "Log in"}
          title={loginState.loggedIn ? loginState.uname ?? "Account" : "Log in"}
          onClick={() => setSettingsOpen(true)}
        >
          {loginState.loggedIn && loginState.face ? (
            <img
              className="login-indicator-avatar"
              src={loginState.face}
              alt=""
              referrerPolicy="no-referrer"
            />
          ) : (
            <span className="login-indicator-fallback" aria-hidden>
              {loginState.loggedIn ? (loginState.uname?.[0] ?? "?") : "In"}
            </span>
          )}
        </button>
        <button
          type="button"
          className="icon-btn"
          aria-label="Settings"
          title="Settings"
          onClick={() => setSettingsOpen(true)}
        >
          ⚙
        </button>
      </header>

      {error && <div className="error-banner">{error}</div>}

      {view.kind === "landing" && (
        <Landing
          url={url}
          onUrlChange={setUrl}
          onSubmit={(value) => void openVideo(value)}
          recent={recent}
          busy={busy}
        />
      )}
      {view.kind === "video" && (
        <VideoPage
          video={view.video}
          sessionEpoch={sessionEpoch}
          settingsEpoch={settingsEpoch}
          onOpenChannel={openChannel}
        />
      )}
      {view.kind === "channel" && (
        <ChannelPage mid={view.mid} onOpenVideo={(bvid) => void openVideo(bvid)} />
      )}
      {view.kind === "search" && (
        <SearchPage
          initialQuery={view.query}
          onOpenVideo={(bvid) => void openVideo(bvid)}
          onOpenChannel={openChannel}
          onQueryChange={(query) => setView({ kind: "search", query })}
        />
      )}

      <SettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        loginState={loginState}
        onLoginStateChange={onLoginStateChange}
        onSaved={() => setSettingsEpoch((n) => n + 1)}
      />
    </div>
  );
}
