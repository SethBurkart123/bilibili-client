# FastStream → Electron (custom Bilibili client) integration research

Research-only review of the FastStream codebase (v1.3.77). No files in the FastStream tree were modified.

---

## 1. Architecture: separability and layout

**Verdict: yes, the player core is already separable from the extension packaging.**

The repo is an MV3 browser extension whose *player* lives under `chrome/player/` as self-contained ES modules. Extension-only pieces (`chrome/background/`, `chrome/content.js`, `chrome/custom/*`, `chrome/manifest.json`, `_locales`, etc.) are optional for playback. `EnvUtils.isExtension()` (`chrome/player/utils/EnvUtils.mjs`) gates Chrome APIs; when false, the player runs as a standalone web app.

`build.mjs` already produces a **web build** (`built/web`) that copies `chrome/` while stripping extension packaging (manifest, content scripts, background, custom injectors, icons, etc.) via `buildWeb()` / `spliceAndCopy(..., ['WEB', 'NO_UPDATE_CHECKER'], ...)`.

### Directory layout (core)

| Area | Path | Role |
|------|------|------|
| Entry / shell | `chrome/player/index.html`, `preload.mjs`, `main.mjs` | DOM shell + bootstrap (`window.fastStream = new FastStreamClient()`) |
| Client API | `chrome/player/FastStreamClient.mjs` | Main façade: sources, levels, subtitles, options |
| Source model | `chrome/player/VideoSource.mjs` | URL + headers + `PlayerModes` |
| Modes | `chrome/player/enums/PlayerModes.mjs` | `direct`, `accelerated_mp4`, `accelerated_hls`, `accelerated_dash`, `accelerated_yt`, `accelerated_vm`, … |
| Player factory | `chrome/player/players/PlayerLoader.mjs` | Dynamic-imports backend by mode |
| DASH | `chrome/player/players/dash/` (`DashPlayer.mjs`, `DashLoader.mjs`, `DashFragmentRequester.mjs`, `DashTrackUtils.mjs`) | dash.js + custom segment loader |
| HLS | `chrome/player/players/hls/` | Customized hls.js path |
| Progressive MP4 (MSE) | `chrome/player/players/mp4/` (`MP4Player.mjs`, `SourceBufferWrapper.mjs`) | Fragmented MP4 via `MediaSource` |
| Native `<video>` | `chrome/player/players/DirectVideoPlayer.mjs` | `video.src = url` |
| Quality mgr | `chrome/player/players/LevelManager.mjs` | Level pick / language / codec prefs |
| Network | `chrome/player/network/` (`DownloadManager.mjs`, `StandardDownloader.mjs`, `XHRLoader.mjs`, …) | Parallel segment download / cache |
| UI | `chrome/player/ui/` (`InterfaceController.mjs`, menus, controls) | FluidPlayer-derived chrome |
| Subtitles | `chrome/player/SubtitleTrack.mjs`, `chrome/player/ui/subtitles/`, `utils/SubtitleUtils.mjs` | Tracks, OpenSubtitles, sync |
| Vendored libs | `chrome/player/modules/` (`dash.mjs`, `hls.mjs`, `vtt.mjs`, `mp4box.mjs`, …) | Heavily customized third-party code |
| Extension packaging | `chrome/background/`, `chrome/content.js`, `chrome/custom/` | Not required for Electron player embed |
| Bilibili helper (extension) | `chrome/custom/bilibili_content.js` | **Already converts Bilibili playinfo → DASH MPD** |

---

## 2. How video sources are fed programmatically

### Primary API

```js
import { FastStreamClient } from './FastStreamClient.mjs';
import { VideoSource } from './VideoSource.mjs';
import { PlayerModes } from './enums/PlayerModes.mjs';

const client = new FastStreamClient();
await client.setup();
await client.addSource(
  new VideoSource(url, headersObjectOrArray, PlayerModes.ACCELERATED_DASH),
  true // set as current
);
```

Key symbols:

