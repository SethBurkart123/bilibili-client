import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import { once } from "node:events";
import {
  createServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from "node:http";
import { connect } from "node:net";
import { StreamProxy, DESKTOP_CHROME_UA } from "./stream-proxy";

const originalFetch = globalThis.fetch;
let proxy: StreamProxy | undefined;
let upstream: Server | undefined;
let upstreamPort = 0;

beforeEach(() => {
  globalThis.fetch = ((input, init) => {
    const url = new URL(input instanceof Request ? input.url : String(input));
    if (url.hostname === "media.test") {
      url.protocol = "http:";
      url.hostname = "127.0.0.1";
      url.port = String(upstreamPort);
      return originalFetch(url, init);
    }
    return originalFetch(input, init);
  }) as typeof fetch;
});

afterEach(async () => {
  globalThis.fetch = originalFetch;
  await proxy?.stop();
  if (upstream?.listening) {
    upstream.close();
    await once(upstream, "close");
  }
  proxy = undefined;
  upstream = undefined;
});

async function startUpstream(
  handler: (req: IncomingMessage, res: ServerResponse) => void,
): Promise<void> {
  upstream = createServer(handler);
  upstream.listen(0, "127.0.0.1");
  await once(upstream, "listening");
  const address = upstream.address();
  if (!address || typeof address === "string") throw new Error("upstream did not bind to TCP");
  upstreamPort = address.port;
}

async function startProxy(): Promise<StreamProxy> {
  proxy = new StreamProxy({ allowHosts: [/^media\.test$/] });
  await proxy.start();
  return proxy;
}

function mediaUrl(primary: string, backups: string[] = []): string {
  const url = new URL(proxy!.urlFor(primary));
  if (backups.length) {
    url.searchParams.set("b", Buffer.from(JSON.stringify(backups)).toString("base64url"));
  }
  return url.toString();
}

describe("StreamProxy", () => {
  it("forwards Range and CDN headers while mirroring a partial response", async () => {
    let receivedHeaders: Record<string, string | string[] | undefined> = {};
    await startUpstream((req, res) => {
      receivedHeaders = req.headers;
      res.writeHead(206, {
        "Content-Type": "video/mp4",
        "Content-Length": "4",
        "Content-Range": "bytes 0-3/10",
        "Accept-Ranges": "bytes",
      });
      res.end("test");
    });
    await startProxy();

    const response = await fetch(mediaUrl("https://media.test/video"), {
      headers: { Range: "bytes=0-3", Cookie: "session=must-not-leave" },
    });

    expect(response.status).toBe(206);
    expect(response.headers.get("content-range")).toBe("bytes 0-3/10");
    expect(response.headers.get("content-length")).toBe("4");
    expect(await response.text()).toBe("test");
    expect(receivedHeaders.range).toBe("bytes=0-3");
    expect(receivedHeaders.referer).toBe("https://www.bilibili.com/");
    expect(receivedHeaders["user-agent"]).toBe(DESKTOP_CHROME_UA);
    expect(receivedHeaders.cookie).toBeUndefined();
  });

  it("rejects upstream hosts outside its allowlist", async () => {
    await startProxy();
    const blocked = `http://127.0.0.1:${await proxy!.start()}/media?u=${Buffer.from("https://example.com/video").toString("base64url")}`;

    expect((await fetch(blocked)).status).toBe(403);
  });

  it("uses backup URLs after an upstream failure", async () => {
    const requested: string[] = [];
    await startUpstream((req, res) => {
      requested.push(req.url ?? "");
      if (req.url === "/primary") {
        res.writeHead(500).end("nope");
        return;
      }
      res.writeHead(206, { "Content-Range": "bytes 0-1/2", "Content-Length": "2" }).end("ok");
    });
    await startProxy();

    const response = await fetch(
      mediaUrl("https://media.test/primary", ["https://media.test/backup"]),
    );

    expect(response.status).toBe(206);
    expect(await response.text()).toBe("ok");
    expect(requested).toEqual(["/primary", "/backup"]);
  });

  it("aborts the upstream fetch when the client disconnects", async () => {
    await startUpstream((_req, res) => {
      res.writeHead(200, { "Content-Type": "video/mp4" });
      const interval = setInterval(() => res.write("chunk"), 5);
      res.once("close", () => {
        clearInterval(interval);
      });
    });
    await startProxy();
    const mappedFetch = globalThis.fetch;
    let upstreamAborted = false;
    let resolveUpstreamAbort: (() => void) | undefined;
    const upstreamAbort = new Promise<void>((resolve) => {
      resolveUpstreamAbort = resolve;
    });
    globalThis.fetch = ((input, init) => {
      if (new URL(input instanceof Request ? input.url : String(input)).hostname === "media.test") {
        init?.signal?.addEventListener("abort", () => {
          upstreamAborted = true;
          resolveUpstreamAbort?.();
        });
      }
      return mappedFetch(input, init);
    }) as typeof fetch;

    await new Promise<void>((resolve, reject) => {
      const target = new URL(mediaUrl("https://media.test/slow"));
      const client = connect(Number(target.port), "127.0.0.1", () => {
        client.write(`GET ${target.pathname}${target.search} HTTP/1.1\r\nHost: ${target.host}\r\n\r\n`);
      });
      client.once("data", () => {
        client.once("close", resolve);
        client.destroy();
      });
      client.once("error", reject);
    });
    await Promise.race([
      upstreamAbort,
      new Promise((resolve) => setTimeout(resolve, 500)),
    ]);

    expect(upstreamAborted).toBe(true);
  });
});
