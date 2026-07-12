export function formatCount(n: number): string {
  if (n >= 100_000_000) return `${(n / 100_000_000).toFixed(1)}亿`;
  if (n >= 10_000) return `${(n / 10_000).toFixed(1)}万`;
  return n.toLocaleString();
}

export function relativeTime(ctime: number): string {
  const seconds = Math.max(0, Math.floor(Date.now() / 1000) - ctime);
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 86400 * 30) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(ctime * 1000).toLocaleDateString();
}

const EMOTE_TOKEN = /(\[[^\]]+\])/g;

export function splitEmotes(message: string): Array<{ type: "text" | "emote"; value: string }> {
  const parts: Array<{ type: "text" | "emote"; value: string }> = [];
  let last = 0;
  for (const match of message.matchAll(EMOTE_TOKEN)) {
    const index = match.index ?? 0;
    if (index > last) {
      parts.push({ type: "text", value: message.slice(last, index) });
    }
    parts.push({ type: "emote", value: match[0] });
    last = index + match[0].length;
  }
  if (last < message.length) {
    parts.push({ type: "text", value: message.slice(last) });
  }
  return parts.length ? parts : [{ type: "text", value: message }];
}

const RECENT_KEY = "bili.recent";

export interface RecentEntry {
  url: string;
  title: string;
  visitedAt: number;
}

export function loadRecent(): RecentEntry[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as RecentEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function pushRecent(entry: RecentEntry): RecentEntry[] {
  const next = [
    entry,
    ...loadRecent().filter((r) => r.url !== entry.url),
  ].slice(0, 12);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  return next;
}
