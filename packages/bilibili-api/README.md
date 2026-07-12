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
