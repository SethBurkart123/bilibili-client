# Bilibili Client — MVP Plan

**MVP goal:** paste a bilibili video URL → see the video info, a real player with
selectable resolutions (FastStream), and the comments translated to English.
Everything else (feed, search, subtitles, danmaku) comes later.

Companion docs in `docs/` — both are grounded in source, not memory:
- `docs/bilibili-api-spec.md` — exact endpoints, params, WBI algorithm, response
  shapes. Extracted from the bilibili-API-collect docs (use the actively-maintained
  `Goooler/bilibili-API-collect` fork as the ongoing reference — the original repo
  was wiped by its maintainer).
- `docs/faststream-integration.md` — FastStream architecture analysis: file paths,
  class names, and the recommended embedding approach.

**License note:** FastStream is "all rights reserved — permission required".
Local/personal use now; contact Andrews54757 with a demo before anything else.

---

## 1. Architecture

```
┌──────────────────────────────────────────────────────────┐
│ Electron main process                                    │
│  • All bilibili API calls (WBI signing, buvid cookies,   │
│    consistent User-Agent)                                │
│  • session.webRequest.onBeforeSendHeaders → inject       │
│    Referer: https://www.bilibili.com/ + UA on            │
│    *.bilivideo.com / CDN segment requests (403 without)  │
│  • Translation provider (Google gtx / OpenAI-compatible) │
│    + SQLite cache                                        │
├────────────────── typed IPC (contextBridge) ─────────────┤
│ Renderer                                                 │
│  • App shell (URL bar, video info, comments) — React     │
│  • FastStream web build in an iframe/webview, fed via    │
│    same-origin postMessage                               │
└──────────────────────────────────────────────────────────┘
```

Renderer never talks to bilibili directly; main process owns headers/cookies.

## 2. FastStream integration (see docs/faststream-integration.md)

Key findings from the code analysis:

- The player core is separable: `chrome/player/` is self-contained ES modules;
  `build.mjs` has a `buildWeb()` target producing a standalone web player in
  `built/web` with all extension packaging stripped.
- **Embedding strategy (recommended): load the built web player page in an
  iframe/BrowserView served from our own origin** (Electron custom protocol or
  local static serve), then feed it sources via the existing `postMessage`
  handler in `main.mjs` (`recieveSources`):
  `{ type: 'sources', sources: [{ url, headers, mode }], subtitles: [...] }`.
  Note: it checks `e.origin === window.location.origin`, so the host page and
  player must share an origin.
- **bilibili's split video+audio DASH:** FastStream cannot take raw separate
  video/audio URLs, but it already ships a converter for exactly our case —
  `Bilibili2Dash` in `chrome/custom/bilibili_content.js` builds an MPD XML from
  bilibili's `dash.video[]`/`dash.audio[]` and serves it as a
  `data:application/dash+xml;base64,...` URL. Port/reuse that class; feed the
  result with mode `PlayerModes.ACCELERATED_DASH`.
- **Resolution switching comes free:** the quality menu auto-populates from the
  MPD's AdaptationSets (`VideoQualityChanger`); ABR auto-switch is disabled by
  default, manual selection via `setCurrentVideoLevelID`. Include every quality
  the playurl response returns in the one MPD — no re-fetch needed to switch.
- **Headers:** FastStream fetches segments via XHR (`XHRLoader`); browser-forbidden
  headers (Referer/Origin/Cookie) are normally set by its extension background,
  which we won't have — that's what our Electron `webRequest` injection replaces.
  Pass ordinary headers through `VideoSource.headers` if ever needed.
- Subtitles for later: `SubtitleTrack` + `fastStream.loadSubtitleTrack()` accepts
  VTT/SRT text at runtime (full ASS not supported).

Build step: vendor FastStream as a git submodule or copy, run its `npm run build`,
ship `built/web/player/` as static assets in our app.

## 3. Bilibili API flow (see docs/bilibili-api-spec.md for exact shapes)

Paste URL → play + comments, in order:

1. **Bootstrap (once per session):** `GET x/frontend/finger/spi` → set `buvid3`/
   `buvid4` cookies; fetch WBI keys from `x/web-interface/nav` (`data.wbi_img`,
   filenames = `img_key`/`sub_key`, cache for the day).
