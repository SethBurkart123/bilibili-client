// FROZEN CONTRACT — shared types for the bilibili-client MVP.
// No lane may edit this file during the fleet run. Deviations go in the lane's
// CONCERNS report and are reconciled by the orchestrator at integration.

// ---------- video identity ----------

export interface VideoId {
  bvid?: string;
  aid?: number;
}

// ---------- video info (normalized from x/web-interface/view) ----------

export interface VideoOwner {
  mid: number;
  name: string;
  face: string;
}

export interface VideoStat {
  view: number;
  danmaku: number;
  reply: number;
  like: number;
  coin: number;
  favorite: number;
  share: number;
}

export interface VideoPage {
  cid: number;
  page: number;
  part: string;
  duration: number;
  dimension?: { width: number; height: number; rotate: number };
}

export interface VideoInfo {
  bvid: string;
  aid: number;
  title: string;
  desc: string;
  pic: string;
  pubdate: number;
  duration: number;
  owner: VideoOwner;
  stat: VideoStat;
  cid: number;
  pages: VideoPage[];
}

// ---------- streams (normalized from x/player/wbi/playurl DASH) ----------

export interface DashSegmentBase {
  initialization: string;
  indexRange: string;
}

export interface DashTrack {
  id: number;
  baseUrl: string;
  backupUrl: string[];
  bandwidth: number;
  mimeType: string;
  codecs: string;
  codecid: number;
  segmentBase: DashSegmentBase;
  width?: number;
  height?: number;
  frameRate?: string;
}

export interface DashInfo {
  duration: number;
  minBufferTime: number;
  video: DashTrack[];
  audio: DashTrack[];
}

export interface PlayUrlResult {
  acceptQuality: number[];
  acceptDescription: string[];
  dash: DashInfo;
}

export const QN_LABELS: Record<number, string> = {
  6: "240P",
  16: "360P",
  32: "480P",
  64: "720P",
  74: "720P60",
  80: "1080P",
  112: "1080P+",
  116: "1080P60",
  120: "4K",
  125: "HDR",
  126: "Dolby Vision",
  127: "8K",
};

// ---------- comments (normalized from x/v2/reply/wbi/main) ----------

export interface CommentAuthor {
  mid: string;
  uname: string;
  avatar: string;
}

export interface CommentEmote {
  text: string;
  url: string;
}

export interface CommentItem {
  rpid: number;
  author: CommentAuthor;
  message: string;
  /** emote token (e.g. "[doge]") -> emote image info */
  emotes: Record<string, CommentEmote>;
  like: number;
  ctime: number;
  replyCount: number;
  /** one-level preview replies only; full thread via getReplies */
  replies: CommentItem[];
}

export interface CommentPage {
  items: CommentItem[];
  /** hot comments, present on page 1 only */
  hots?: CommentItem[];
  /** opaque cursor for the next page; null when exhausted */
  nextOffset: string | null;
  isEnd: boolean;
  allCount: number;
}

// ---------- translation ----------

export interface TranslateOptions {
  /** source language, default "zh-CN" */
  from?: string;
  /** target language, default "en" */
  to?: string;
  /** optional hint about what the texts are (e.g. "bilibili video comments") */
  context?: string;
}

export interface Translator {
  /** returns translations in the same order/length as `texts` */
  translateBatch(texts: string[], opts?: TranslateOptions): Promise<string[]>;
}

export type TranslatorProvider = "google" | "openai";

export interface TranslatorSettings {
  provider: TranslatorProvider;
  targetLang: string;
  openai?: { baseURL: string; apiKey: string; model: string };
}

// ---------- subtitles ----------

export interface SubtitleTrackInfo {
  /** language code, e.g. "zh-CN", "ai-zh" */
  lan: string;
  /** human-readable language label */
  lanDoc: string;
  /** subtitle JSON url (may be protocol-relative upstream; normalized to https) */
  url: string;
  aiGenerated: boolean;
}

export interface SubtitleLine {
  /** start time in seconds */
  from: number;
  /** end time in seconds */
  to: number;
  content: string;
}

// ---------- login (QR) ----------

export interface LoginQr {
  /** content to render as a QR code */
  url: string;
  qrcodeKey: string;
}

export type LoginPollStatus = "waiting" | "scanned" | "expired" | "success";

export interface LoginPollResult {
  status: LoginPollStatus;
}

export interface LoginState {
  loggedIn: boolean;
  uname?: string;
  mid?: number;
  face?: string;
}

// ---------- Electron IPC bridge (renderer -> main) ----------
// Exposed on window.bili by the preload script. The desktop app implements
// this against mocks during the fleet run; integration swaps in real services.

export interface BiliBridge {
  /** parse any bilibili URL / BV / av id and fetch video info */
  resolveVideo(url: string): Promise<VideoInfo>;
  /** fetch DASH streams + a ready-to-play MPD XML for the given part */
  getStreams(id: VideoId, cid: number): Promise<{ playUrl: PlayUrlResult; mpdXml: string }>;
  /** first page: offset null; then pass previous nextOffset */
  getComments(aid: number, offset: string | null): Promise<CommentPage>;
  getReplies(aid: number, root: number, pn: number): Promise<CommentPage>;
  translate(texts: string[], opts?: TranslateOptions): Promise<string[]>;
  getSettings(): Promise<TranslatorSettings>;
  setSettings(s: TranslatorSettings): Promise<void>;
  /** subtitle tracks for a part; empty when the video has none (common) */
  getSubtitles(id: VideoId, cid: number): Promise<SubtitleTrackInfo[]>;
  /** fetch + parse a subtitle track's timed lines */
  getSubtitleLines(url: string): Promise<SubtitleLine[]>;
  loginQrStart(): Promise<LoginQr>;
  /** on "success" the main process persists session cookies before resolving */
  loginQrPoll(qrcodeKey: string): Promise<LoginPollResult>;
  getLoginState(): Promise<LoginState>;
  logout(): Promise<void>;
}
