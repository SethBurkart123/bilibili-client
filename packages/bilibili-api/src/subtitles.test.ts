import { expect, test } from "bun:test";
import { BiliClient } from "./client.js";

function response(data: unknown): Response {
  return new Response(JSON.stringify({ code: 0, data }), { headers: { "content-type": "application/json" } });
}

test("getSubtitles normalizes tracks and tolerates an empty subtitle node", async () => {
  let subtitleRequest = 0;
  const client = new BiliClient({
    fetch: async (input) => {
      const url = String(input);
      if (url.includes("finger/spi")) return response({ b_3: "three", b_4: "four" });
      if (url.includes("web-interface/nav")) {
        return response({ wbi_img: { img_url: "https://i/a.png", sub_url: "https://i/b.png" } });
      }
      if (url.includes("player/wbi/v2")) {
        subtitleRequest += 1;
        return response(subtitleRequest === 1
          ? { subtitle: { subtitles: [{ lan: "ai-zh", lan_doc: "AI Chinese", subtitle_url: "//subtitle.example/ai.json", type: 0 }] } }
          : { subtitle: {} });
      }
      throw new Error(`Unexpected request: ${url}`);
    },
  });

  await expect(client.getSubtitles({ bvid: "BV1p94y1z7jX" }, 123)).resolves.toEqual([
    { lan: "ai-zh", lanDoc: "AI Chinese", url: "https://subtitle.example/ai.json", aiGenerated: true },
  ]);
  await expect(client.getSubtitles({ bvid: "BV1p94y1z7jX" }, 123)).resolves.toEqual([]);
});

test("getSubtitleLines parses lines and supplies a missing end time", async () => {
  const client = new BiliClient({
    fetch: async () => new Response(JSON.stringify({ body: [
      { from: 1.25, to: 2.5, content: "first" },
      { from: 3, content: "second" },
    ] }), { headers: { "content-type": "application/json" } }),
  });

  await expect(client.getSubtitleLines("https://subtitle.example/track.json")).resolves.toEqual([
    { from: 1.25, to: 2.5, content: "first" },
    { from: 3, to: 5, content: "second" },
  ]);
});