- `VideoSource` (`chrome/player/VideoSource.mjs`) — constructor `(source, headers, mode)`; optional `parseHeadersParam()` for `faststream-headers` / `faststream-mode` URL query params.
- `FastStreamClient.addSource(source, setSource)` / `setSource(source)` (`FastStreamClient.mjs`).
- Hash-load path in `main.mjs`: `#<url>` auto-detects mode via `URLUtils.getModeFromExtension`.
- Non-extension embed path in `main.mjs`: `postMessage` with `{ type: 'sources', sources, subtitles, ... }` → `recieveSources()`.

### Extension / postMessage source shape (from `recieveSources` in `main.mjs`)

Each source object:

- `url`, `headers`, `mode`, plus metadata like `depth`, `time` for auto-selection.

Subtitles array items: `{ label, language, data }` and/or `{ source, headers }` (fetched then parsed).

### Supported source types

| Type | Mode | Backend |
|------|------|---------|
| Progressive / file URL | `PlayerModes.DIRECT` | `DirectVideoPlayer` (`<video src>`) |
| Progressive MP4 (accelerated / fragmented) | `ACCELERATED_MP4` | `MP4Player` + MSE (`MediaSource` / `SourceBuffer`) |
| HLS (`.m3u8`) | `ACCELERATED_HLS` | `HLSPlayer` |
| DASH / MPD (`.mpd`) | `ACCELERATED_DASH` | `DashPlayer` (dash.js) + custom XHR loaders |
| YouTube | `ACCELERATED_YT` | `YTPlayer` |
| Vimeo patch | `ACCELERATED_VM` | `VMPlayer` |

Extension map: `URLUtils` `ModesMap` — `mpd` → DASH, `m3u8` → HLS, `mp4` → accelerated MP4, `webm` → direct.

MSE is used extensively for accelerated MP4 / HLS / DASH remux paths (not only “native progressive”).

### (a) Generated DASH MPD — **yes, first-class**

This is exactly how the built-in Bilibili path works.

`chrome/custom/bilibili_content.js` defines `Bilibili2Dash`:

1. Reads `window.__playinfo__` dash `video` + `audio` arrays.
2. Builds an MPD with separate video/audio `AdaptationSet`s (`loadDashData` / `loadDashTracks` / `loadDashTrack`).
3. Serves it as `data:application/dash+xml;base64,...`.
4. Emits `DETECTED_SOURCE` with `ext: 'mpd'` and headers `{ Referer, Origin }`.

In Electron you can reuse that converter (or emit an `http(s):`/`blob:` MPD) and call:

```js
await fastStream.addSource(
  new VideoSource(mpdUrlOrDataUri, { referer: '...', origin: '...' }, PlayerModes.ACCELERATED_DASH),
  true
);
```

`DashPlayer.setSource` → `this.dash.initialize(this.video, this.source.url, false)`.

### (b) Separate video + audio stream URLs without an MPD — **not directly**

There is **no** public API like `setVideoUrl` + `setAudioUrl`. Split A/V is handled only through a multi-AdaptationSet DASH (or HLS) manifest. For Bilibili-style CDNs, **generate an MPD** (copy `Bilibili2Dash`) rather than feeding two raw URLs.

---

## 3. Quality / resolution switching

**UI auto-exposes qualities from the manifest:** yes.

- After levels are known, `FastStreamClient.updateQualityLevels()` → `InterfaceController.updateQualityLevels()` → `VideoQualityChanger.updateQualityLevels(client)` / `AudioQualityChanger.updateQualityLevels(client)`.
- Levels are grouped by dimensions (`VideoQualityChanger.groupLevelsByDimensions`) and shown in the quality menu (`DOMElements.videoSource`).

**Programmatic API** on `FastStreamClient`:

| Method | Purpose |
|--------|---------|
| `getVideoLevels()` / `getAudioLevels()` | `Map` of levels from active player |
| `getCurrentVideoLevelID()` / `getCurrentAudioLevelID()` | Current selection |
| `setCurrentVideoLevelID(id)` / `setCurrentAudioLevelID(id)` | Switch quality |
| `changeLanguage(type, language)` | Pick matching level for language |
| `getLevelManager()` | `LevelManager` prefs (codec/container/language) |

