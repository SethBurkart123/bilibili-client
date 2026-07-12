import { createServer, type IncomingMessage, type Server, type ServerResponse } from "node:http";
import { Readable } from "node:stream";

export const DESKTOP_CHROME_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

const DEFAULT_ALLOW_HOSTS = [
  /(^|\.)bilivideo\.(com|cn)$/i,
  /(^|\.)akamaized\.net$/i,
  /(^|\.)bilibili\.com$/i,
];

const MIRRORED_HEADERS = ["content-type", "content-length", "content-range", "accept-ranges"] as const;

/** Give up on a silent/hung CDN before the player freezes forever. */
const UPSTREAM_TIMEOUT_MS = 25_000;

export interface StreamProxyOptions {
  allowHosts?: RegExp[];
  headers?: Record<string, string>;
  /** Per-upstream fetch timeout in ms (headers + full body). */
  upstreamTimeoutMs?: number;
}

/**
 * A localhost-only proxy for CDN media requests.
 *
 * Future: add a progressive disk cache without changing this streaming contract.
 */
export class StreamProxy {
  private readonly allowHosts: RegExp[];
  private readonly headers: Record<string, string>;
  private readonly upstreamTimeoutMs: number;
  private server: Server | undefined;
  private port: number | undefined;
  private starting: Promise<number> | undefined;

  constructor(opts: StreamProxyOptions = {}) {
    this.allowHosts = opts.allowHosts ?? DEFAULT_ALLOW_HOSTS;
    this.upstreamTimeoutMs = opts.upstreamTimeoutMs ?? UPSTREAM_TIMEOUT_MS;
    this.headers = {
      ...withoutCookies(opts.headers ?? {}),
      Referer: "https://www.bilibili.com/",
      "User-Agent": DESKTOP_CHROME_UA,
      "Accept-Encoding": "identity",
    };
  }

  async start(): Promise<number> {
    if (this.port !== undefined) return this.port;
    if (this.starting) return this.starting;

    this.starting = new Promise<number>((resolve, reject) => {
      const server = createServer((req, res) => {
        void this.handle(req, res);
      });
      this.server = server;

      const onError = (error: Error) => {
        server.off("listening", onListening);
        this.server = undefined;
        this.starting = undefined;
        reject(error);
      };
      const onListening = () => {
        server.off("error", onError);
        const address = server.address();
        if (!address || typeof address === "string") {
          onError(new Error("Stream proxy did not bind to a TCP port"));
          return;
        }
        this.port = address.port;
        this.starting = undefined;
        resolve(address.port);
      };

      server.once("error", onError);
      server.once("listening", onListening);
      server.listen(0, "127.0.0.1");
    });
    return this.starting;
  }

  async stop(): Promise<void> {
    if (this.starting) await this.starting;
    const server = this.server;
    this.server = undefined;
    this.port = undefined;
    if (!server) return;
    server.closeAllConnections();
    if (!server.listening) return;
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }

  urlFor(upstreamUrl: string): string {
    if (this.port === undefined) {
      throw new Error("Stream proxy must be started before creating media URLs");
    }
    return `http://127.0.0.1:${this.port}/media?u=${encodeBase64Url(upstreamUrl)}`;
  }

