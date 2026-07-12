import type {
  ChannelInfo,
  ChannelVideosPage,
  CommentPage,
  LoginPollResult,
  LoginPollStatus,
  LoginQr,
  LoginState,
  PlayUrlResult,
  SearchUsersPage,
  SearchVideosPage,
  SubtitleLine,
  SubtitleTrackInfo,
  VideoId,
  VideoInfo,
} from "@bili/types";
import {
  normalizeCommentPage,
  normalizeChannelInfo,
  normalizeChannelVideos,
  normalizePlayUrl,
  normalizeReplyPage,
  normalizeSearchUsers,
  normalizeSearchVideos,
  normalizeSubtitleLines,
  normalizeSubtitles,
  normalizeVideoInfo,
} from "./normalizers.js";
import { encWbi, type WbiParams } from "./wbi.js";

export const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const API_ORIGIN = "https://api.bilibili.com";
const PASSPORT_ORIGIN = "https://passport.bilibili.com";
const SESSION_COOKIE_NAMES = new Set(["SESSDATA", "bili_jct", "DedeUserID", "DedeUserID__ckMd5", "sid"]);
const SEARCH_COOKIE_NAMES = new Set(["buvid3", "buvid4", "b_nut"]);
const LOGIN_POLL_STATUSES = new Map<number, LoginPollStatus>([
  [86101, "waiting"],
  [86090, "scanned"],
  [86038, "expired"],
  [0, "success"],
]);

export class BiliApiError extends Error {
  constructor(
    public readonly code: number,
    message: string,
  ) {
    super(message);
    this.name = "BiliApiError";
  }
}

export interface BiliClientOptions {
  cookies?: Record<string, string>;
  userAgent?: string;
  fetch?: typeof fetch;
}

interface WbiKeys {
  imgKey: string;
  subKey: string;
  date: string;
}

interface ApiEnvelope {
  code?: unknown;
  message?: unknown;
  data?: unknown;
}

interface ApiResponse {
  data: unknown;
  response: Response;
}

interface ReplyFallbackCursor {
  replyFallback: true;
  roots: number[];
  rootIndex: number;
  pn: number;
  allCount: number;
}

function dateStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

function keyFromUrl(url: unknown): string {
  const pathname = new URL(String(url)).pathname;
  return pathname.slice(pathname.lastIndexOf("/") + 1).replace(/\.png$/, "");
}

function extractVideoId(input: string): VideoId | null {
  const bvid = input.match(/BV1[1-9A-HJ-NP-Za-km-z]{9}/)?.[0];
  if (bvid) return { bvid };
  const aid = input.match(/(?:^|[^A-Za-z0-9])av(\d+)(?:$|[^A-Za-z0-9])/i)?.[1];
  return aid ? { aid: Number(aid) } : null;
}

function isBilibiliVideo(url: string): boolean {
  try {
    const parsed = new URL(url);
    return (parsed.hostname === "bilibili.com" || parsed.hostname.endsWith(".bilibili.com")) &&
      parsed.pathname.includes("/video/");
  } catch {
    return false;
  }
}

function replyFallbackCursor(offset: string | null): ReplyFallbackCursor | null {
  if (!offset) return null;
  try {
    const value = JSON.parse(offset) as Partial<ReplyFallbackCursor>;
    if (
      value.replyFallback === true &&
      Array.isArray(value.roots) && value.roots.every((root) => typeof root === "number") &&
      typeof value.rootIndex === "number" &&
      typeof value.pn === "number" &&
      typeof value.allCount === "number"
    ) return value as ReplyFallbackCursor;
  } catch {
    // Server-issued offsets are opaque and need not be JSON understood by this client.
  }
  return null;
}

function object(value: unknown): Record<string, unknown> {
  return value !== null && typeof value === "object" ? value as Record<string, unknown> : {};
}

