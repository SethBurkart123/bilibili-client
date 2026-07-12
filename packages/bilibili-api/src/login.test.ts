import { expect, test } from "bun:test";
import { BiliClient } from "./client.js";

function response(data: unknown, headers?: HeadersInit): Response {
  const responseHeaders = new Headers(headers);
  responseHeaders.set("content-type", "application/json");
  return new Response(JSON.stringify({ code: 0, data }), { headers: responseHeaders });
}

const wbiKeys = { wbi_img: { img_url: "https://i/a.png", sub_url: "https://i/b.png" } };

test("loginQrPoll maps every documented status", async () => {
  const cases = [[86101, "waiting"], [86090, "scanned"], [86038, "expired"], [0, "success"]] as const;
  for (const [code, status] of cases) {
    const client = new BiliClient({
      fetch: async (input) => {
        const url = String(input);
        if (url.includes("qrcode/poll")) return response({ code, url: "" });
        if (url.includes("web-interface/nav")) return response(wbiKeys);
        throw new Error(`Unexpected request: ${url}`);
      },
    });
    await expect(client.loginQrPoll("qrcode-key")).resolves.toEqual({ status });
  }
});

test("successful poll captures Set-Cookie session cookies before the next request", async () => {
  const sentCookies: string[] = [];
  const headers = new Headers();
  headers.append("Set-Cookie", "SESSDATA=session=token; Path=/");
  headers.append("Set-Cookie", "bili_jct=csrf; Path=/");
  headers.append("Set-Cookie", "DedeUserID=42; Path=/");
  headers.append("Set-Cookie", "DedeUserID__ckMd5=hash; Path=/");
  headers.append("Set-Cookie", "sid=session-id; Path=/");
  const client = new BiliClient({
    fetch: async (input, init) => {
      const url = String(input);
      sentCookies.push(new Headers(init?.headers).get("cookie") ?? "");
      if (url.includes("qrcode/poll")) return response({ code: 0, url: "" }, headers);
      if (url.includes("web-interface/nav")) return response(wbiKeys);
      throw new Error(`Unexpected request: ${url}`);
    },
  });

  await client.loginQrPoll("qrcode-key");
  expect(client.getCookies()).toMatchObject({
    SESSDATA: "session=token",
    bili_jct: "csrf",
    DedeUserID: "42",
    DedeUserID__ckMd5: "hash",
    sid: "session-id",
  });
  expect(sentCookies.at(-1)).toContain("SESSDATA=session=token");
  expect(sentCookies.at(-1)).toContain("sid=session-id");
});

test("successful poll falls back to session cookies embedded in its URL", async () => {
  const sentCookies: string[] = [];
  const client = new BiliClient({
    fetch: async (input, init) => {
      const url = String(input);
      sentCookies.push(new Headers(init?.headers).get("cookie") ?? "");
      if (url.includes("qrcode/poll")) {
        return response({
          code: 0,
          url: "https://www.bilibili.com/?SESSDATA=session&bili_jct=csrf&DedeUserID=42&DedeUserID__ckMd5=hash&sid=session-id",
        });
      }
      if (url.includes("web-interface/nav")) return response(wbiKeys);
      throw new Error(`Unexpected request: ${url}`);
    },
  });

  await client.loginQrPoll("qrcode-key");
  expect(client.getCookies()).toMatchObject({ SESSDATA: "session", bili_jct: "csrf", DedeUserID: "42", DedeUserID__ckMd5: "hash", sid: "session-id" });
  expect(sentCookies.at(-1)).toContain("SESSDATA=session");
  expect(sentCookies.at(-1)).toContain("sid=session-id");
});

test("logout preserves device cookies", async () => {
  const client = new BiliClient({
    cookies: { buvid3: "device-three", buvid4: "device-four", SESSDATA: "session", bili_jct: "csrf", sid: "sid" },
  });

  await client.logout();
  expect(client.getCookies()).toEqual({ buvid3: "device-three", buvid4: "device-four" });
});