  private async handle(req: IncomingMessage, res: ServerResponse): Promise<void> {
    // the player iframe lives on the renderer's origin, so every media XHR to this
    // loopback server is cross-origin and needs CORS (Range triggers a preflight)
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Expose-Headers", "Content-Range, Content-Length, Accept-Ranges, Content-Type");
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Range, Content-Type",
        "Access-Control-Max-Age": "86400",
      }).end();
      return;
    }
    if (req.method !== "GET" || !req.url) {
      res.writeHead(405).end();
      return;
    }

    let requestUrl: URL;
    try {
      requestUrl = new URL(req.url, "http://127.0.0.1");
    } catch {
      res.writeHead(400).end();
      return;
    }
    if (requestUrl.pathname !== "/media") {
      res.writeHead(404).end();
      return;
    }

    const upstream = this.decodeUpstreams(requestUrl.searchParams);
    if (upstream instanceof Error) {
      res.writeHead(upstream.message === "forbidden" ? 403 : 400).end();
      return;
    }

    const controller = new AbortController();
    let body: Readable | undefined;
    let upstreamBody: ReadableStream<Uint8Array> | undefined;
    const abortUpstream = () => {
      if (controller.signal.aborted) return;
      controller.abort();
      body?.destroy(new Error("Media proxy client disconnected"));
      void upstreamBody?.cancel().catch(() => undefined);
    };
    // Tear down upstream only if the client drops before we finish writing.
    // Do not listen to IncomingMessage "close" — it fires when the request is
    // fully received, which for GET is immediate and would kill live streams.
    const onClientGone = () => {
      if (!res.writableFinished) abortUpstream();
    };
    res.once("close", onClientGone);
    req.socket.once("close", onClientGone);
    res.once("finish", () => {
      req.socket.off("close", onClientGone);
    });

    try {
      const response = await this.fetchFirstAvailable(upstream, req, controller.signal);
      if (!response) {
        res.writeHead(502).end();
        return;
      }

      const headers: Record<string, string> = {};
      for (const name of MIRRORED_HEADERS) {
        const value = response.headers.get(name);
        if (value) headers[name] = value;
      }
      res.writeHead(response.status, headers);

      if (!response.body) {
        res.end();
        return;
      }
      upstreamBody = response.body;
      body = Readable.fromWeb(
        response.body as unknown as import("node:stream/web").ReadableStream,
      );
      body.on("error", (error) => {
        if (!res.destroyed) res.destroy(error);
      });
      body.pipe(res);
    } catch (error) {
      if (!res.destroyed) {
        if (!controller.signal.aborted) {
          console.warn("Media proxy request failed:", error);
        }
        if (!res.headersSent) res.writeHead(502).end();
        else res.destroy(error instanceof Error ? error : undefined);
      }
    }
  }

  private decodeUpstreams(params: URLSearchParams): URL[] | Error {
    const encodedPrimary = params.get("u");
    if (!encodedPrimary) return new Error("invalid");

    let rawUrls: unknown[];
    try {
      rawUrls = [decodeBase64Url(encodedPrimary)];
      const encodedBackups = params.get("b");
      if (encodedBackups) {
        const backups: unknown = JSON.parse(decodeBase64Url(encodedBackups));
        if (!Array.isArray(backups) || backups.some((url) => typeof url !== "string")) {
          return new Error("invalid");
        }
        rawUrls.push(...backups);
      }
    } catch {
      return new Error("invalid");
    }

    const urls: URL[] = [];
    for (const rawUrl of rawUrls) {
      try {
        const url = new URL(String(rawUrl));
        if (url.protocol !== "https:" || !this.allowHosts.some((pattern) => pattern.test(url.hostname))) {
          return new Error("forbidden");
        }
        urls.push(url);
      } catch {
        return new Error("invalid");
      }
    }
    return urls;
  }

  private async fetchFirstAvailable(
    upstreams: URL[],
    req: IncomingMessage,
    signal: AbortSignal,
  ): Promise<Response | undefined> {
    const headers = { ...this.headers };
    if (typeof req.headers.range === "string") headers.Range = req.headers.range;

    for (const upstream of upstreams) {
      // Timeout applies to time-to-headers only. Once headers arrive we keep
      // streaming under the client-disconnect signal so large ranges can finish.
      const local = new AbortController();
      const onClientAbort = () => local.abort();
      signal.addEventListener("abort", onClientAbort);
      const timer = setTimeout(() => local.abort(), this.upstreamTimeoutMs);
      try {
        const response = await fetch(upstream, {
          headers,
          credentials: "omit",
          signal: local.signal,
        });
        clearTimeout(timer);
        if (response.status < 400) {
          if (response.status === 206 && response.body) {
            // A CDN can close a range response early after sending valid headers.
            // Validate the finite range before committing Content-Length to
            // Chromium so a truncated primary can fall back to a backup URL.
            const bodyTimer = setTimeout(() => local.abort(), this.upstreamTimeoutMs);
            try {
              const bytes = new Uint8Array(await response.arrayBuffer());
              const expected = expectedRangeLength(response.headers);
              if (expected != null && bytes.byteLength !== expected) {
                throw new Error(`Truncated media range: expected ${expected}, received ${bytes.byteLength}`);
              }
              clearTimeout(bodyTimer);
              signal.removeEventListener("abort", onClientAbort);
              return new Response(bytes, {
                status: response.status,
                statusText: response.statusText,
                headers: response.headers,
              });
            } catch (error) {
              clearTimeout(bodyTimer);
              signal.removeEventListener("abort", onClientAbort);
              if (signal.aborted) throw error;
              continue;
            }
          }
          // Keep client-abort linked for the body stream lifetime.
          return response;
        }
        signal.removeEventListener("abort", onClientAbort);
        await response.body?.cancel();
      } catch (error) {
        clearTimeout(timer);
        signal.removeEventListener("abort", onClientAbort);
        if (signal.aborted) throw error;
        // Timed out or upstream error — try next backup URL.
      }
    }
    return undefined;
  }
}

function expectedRangeLength(headers: Headers): number | undefined {
  const contentRange = headers.get("content-range")?.match(/^bytes\s+(\d+)-(\d+)\/(?:\d+|\*)$/i);
  if (contentRange) {
    const start = Number(contentRange[1]);
    const end = Number(contentRange[2]);
    if (Number.isSafeInteger(start) && Number.isSafeInteger(end) && end >= start) {
      return end - start + 1;
    }
  }

  const contentLength = Number(headers.get("content-length"));
  return Number.isSafeInteger(contentLength) && contentLength >= 0 ? contentLength : undefined;
}

function withoutCookies(headers: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers).filter(([name]) => name.toLowerCase() !== "cookie"),
  );
}

function encodeBase64Url(value: string): string {
  return Buffer.from(value).toString("base64url");
}

function decodeBase64Url(value: string): string {
  return Buffer.from(value, "base64url").toString("utf8");
}