export class BiliClient {
  private readonly cookies = new Map<string, string>();
  private readonly fetchImpl: typeof fetch;
  private readonly userAgent: string;
  private bootstrapPromise: Promise<void> | undefined;
  private webBootstrapPromise: Promise<void> | undefined;
  private wbiKeys: WbiKeys | undefined;

  constructor(options: BiliClientOptions = {}) {
    this.fetchImpl = options.fetch ?? globalThis.fetch;
    this.userAgent = options.userAgent ?? DEFAULT_USER_AGENT;
    this.setCookies(options.cookies ?? {});
  }

  getCookies(): Record<string, string> {
    return Object.fromEntries(this.cookies);
  }

  setCookies(cookies: Record<string, string>): void {
    this.cookies.clear();
    for (const [name, value] of Object.entries(cookies)) this.cookies.set(name, value);
  }

  async bootstrap(): Promise<void> {
    if (!this.bootstrapPromise) {
      this.bootstrapPromise = this.loadBootstrap();
    }
    return this.bootstrapPromise;
  }

  async parseVideoUrl(input: string): Promise<VideoId> {
    await this.bootstrap();
    const direct = extractVideoId(input);
    if (direct) return direct;

    let current: URL;
    try {
      current = new URL(input);
    } catch {
      throw new BiliApiError(-1, `Unsupported video URL: ${input}`);
    }
    if (current.hostname !== "b23.tv" && !current.hostname.endsWith(".b23.tv")) {
      throw new BiliApiError(-1, `Unsupported video URL: ${input}`);
    }
    for (let hop = 0; hop < 3; hop += 1) {
      const response = await this.fetchImpl(current, { headers: this.headers(), redirect: "manual" });
      const location = response.headers.get("location");
      if (!location) break;
      current = new URL(location, current);
      const id = isBilibiliVideo(current.toString()) ? extractVideoId(current.toString()) : null;
      if (id) return id;
    }
    throw new BiliApiError(-1, `Unable to resolve b23.tv URL: ${input}`);
  }

  async getView(id: VideoId): Promise<VideoInfo> {
    await this.bootstrap();
    return normalizeVideoInfo(await this.request("/x/web-interface/view", this.videoParams(id)));
  }

  async getChannelInfo(mid: number): Promise<ChannelInfo> {
    await this.bootstrap();
    return normalizeChannelInfo(mid, await this.request("/x/web-interface/card", { mid }));
  }

  async getChannelVideos(mid: number, page: number): Promise<ChannelVideosPage> {
    await this.bootstrapWebCookies();
    return normalizeChannelVideos(await this.request("/x/series/recArchivesByKeywords", {
      mid,
      keywords: "",
      ps: 30,
      pn: page,
      orderby: "pubdate",
    }));
  }

  async searchVideos(keyword: string, page: number): Promise<SearchVideosPage> {
    await this.bootstrapWebCookies();
    return normalizeSearchVideos(await this.signedRequest("/x/web-interface/wbi/search/type", {
      search_type: "video",
      keyword,
      page,
    }), page);
  }

  async searchUsers(keyword: string, page: number): Promise<SearchUsersPage> {
    await this.bootstrapWebCookies();
    return normalizeSearchUsers(await this.signedRequest("/x/web-interface/wbi/search/type", {
      search_type: "bili_user",
      keyword,
      page,
    }), page);
  }

  async getPlayUrl(id: VideoId, cid: number): Promise<PlayUrlResult> {
    return normalizePlayUrl(
      await this.signedRequest("/x/player/wbi/playurl", {
        ...this.videoParams(id, "avid"),
        cid,
        fnval: 4048,
        fnver: 0,
        fourk: 1,
        qn: 80,
      }),
    );
  }

