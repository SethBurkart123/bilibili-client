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

## Channels and search

```ts
const channel = await bili.getChannelInfo(video.owner.mid);
const uploads = await bili.getChannelVideos(video.owner.mid, 1);
const videos = await bili.searchVideos("扫描隧道显微镜", 1);
const users = await bili.searchUsers("机械小熊猫", 1);
```

`getChannelInfo` uses `/x/web-interface/card`. For uploader videos, the client
uses `/x/series/recArchivesByKeywords` with an empty keyword and `orderby=pubdate`.
It is the anonymous-safe route: the usual WBI space archive endpoint returned
risk-control failures during live verification. Typed video/user search uses
the WBI `/x/web-interface/wbi/search/type` endpoint after buvid bootstrap and
a one-time web-homepage cookie refresh required by the anonymous search route.

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
