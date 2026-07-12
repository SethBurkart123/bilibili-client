import { BiliClient, QN_LABELS } from "@bili/api";
import { StreamProxy } from "../src/main/services/stream-proxy";

const videoUrl = "https://www.bilibili.com/video/BV1p94y1z7jX";
const proxy = new StreamProxy();

function proxyUrlForTrack(baseUrl: string, backupUrl: string[]): string {
  const url = new URL(proxy.urlFor(baseUrl));
  if (backupUrl.length > 0) {
    url.searchParams.set("b", Buffer.from(JSON.stringify(backupUrl)).toString("base64url"));
  }
  return url.toString();
}

try {
  await proxy.start();
  const client = new BiliClient();
  const id = await client.parseVideoUrl(videoUrl);
  const view = await client.getView(id);
  const playUrl = await client.getPlayUrl(id, view.cid);
  const track = playUrl.dash.video[0];
  if (!track) throw new Error("playurl did not include a video track");

  console.log(
    `PASS getPlayUrl -> ${playUrl.acceptQuality.map((quality) => `${quality} ${QN_LABELS[quality] ?? ""}`.trim()).join(", ")}`,
  );
  const response = await fetch(proxyUrlForTrack(track.baseUrl, track.backupUrl), {
    headers: { Range: "bytes=0-1023" },
  });
  const bytes = new Uint8Array(await response.arrayBuffer());
  if ((response.status !== 200 && response.status !== 206) || bytes.byteLength === 0) {
    throw new Error(`proxy returned HTTP ${response.status} with ${bytes.byteLength} bytes`);
  }
  console.log(`PASS proxy range fetch -> HTTP ${response.status}, ${bytes.byteLength} bytes`);
} finally {
  await proxy.stop();
}
