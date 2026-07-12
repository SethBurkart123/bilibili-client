import { BiliClient, DEFAULT_USER_AGENT, QN_LABELS } from "../src/index.js";

const videoUrl = "https://www.bilibili.com/video/BV1p94y1z7jX";
let failed = false;
let lastRequestAt = 0;

const politeFetch: typeof fetch = async (input, init) => {
  const delay = Math.max(0, 1_000 - (Date.now() - lastRequestAt));
  if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
  lastRequestAt = Date.now();
  return fetch(input, init);
};
const client = new BiliClient({ fetch: politeFetch });

function pass(message: string): void {
  console.log(`PASS ${message}`);
}

function fail(message: string, error: unknown): void {
  failed = true;
  console.error(`FAIL ${message}: ${error instanceof Error ? error.message : String(error)}`);
}

try {
  const id = await client.parseVideoUrl(videoUrl);
  if (id.bvid !== "BV1p94y1z7jX") throw new Error(`expected BV1p94y1z7jX, got ${JSON.stringify(id)}`);
  pass("parseVideoUrl -> BV1p94y1z7jX");

  const view = await client.getView(id);
  if (!view.title || view.aid <= 0 || view.cid <= 0) throw new Error("view is missing title, aid, or cid");
  pass(`getView -> ${view.title}`);

  const playUrl = await client.getPlayUrl(id, view.cid);
  if (playUrl.dash.video.length === 0 || playUrl.dash.audio.length === 0) throw new Error("DASH video or audio tracks are absent");
  pass(`getPlayUrl -> ${playUrl.acceptQuality.map((quality) => `${quality} ${QN_LABELS[quality] ?? ""}`.trim()).join(", ")}`);

  const cdn = await politeFetch(playUrl.dash.video[0].baseUrl, {
    headers: { Referer: "https://www.bilibili.com/", "User-Agent": DEFAULT_USER_AGENT, Range: "bytes=0-1023" },
  });
  if (cdn.status !== 200 && cdn.status !== 206) throw new Error(`CDN returned HTTP ${cdn.status}`);
  pass(`CDN probe -> HTTP ${cdn.status}`);

  const firstPage = await client.getComments(view.aid, null);
  if (firstPage.items.length === 0) throw new Error("first comments page is empty");
  pass(`getComments page 1 -> ${firstPage.items[0].message}`);
  if (!firstPage.nextOffset) throw new Error("first comments page has no next offset");

  const secondPage = await client.getComments(view.aid, firstPage.nextOffset);
  const firstPageIds = new Set(firstPage.items.map((item) => item.rpid));
  if (secondPage.items.length === 0 || secondPage.items.some((item) => firstPageIds.has(item.rpid))) throw new Error("second comments page overlaps page 1");
  pass("getComments page 2 -> non-empty with no overlap");
  if (!secondPage.nextOffset) throw new Error("second comments page has no next offset");

  const thirdPage = await client.getComments(view.aid, secondPage.nextOffset);
  const seenIds = new Set([...firstPageIds, ...secondPage.items.map((item) => item.rpid)]);
  if (thirdPage.items.length === 0 || thirdPage.items.some((item) => seenIds.has(item.rpid))) throw new Error("third comments page overlaps an earlier page");
  pass("getComments page 3 -> non-empty with no overlap");
} catch (error) {
  fail("live acceptance", error);
}

process.exitCode = failed ? 1 : 0;
