/** Western abbreviations: 812 | 70.9K | 709K | 3.4M | 1.2B */
export function formatCount(n: number): string {
  const value = Number.isFinite(n) ? Math.max(0, n) : 0;
  if (value < 1_000) return String(Math.round(value));
  if (value < 1_000_000) {
    if (value < 100_000) {
      return `${parseFloat((value / 1_000).toFixed(1))}K`;
    }
    return `${Math.round(value / 1_000)}K`;
  }
  if (value < 1_000_000_000) {
    return `${parseFloat((value / 1_000_000).toFixed(1))}M`;
  }
  return `${parseFloat((value / 1_000_000_000).toFixed(1))}B`;
}

/** Parse bilibili-style counts ("70.9万", "3.4亿") or plain numbers. */
export function parseCjkCount(s: string | number): number {
  if (typeof s === "number") {
    return Number.isFinite(s) ? s : 0;
  }
  const trimmed = s.trim();
  if (!trimmed) return 0;
  if (/万/.test(trimmed)) {
    const n = Number.parseFloat(trimmed.replace(/万/g, ""));
    return Number.isFinite(n) ? n * 10_000 : 0;
  }
  if (/亿/.test(trimmed)) {
    const n = Number.parseFloat(trimmed.replace(/亿/g, ""));
    return Number.isFinite(n) ? n * 100_000_000 : 0;
  }
  const n = Number.parseFloat(trimmed.replace(/,/g, ""));
  return Number.isFinite(n) ? n : 0;
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
