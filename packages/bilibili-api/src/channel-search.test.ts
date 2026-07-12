import { expect, test } from "bun:test";
import { BiliClient } from "./client.js";

function response(data: unknown): Response {
  return new Response(JSON.stringify({ code: 0, data }), { headers: { "content-type": "application/json" } });
}

test("channel and search methods normalize mocked API pages", async () => {
  const client = new BiliClient({
    fetch: async (input) => {
      const url = new URL(String(input));
      if (url.pathname === "/") return new Response("", { headers: { "set-cookie": "b_nut=search-cookie; Path=/" } });
      if (url.pathname === "/x/frontend/finger/spi") return response({ b_3: "three", b_4: "four" });
      if (url.pathname === "/x/web-interface/nav") {
        return response({ wbi_img: { img_url: "https://i/a.png", sub_url: "https://i/b.png" } });
      }
      if (url.pathname === "/x/web-interface/card") {
        return response({ card: { mid: "42", name: "Creator", face: "//face", sign: "bio" }, follower: 99 });
      }
      if (url.pathname === "/x/series/recArchivesByKeywords") {
        return response({
          archives: [{
            aid: 1,
            bvid: "BV1p94y1z7jX",
            title: "Latest video",
            pic: "//i0.hdslb.com/cover.jpg",
            duration: 120,
            pubdate: 1_700_000_000,
            stat: { view: 123 },
            upMid: 42,
          }],
          page: { num: 1, size: 30, total: 31 },
        });
      }
      if (url.pathname === "/x/web-interface/wbi/search/type") {
        if (url.searchParams.get("search_type") === "video") {
          return response({
            page: 1,
            pagesize: 20,
            numResults: 21,
            numPages: 2,
            result: [{
              aid: 2,
              bvid: "BV1q94y1z7jY",
              title: "<em class=\"keyword\">Tunnel</em> microscope",
              pic: "//i0.hdslb.com/search.jpg",
              duration: "02:31",
              play: 456,
              video_review: 7,
              author: "Researcher",
              mid: 43,
            }],
          });
        }
        return response({
          page: 1,
          pagesize: 20,
          numResults: 1,
          numPages: 1,
          result: [{ mid: 42, uname: "<em class=\"keyword\">Creator</em>", upic: "//avatar", usign: "bio", fans: 99, videos: 3 }],
        });
      }
      throw new Error(`Unexpected request: ${url}`);
    },
  });

  await expect(client.getChannelInfo(42)).resolves.toEqual({ mid: 42, name: "Creator", face: "https://face", sign: "bio", follower: 99 });
  await expect(client.getChannelVideos(42, 1)).resolves.toEqual({
    items: [{
      aid: 1,
      bvid: "BV1p94y1z7jX",
      title: "Latest video",
      pic: "https://i0.hdslb.com/cover.jpg",
      duration: 120,
      pubdate: 1_700_000_000,
      views: 123,
      authorMid: 42,
    }],
    total: 31,
    hasMore: true,
  });
  await expect(client.searchVideos("tunnel", 1)).resolves.toMatchObject({
    items: [{ title: "Tunnel microscope", pic: "https://i0.hdslb.com/search.jpg", duration: "02:31" }],
    page: 1,
    hasMore: true,
  });
  await expect(client.searchUsers("creator", 1)).resolves.toEqual({
    items: [{ mid: 42, name: "Creator", face: "https://avatar", sign: "bio", followers: 99, videos: 3 }],
    page: 1,
    hasMore: false,
  });
});