  async getComments(aid: number, offset: string | null): Promise<CommentPage> {
    const fallback = replyFallbackCursor(offset);
    if (fallback) return this.getCommentReplyPage(aid, fallback);

    const page = normalizeCommentPage(
      await this.signedRequest("/x/v2/reply/wbi/main", {
        type: 1,
        oid: aid,
        mode: 3,
        pagination_str: JSON.stringify({ offset: offset ?? "" }),
        plat: 1,
        web_location: 1315875,
      }),
    );
    if (page.nextOffset) return page;

    const roots = page.items.filter((item) => item.replyCount > 0).map((item) => item.rpid);
    if (page.allCount <= page.items.length || roots.length === 0) return page;
    return {
      ...page,
      isEnd: false,
      nextOffset: JSON.stringify({ replyFallback: true, roots, rootIndex: 0, pn: 1, allCount: page.allCount }),
    };
  }

  async getReplies(aid: number, root: number, pn: number): Promise<CommentPage> {
    await this.bootstrap();
    return normalizeReplyPage(
      await this.request("/x/v2/reply/reply", { type: 1, oid: aid, root, ps: 20, pn }),
      pn,
    );
  }

  async loginQrStart(): Promise<LoginQr> {
    const data = object(await this.request("/x/passport-login/web/qrcode/generate", {}, [], PASSPORT_ORIGIN));
    return { url: String(data.url ?? ""), qrcodeKey: String(data.qrcode_key ?? "") };
  }

  async loginQrPoll(qrcodeKey: string): Promise<LoginPollResult> {
    const { data, response } = await this.requestWithResponse(
      "/x/passport-login/web/qrcode/poll",
      { qrcode_key: qrcodeKey },
      [],
      PASSPORT_ORIGIN,
    );
    const result = object(data);
    const code = Number(result.code);
    const status = LOGIN_POLL_STATUSES.get(code);
    if (!status) throw new BiliApiError(code || -1, JSON.stringify(result));
    if (status === "success") {
      this.captureSessionCookies(response, result.url);
      await this.refreshWbiKeys();
    }
    return { status };
  }

  async getLoginState(): Promise<LoginState> {
    const data = object(await this.request("/x/web-interface/nav", {}, [-101]));
    if (!data.isLogin) return { loggedIn: false };
    return {
      loggedIn: true,
      uname: String(data.uname ?? ""),
      mid: Number(data.mid) || 0,
      face: String(data.face ?? ""),
    };
  }

  async logout(): Promise<void> {
    for (const name of SESSION_COOKIE_NAMES) this.cookies.delete(name);
  }

  async getSubtitles(id: VideoId, cid: number): Promise<SubtitleTrackInfo[]> {
    return normalizeSubtitles(await this.signedRequest("/x/player/wbi/v2", { ...this.videoParams(id), cid }));
  }

  async getSubtitleLines(url: string): Promise<SubtitleLine[]> {
    const response = await this.fetchImpl(url, { headers: this.headers() });
    return normalizeSubtitleLines(await response.json());
  }

  private async getCommentReplyPage(aid: number, cursor: ReplyFallbackCursor): Promise<CommentPage> {
    const root = cursor.roots[cursor.rootIndex];
    if (root === undefined) return { items: [], nextOffset: null, isEnd: true, allCount: cursor.allCount };

    const page = await this.getReplies(aid, root, cursor.pn);
    const next = !page.isEnd
      ? { ...cursor, pn: cursor.pn + 1 }
      : cursor.rootIndex + 1 < cursor.roots.length
        ? { ...cursor, rootIndex: cursor.rootIndex + 1, pn: 1 }
        : null;
    return { ...page, allCount: cursor.allCount, isEnd: next === null, nextOffset: next ? JSON.stringify(next) : null };
  }

  private async loadBootstrap(): Promise<void> {
    const finger = await this.request("/x/frontend/finger/spi");
    const fingerData = finger as Record<string, unknown>;
    if (typeof fingerData.b_3 === "string") this.cookies.set("buvid3", fingerData.b_3);
    if (typeof fingerData.b_4 === "string") this.cookies.set("buvid4", fingerData.b_4);
    await this.refreshWbiKeys();
  }

