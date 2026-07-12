# @bili/player

FastStream web-player integration for bilibili-client. Builds a same-origin embeddable player from the vendored FastStream tree and feeds Bilibili DASH via generated MPD + `postMessage`.

## Install / build the player assets

```bash
# from monorepo root
bun install
bun packages/player/scripts/build-player.ts
# or: cd packages/player && bun run build-player
```

This runs FastStream's web build (`node build.mjs --web` in `vendor/faststream`) and copies `built/web` → `packages/player/dist/faststream-web/`. `dist/` is gitignored; re-run the script after clean checkouts.

## Serve same-origin

FastStream's non-extension listener only accepts messages when:

```js
e.origin === window.location.origin
```

Serve `dist/faststream-web` and your host UI from **one origin** (Electron custom protocol, or a static server). Example layout:

| URL | File |
|-----|------|
| `/player/...` | `dist/faststream-web/...` |
| `/player/player/index.html` | player shell |

Embed:

```html
<iframe id="fs" src="/player/player/index.html" allow="autoplay; fullscreen"></iframe>
```

## Feed a source

```ts
import { buildMpd, feedPlayer } from "@bili/player";
import type { DashInfo } from "@bili/types";

const dash: DashInfo = /* from @bili/bilibili-api playurl */;
const mpdXml = buildMpd(dash);

const iframe = document.querySelector<HTMLIFrameElement>("#fs")!;
// Wait until the iframe has loaded, then:
feedPlayer(iframe, mpdXml, {
  headers: {
    // Non-forbidden headers only in a plain browser; Electron should inject
    // Referer/Origin via session.webRequest for Bilibili CDN.
  },
});
```

`feedPlayer` posts exactly what `recieveSources` expects:

```ts
{
  type: "sources",
  sources: [{ url: dataUri, mode: "accelerated_dash", headers }],
  autoSetSource: true,
  subtitles: [],
}
```

`mode` is `PlayerModes.ACCELERATED_DASH` (`"accelerated_dash"`) from the vendored player.

## Subtitles

Convert Bilibili `SubtitleLine[]` (`from`/`to` in seconds) to WebVTT, optionally merge a translation on top, then pass tracks into `feedPlayer`:

```ts
import {
  buildMpd,
  feedPlayer,
  mergeDualLines,
  subtitleLinesToVtt,
} from "@bili/player";
import type { SubtitleLine } from "@bili/types";

const lines: SubtitleLine[] = /* from getSubtitleLines */;
const dual = mergeDualLines(lines, translations); // translated\noriginal
const vtt = subtitleLinesToVtt(dual, { label: "Bilingual" });

feedPlayer(iframe, mpdXml, {
  subtitles: [
    { label: "Bilingual", language: "zh-CN", vtt },
  ],
});
```

Each opts entry is mapped to FastStream's **inline** subtitle shape (`main.mjs` `recieveSources` / `loadSubtitles`):

```ts
{ label: string; language: string; data: string } // data = WebVTT text
```

Fetched form `{ source, headers }` also exists in FastStream but is unused here (extension-oriented). FastStream parses WebVTT natively; non-VTT text is run through `srt2webvtt`. Full ASS is not supported.

When `subtitles` is omitted, the payload still sends `subtitles: []` (never `undefined`).

**Prefer initial-feed subtitles** (`feedPlayer(..., { subtitles })`) for any tracks known up front. That attaches captions with the source and avoids a separate round-trip.

### Runtime subtitle injection

To add tracks to a **playing** iframe without reloading or re-feeding the source (e.g. a just-translated English track), use `addSubtitleTracks`:

```ts
import { addSubtitleTracks } from "@bili/player";

addSubtitleTracks(
  iframe,
  [{ label: "English", language: "en", vtt }],
  { activateLabel: "English" }, // optional: activate the matching label
);
```

Wire shape (same-origin `postMessage`; handled by a small vendored patch in `main.mjs`):

```ts
{
  type: "subtitles",
  subtitles: [{ label, language, data }], // data = WebVTT text
  activateLabel?: string,
}
```

This path does **not** call `recieveSources` / clear / re-set the media source.

### Re-feed and track persistence

Re-feeding (e.g. when the user enables captions) posts another `{ type: "sources", ... }` message. In `recieveSources` (`main.mjs`):

- If the player **already has a source**, local `autoSetSource` is nulled, so `clearSubtitles()` does **not** run.
- New tracks from the re-feed are still loaded via `loadSubtitleTrack(track, request.autoSetSource)`.

**Previously loaded subtitle tracks therefore persist** across a re-feed; new tracks are appended rather than replacing the list. Prefer `feedPlayer` initial-feed or `addSubtitleTracks` over re-feeding just to attach captions.

## Demo

```bash
bun packages/player/scripts/build-player.ts
bun packages/player/scripts/demo.ts
# open http://localhost:4321/
```

Click **Load Big Buck Bunny (DASH)** to post a public Akamai test MPD URL into the iframe. After the stream is playing, **Add subtitle track** calls `addSubtitleTracks` with a tiny hardcoded VTT (no source reload).

## API

| Export | Role |
|--------|------|
| `buildMpd(dash)` | Pure `DashInfo` → static MPD XML (Bilibili2Dash port) |
| `mpdToDataUri(mpd)` | `data:application/dash+xml;base64,...` |
| `feedPlayer(iframe, mpdXml, opts?)` | Same-origin `postMessage` into FastStream; `opts.subtitles` optional |
| `addSubtitleTracks(iframe, tracks, opts?)` | Runtime subtitle injection without source reload |
| `subtitleLinesToVtt(lines, opts?)` | `SubtitleLine[]` → WebVTT string |
| `mergeDualLines(original, translated)` | Dual-line merge (`translated\\noriginal`); throws on length mismatch |
| `ACCELERATED_DASH` | `"accelerated_dash"` |
