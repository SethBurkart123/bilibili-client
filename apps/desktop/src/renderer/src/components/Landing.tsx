import type { FormEvent } from "react";
import type { RecentEntry } from "../lib/format";

interface Props {
  url: string;
  onUrlChange: (url: string) => void;
  onSubmit: (url: string) => void;
  recent: RecentEntry[];
  busy: boolean;
}

export function Landing({ url, onUrlChange, onSubmit, recent, busy }: Props) {
  function handleSubmit(e: FormEvent): void {
    e.preventDefault();
    onSubmit(url);
  }

  return (
    <div className="landing">
      <div className="landing-logo" aria-hidden>
        B
      </div>
      <h1>Bili Translate</h1>
      <p>Paste a bilibili URL or BV id to open a video with translated title, description, and comments.</p>
      <form className="landing-form" onSubmit={handleSubmit}>
        <input
          className="url-input large"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder="https://www.bilibili.com/video/BV… or BV…"
          aria-label="Bilibili video URL"
          autoFocus
        />
        <button className="primary-btn large" type="submit" disabled={busy || !url.trim()}>
          {busy ? "Opening…" : "Open"}
        </button>
      </form>
      {recent.length > 0 && (
        <div className="recent">
          <h2>Recent</h2>
          <ul className="recent-list">
            {recent.map((entry) => (
              <li key={entry.url}>
                <button type="button" onClick={() => onSubmit(entry.url)}>
                  <span className="recent-title">{entry.title}</span>
                  <span className="recent-url">{entry.url}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