  private async bootstrapWebCookies(): Promise<void> {
    if (!this.webBootstrapPromise) this.webBootstrapPromise = this.loadWebCookies();
    return this.webBootstrapPromise;
  }

  private async loadWebCookies(): Promise<void> {
    await this.bootstrap();
    const response = await this.fetchImpl("https://www.bilibili.com/", { headers: this.headers() });
    this.captureCookies(response, SEARCH_COOKIE_NAMES);
  }

  private async refreshWbiKeys(): Promise<void> {
    const nav = (await this.request("/x/web-interface/nav", {}, [-101])) as Record<string, unknown>;
    const image = (nav.wbi_img ?? {}) as Record<string, unknown>;
    this.wbiKeys = { imgKey: keyFromUrl(image.img_url), subKey: keyFromUrl(image.sub_url), date: dateStamp() };
  }

  private async signedRequest(path: string, params: WbiParams): Promise<unknown> {
    await this.bootstrap();
    if (this.wbiKeys?.date !== dateStamp()) await this.refreshWbiKeys();
    try {
      return await this.request(path, encWbi(params, this.wbiKeys!.imgKey, this.wbiKeys!.subKey));
    } catch (error) {
      if (!(error instanceof BiliApiError) || error.code !== -403) throw error;
      await this.refreshWbiKeys();
      return this.request(path, encWbi(params, this.wbiKeys!.imgKey, this.wbiKeys!.subKey));
    }
  }

  private videoParams(id: VideoId, aidKey = "aid"): WbiParams {
    if (id.bvid) return { bvid: id.bvid };
    if (id.aid !== undefined) return { [aidKey]: id.aid };
    throw new BiliApiError(-1, "A VideoId must contain bvid or aid");
  }

  private headers(): Headers {
    const headers = new Headers({ "User-Agent": this.userAgent, Referer: "https://www.bilibili.com/" });
    if (this.cookies.size > 0) headers.set("Cookie", [...this.cookies].map(([name, value]) => `${name}=${value}`).join("; "));
    return headers;
  }

  private captureSessionCookies(response: Response, url: unknown): void {
    this.captureCookies(response, SESSION_COOKIE_NAMES);
    try {
      const params = new URL(String(url)).searchParams;
      for (const name of SESSION_COOKIE_NAMES) {
        if (!this.cookies.has(name) && params.has(name)) this.cookies.set(name, params.get(name)!);
      }
    } catch {
      // A missing/empty success URL is valid when Set-Cookie carried the session.
    }
  }

  private captureCookies(response: Response, names: Set<string>): void {
    const headers = response.headers as Headers & { getSetCookie?: () => string[] };
    const setCookies = headers.getSetCookie?.() ?? (headers.get("set-cookie") ? [headers.get("set-cookie")!] : []);
    for (const cookie of setCookies) {
      const pair = cookie.slice(0, cookie.indexOf(";") === -1 ? cookie.length : cookie.indexOf(";"));
      const separator = pair.indexOf("=");
      if (separator === -1) continue;
      const name = pair.slice(0, separator);
      const value = pair.slice(separator + 1);
      if (name && names.has(name)) this.cookies.set(name, value);
    }
  }

  private async request(
    path: string,
    params: WbiParams = {},
    allowedCodes: number[] = [],
    origin = API_ORIGIN,
  ): Promise<unknown> {
    return (await this.requestWithResponse(path, params, allowedCodes, origin)).data;
  }

  private async requestWithResponse(
    path: string,
    params: WbiParams = {},
    allowedCodes: number[] = [],
    origin = API_ORIGIN,
  ): Promise<ApiResponse> {
    const url = new URL(path, origin);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
    const response = await this.fetchImpl(url, { headers: this.headers() });
    const body = (await response.json()) as ApiEnvelope;
    if (body.code !== 0 && !allowedCodes.includes(Number(body.code))) {
      throw new BiliApiError(Number(body.code) || -1, JSON.stringify(body));
    }
    return { data: body.data, response };
  }
}
