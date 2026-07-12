import type { CommentPage, PlayUrlResult, VideoId, VideoInfo } from "@bili/types";
import { normalizeCommentPage, normalizePlayUrl, normalizeReplyPage, normalizeVideoInfo } from "./normalizers.js";
import { encWbi, type WbiParams } from "./wbi.js";

export const DEFAULT_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";
const API_ORIGIN = "https://api.bilibili.com";

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

export class BiliClient {
  private readonly cookies = new Map<string, string>();
  private readonly fetchImpl: typeof fetch;
  private readonly userAgent: string;
  private bootstrapPromise: Promise<void> | undefined;
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

  private async request(path: string, params: WbiParams = {}, allowedCodes: number[] = []): Promise<unknown> {
    const url = new URL(path, API_ORIGIN);
    for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));
    const response = await this.fetchImpl(url, { headers: this.headers() });
    const body = (await response.json()) as ApiEnvelope;
    if (body.code !== 0 && !allowedCodes.includes(Number(body.code))) {
      throw new BiliApiError(Number(body.code) || -1, JSON.stringify(body));
    }
    return body.data;
  }
}
