import { useCallback, useEffect, useState } from "react";
import type { VideoInfo } from "@bili/types";
import { bridge } from "./lib/bridge";
import { loadRecent, pushRecent, type RecentEntry } from "./lib/format";
import { Landing } from "./components/Landing";
import { SettingsModal } from "./components/SettingsModal";
import { VideoPage } from "./components/VideoPage";

type View =
  | { kind: "landing" }
  | { kind: "video"; video: VideoInfo; sourceUrl: string };

export default function App() {
  const [view, setView] = useState<View>({ kind: "landing" });
  const [url, setUrl] = useState("");
  const [recent, setRecent] = useState<RecentEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    setRecent(loadRecent());
  }, []);

  const openVideo = useCallback(async (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    try {
      const video = await bridge.resolveVideo(trimmed);
      setRecent(pushRecent({ url: trimmed, title: video.title, visitedAt: Date.now() }));
      setUrl(trimmed);
      setView({ kind: "video", video, sourceUrl: trimmed });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  }, []);

  function goBack(): void {
    setView({ kind: "landing" });
    setError(null);
  }

  function onHeaderSubmit(): void {
    void openVideo(url);
  }

  return (
    <div className="app-shell">
      <header className="header">
        {view.kind === "video" ? (
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
        {view.kind === "video" && (
          <>
            <input
              className="url-input"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") onHeaderSubmit();
              }}
              placeholder="bilibili URL / BV id"
              aria-label="Video URL"
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
        <div style={{ flex: view.kind === "landing" ? 1 : undefined }} />
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

      {view.kind === "landing" ? (
        <Landing
          url={url}
          onUrlChange={setUrl}
          onSubmit={(value) => void openVideo(value)}
          recent={recent}
          busy={busy}
        />
      ) : (
        <VideoPage video={view.video} />
      )}

      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </div>
  );
}