DASH implementation (`DashPlayer.mjs`):

- `getVideoLevels()` → `DashTrackUtils.getVideoLevelList(this.dash.getTracksFor('video'))`
- `setCurrentVideoLevelID(id)` → `dash.setRepresentationForTypeById('video', ...)`
- ABR auto-switch is **disabled** (`autoSwitchBitrate: { audio: false, video: false }`); selection goes through `LevelManager.pickVideoLevel` / `pickAudioLevel`.

UI wiring: `InterfaceController` listens to `VideoQualityChanger` / `AudioQualityChanger` `'qualityChanged'` and calls `setCurrentVideoLevelID` / `setCurrentAudioLevelID`.

---

## 4. Subtitles

### Formats

| Format | Support |
|--------|---------|
| **WebVTT** | Native via `modules/vtt.mjs` (`WebVTT.Parser`) |
| **SRT** | Yes — `SubtitleUtils.srt2webvtt` then VTT parse (`SubtitleTrack.loadText`) |
| **XML timed text** | Yes — `SubtitleUtils.xml2vtt` when text starts with `<?xml` |
| **ASS/SSA** | **Partial only.** README credits ASS→VTT, but there is no full ASS parser. `SubtitleUtils.convertSubtitleFormatting` only remaps ASS-like inline tags (`{\anN}`, `{\b1}`, `\h`, etc.) after content is already cue-like. A full `[Script Info]` / `Dialogue:` ASS file will not reliably parse (non-WEBVTT text is force-fed through `srt2webvtt`). |

### Runtime / programmatic add

Yes:

```js
import { SubtitleTrack } from './SubtitleTrack.mjs';

const track = new SubtitleTrack(label, language);
track.loadText(vttOrSrtText);          // or await track.loadURL(url)
await fastStream.loadSubtitleTrack(track, /* autoset */ true);
fastStream.clearSubtitles();           // clears via SubtitlesManager.clearTracks()
```

Also:

- `SubtitlesManager.addTrack` / `activateTrack` / `removeTrack` / `loadTrackAndActivateBest`
- UI file/URL import in `SubtitlesManager`
- OpenSubtitles download path (`OpenSubtitlesSearch.mjs`)
- `main.mjs` `recieveSources` can attach `request.subtitles[]` at source-load time

---

## 5. Media segment fetching and header customization

### Fetch path

Segments are **not** primarily loaded with `fetch()`. Pipeline:

1. dash.js / hls.js request → custom loader (`DASHLoaderFactory` / HLS equivalents).
2. `DashFragmentRequester.requestFragment` merges `player.source.headers` into the request.
3. `DownloadManager.getFile` → `StandardDownloader` → **`XHRLoader`** (`XMLHttpRequest`).

Also: `RequestUtils.request` / `requestSimple` use XHR for ad-hoc downloads (e.g. subtitle URLs).

### Header customization points

1. **`VideoSource.headers`** — primary integration point. Passed into fragment loaders (`DashFragmentRequester`, `DashLoader` merge `...player.source.headers`).
2. **`VideoSource.filterHeaders` / `headerBlacklist`** — strips browser-forbidden names (`accept`, `user-agent`, `range`, `host`, …) but **keeps** `referer` / `origin` in the source object.
3. **`RequestUtils.splitSpecialHeaders`** — `origin`, `referer`, `user-agent`, `cookie`, `sec-fetch-*`, etc. cannot be set on XHR from a page. In the **extension**, those become `MessageTypes.SET_HEADERS` → `NetRequestRuleManager` / `declarativeNetRequest` session rules (`chrome/background/`).
4. **Electron implication:** without the extension background, special headers on XHR are **ignored**. Use Electron `session.webRequest.onBeforeSendHeaders` (or a custom protocol / main-process proxy) to inject `Referer` / `Origin` / cookies for Bilibili CDNs. Ordinary custom headers can still be set via `xhr.setRequestHeader` through `VideoSource.headers`.

