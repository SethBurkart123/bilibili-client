# @bili/api

Runtime-agnostic TypeScript client for the read-only bilibili web API. It uses
the global `fetch` supplied by Node 18+ or Bun.

```ts
import { BiliClient } from "@bili/api";

const bili = new BiliClient();
const id = await bili.parseVideoUrl("https://www.bilibili.com/video/BV1p94y1z7jX");
const video = await bili.getView(id);
const streams = await bili.getPlayUrl(id, video.cid);
const comments = await bili.getComments(video.aid, null);
```

Pass `cookies`, `userAgent`, or a custom `fetch` to the constructor when needed.
Use `getCookies()` and `setCookies()` to persist the cookie snapshot.

## QR login

Start a login, render its URL as a QR code, then poll until it succeeds or
expires. On success the client captures the returned session cookies before the
poll promise resolves; persist them with `getCookies()` if the session should
survive a restart.

```ts
const qr = await bili.loginQrStart();
renderQrCode(qr.url);

const timer = setInterval(async () => {
  const { status } = await bili.loginQrPoll(qr.qrcodeKey);
  if (status === "waiting" || status === "scanned") return;
  clearInterval(timer);
  if (status === "success") saveCookies(bili.getCookies());
  // status === "expired": start again with loginQrStart().
}, 1_000);
```
