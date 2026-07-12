import { expect, test } from "bun:test";
import { BiliClient } from "./client.js";

function response(data: unknown): Response {
  return new Response(JSON.stringify({ code: 0, data }), { headers: { "content-type": "application/json" } });
}

function clientForUrlTests() {
  return new BiliClient({
    fetch: async (input) => {
      const url = String(input);
      if (url.includes("finger/spi")) return response({ b_3: "three", b_4: "four" });
      if (url.includes("web-interface/nav")) return response({ wbi_img: { img_url: "https://i/a.png", sub_url: "https://i/b.png" } });
      throw new Error(`Unexpected request: ${url}`);
    },
  });
}

test("parseVideoUrl accepts canonical URLs and identifiers", async () => {
  const client = clientForUrlTests();
  await expect(client.parseVideoUrl("https://www.bilibili.com/video/BV1p94y1z7jX?spm_id=abc")).resolves.toEqual({ bvid: "BV1p94y1z7jX" });
  await expect(client.parseVideoUrl("BV1p94y1z7jX")).resolves.toEqual({ bvid: "BV1p94y1z7jX" });
  await expect(client.parseVideoUrl("av123")).resolves.toEqual({ aid: 123 });
  await expect(client.parseVideoUrl("https://www.bilibili.com/video/av123?foo=bar")).resolves.toEqual({ aid: 123 });
});