---

## 6. Best embedding strategy in Electron

### Build system

- **Custom Node script:** `build.mjs` (+ `localescript.mjs`), not webpack/vite/rollup.
- **ES modules** served as-is (`type="module"` in `index.html`).
- Targets from `npm run build`:
  - Chrome/Firefox libre & store (`dist`) zips via `web-ext`
  - **`built/web`** — standalone web player (extension stripped)

Demo already exists: `https://faststream.online/player/#<streamUrl>` (README).

### Strategy comparison

| Strategy | Fit | Notes |
|----------|-----|-------|
| **(a) Import player core as a module** | Good if you own the renderer DOM | Import `FastStreamClient`, mount into the existing `index.html` control structure (`DOMElements` expects FluidPlayer-class DOM). You still need CSS/assets under `chrome/player/assets/`. Not a tiny npm package — it’s a page + module graph. |
| **(b) Load built player page + `postMessage`** | **Best default for Electron** | Load `built/web/player/index.html` (or `chrome/player/index.html`) in a `BrowserWindow` / `<webview>` / iframe. Non-extension path already listens for `{ type: 'sources', sources, subtitles, ... }` (**same-origin only**: `e.origin !== window.location.origin` returns). Use a custom protocol or same origin as the host page. Hash URLs also work: `#https://…/manifest.mpd`. |
| **(c) Fork and strip extension parts** | Redundant for first integrate | `buildWeb()` already strips packaging. Fork only if you need deep Electron header hooks inside `XHRLoader` / remove YT/OpenSubtitles/etc. |

**Practical Electron approach:** treat FastStream as an embedded web player (b), optionally thin-wrap (a) once stable. Reuse `Bilibili2Dash` logic in the main/renderer of your client; do **not** depend on `bilibili_content.js` as a content script.

---

## 7. License constraints

Source: `LICENSE.md`.

- FastStream itself: **“All rights reserved.”** Explicit line: **“You must receive permission before using my code.”**
- Provided **AS-IS**, no warranties; author describes it as a hobby project.
- Bundled third-party components have their own permissive licenses (MIT / Apache-2.0 / BSD), e.g. Fluidplayer, hls.js, dash.js, mp4box.js, vtt.js — those do **not** grant rights to the FastStream wrapper itself.

**Implication for a custom Bilibili Electron client:** you **cannot** ship FastStream (or a fork) without **prior written permission** from the author (Andrew S / Andrews54757). Contact them before embedding. Third-party libs alone are not a substitute for the FastStream UI/player glue.

---

## Recommended integration approach

Get **written permission** from the FastStream author first. Then embed the **web player** (`npm run build` → `built/web/player/index.html`, or load `chrome/player/` directly) in an Electron renderer under a controlled origin/protocol. For each Bilibili playinfo payload, reuse the existing **`Bilibili2Dash`** pattern in `chrome/custom/bilibili_content.js` to emit a multi-AdaptationSet MPD (data/blob/HTTP URL), then feed it with `new VideoSource(mpdUrl, headers, PlayerModes.ACCELERATED_DASH)` either via `window.fastStream.addSource(...)` or same-origin `postMessage({ type: 'sources', sources: [...], autoSetSource: true, subtitles: [...] })`. Attach subtitles at runtime with `SubtitleTrack` + `loadSubtitleTrack` (prefer VTT/SRT). Enumerate/switch quality with `getVideoLevels` / `setCurrentVideoLevelID` (UI already mirrors the manifest). For CDN auth, set `VideoSource.headers` and implement Electron `session.webRequest` for `Referer`/`Origin`/`Cookie` because extension `declarativeNetRequest` will not exist. Avoid feeding raw split video+audio URLs without an MPD; avoid assuming full ASS support. Do not rely on importing a published npm “player core” package — none exists; the separable unit is the `chrome/player/` tree plus the web build target.