2. **Parse URL:** extract `BV...` (12-char, base58) or `av<digits>`; for 7-char
   `b23.tv/<token>` short links follow the HTTP redirect first. BV→av algorithm
   in the spec if needed.
3. **Video info:** `GET x/web-interface/view?bvid=...` (no WBI) → title, desc,
   owner, stats, `aid`, `cid`, `pages[]`. Multi-part videos: one `cid` per part.
4. **Streams:** `GET x/player/wbi/playurl?bvid=&cid=&fnval=4048&fnver=0&fourk=1`
   (WBI-signed; param is `avid` not `aid` if using the numeric id) →
   `dash.video[]` (qualities by `qn` id: 32=480P, 64=720P, 80=1080P... full table
   in spec) + `dash.audio[]` → build MPD via Bilibili2Dash → postMessage to
   FastStream. Anonymous = 480p max; login unlocks 720/1080p. **URLs expire in
   120 min** — on player error, re-fetch playurl and resume position.
5. **Comments:** `GET x/v2/reply/wbi/main?type=1&oid={aid}&mode=3` (WBI-signed;
   `oid` is the **aid**). Cursor pagination via `pagination_str` ←
   `data.cursor.pagination_reply.next_offset` (exact JSON format in spec —
   capitalization matters). Replies: `GET x/v2/reply/reply?type=1&oid=&root=`.
   Render `member.uname/avatar`, `content.message`, `like`; map `content.emote`
   tokens like `[doge]` to their image `url`s.

WBI signing (needed for playurl + comments): mixin table + algorithm are in the
spec §5. Implement once as `signParams(params): params & {wts, w_rid}`.

## 4. Translation

`Translator` interface, two providers, picked in settings:
- **Google gtx (free, default):** `GET translate.googleapis.com/translate_a/single?client=gtx&sl=zh-CN&tl=en&dt=t&q=...`
  — one text per call, throttle ~5/s, best-effort.
- **OpenAI-compatible:** configurable `baseURL`/`apiKey`/`model`; batch ~50 texts
  per chat-completion call, JSON array in/out, validate lengths, one retry.

SQLite cache keyed by `hash(text)+provider+lang` — comments/titles never change.
MVP surfaces: title + description on load; comments translated per page as they
render (show original on hover/toggle). Strip emote tokens before translating,
re-insert after.

## 5. MVP milestones

| # | Milestone | Proves |
|---|-----------|--------|
| 1 | Electron scaffold (electron-vite) + typed IPC + FastStream vendored, its demo page loads with a test MPD | Player embeds and plays at all |
| 2 | API core in main process: buvid bootstrap, WBI signer (unit-test against known-good signature), URL parser, `view` fetch | Signing correct, no -412 |
| 3 | Paste URL → playurl → Bilibili2Dash MPD → FastStream plays with working quality menu (480p anonymous) | The whole pipeline |
| 4 | Comments panel: cursor-paginated list with emotes, load-more, reply expansion | Comment API |
| 5 | Translation layer + cache + settings; title/desc/comments translated | End-to-end MVP done |

## 6. After the MVP (kept from original plan, unchanged in substance)

1. **QR login** — generate/poll endpoints + `safeStorage`-encrypted cookies
   (spec §7); unlocks 720p/1080p and is a prerequisite for AI subtitles.
2. **Subtitles** — `x/player/wbi/v2` subtitle list → JSON → VTT → FastStream
   `loadSubtitleTrack`; translated + dual-language via the translation layer.
3. Search + home feed (translate English query → Chinese before searching).
4. Danmaku overlay, watch history, multi-part navigation polish.

## 7. Gotchas carried over

- Consistent desktop-Chrome UA on **every** request; buvid cookies before
  anything else; back off on `-412` rather than hammering.
- `Referer` required on both API calls and CDN segments (403 otherwise).
- WBI keys rotate daily — refresh on `-403` from a signed endpoint.
- Multi-part videos: thread the selected `pages[].cid` everywhere.
- gtx endpoint is unofficial and may throttle; OpenAI-compatible path is the
  reliable one.
