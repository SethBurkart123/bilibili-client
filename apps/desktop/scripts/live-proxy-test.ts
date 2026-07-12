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
  const videoTrack = playUrl.dash.video.find((track) => track.codecid === 7) ?? playUrl.dash.video[0];
  const audioTrack = playUrl.dash.audio[0];
  if (!videoTrack || !audioTrack) throw new Error("playurl did not include video and audio tracks");

  console.log(
    `PASS getPlayUrl -> ${playUrl.acceptQuality.map((quality) => `${quality} ${QN_LABELS[quality] ?? ""}`.trim()).join(", ")}`,
  );
  for (const [kind, track] of [["video", videoTrack], ["audio", audioTrack]] as const) {
    const url = proxyUrlForTrack(track.baseUrl, track.backupUrl);
    const probe = await fetch(url, { headers: { Range: "bytes=0-1023" } });
    const total = Number(probe.headers.get("content-range")?.match(/\/(\d+)$/)?.[1]);
    const probeBytes = new Uint8Array(await probe.arrayBuffer());
    if (probe.status !== 206 || probeBytes.byteLength !== 1024 || !Number.isSafeInteger(total)) {
      throw new Error(`${kind} probe returned HTTP ${probe.status} with ${probeBytes.byteLength} bytes`);
    }

    const chunkSize = 256 * 1024;
    const ranges = Array.from({ length: 8 }, (_, i) => {
      const start = Math.floor(((total - chunkSize) * (i + 1)) / 9);
      return [start, start + chunkSize - 1] as const;
    });
    await Promise.all(ranges.map(async ([start, end]) => {
      const response = await fetch(url, { headers: { Range: `bytes=${start}-${end}` } });
      const bytes = new Uint8Array(await response.arrayBuffer());
      if (response.status !== 206 || bytes.byteLength !== end - start + 1) {
        throw new Error(`${kind} range ${start}-${end} returned HTTP ${response.status} with ${bytes.byteLength} bytes`);
      }
    }));
    console.log(`PASS ${kind} concurrent ranges -> ${ranges.length} × ${chunkSize} bytes`);
  }
} finally {
  await proxy.stop();
}
