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

## Demo

```bash
bun packages/player/scripts/build-player.ts
bun packages/player/scripts/demo.ts
# open http://localhost:4321/
```

Click **Load Big Buck Bunny (DASH)** to post a public Akamai test MPD URL into the iframe.

## API

| Export | Role |
|--------|------|
| `buildMpd(dash)` | Pure `DashInfo` → static MPD XML (Bilibili2Dash port) |
| `mpdToDataUri(mpd)` | `data:application/dash+xml;base64,...` |
| `feedPlayer(iframe, mpdXml, opts?)` | Same-origin `postMessage` into FastStream |
| `ACCELERATED_DASH` | `"accelerated_dash"` |
