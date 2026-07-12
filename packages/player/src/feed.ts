import { mpdToDataUri } from "./mpd";

/**
 * PlayerModes.ACCELERATED_DASH from vendor/faststream/chrome/player/enums/PlayerModes.mjs
 * Copied verbatim — do not invent alternate spellings.
 */
export const ACCELERATED_DASH = "accelerated_dash" as const;

export interface FeedPlayerOptions {
  headers?: Record<string, string>;
}

/**
 * Post a DASH source into a FastStream web-player iframe via postMessage.
 *
 * Payload shape matches `recieveSources` in vendor/faststream/chrome/player/main.mjs
 * (non-extension path listens for `e.data?.type === 'sources'`).
 *
 * **Origin discipline:** the host page and the player iframe MUST share an
 * origin. FastStream rejects messages when
 * `e.origin !== window.location.origin`. Serve `dist/faststream-web` from the
 * same origin as the embedding page (custom protocol or local static server).
 */
export function feedPlayer(
  iframe: HTMLIFrameElement,
  mpdXml: string,
  opts?: FeedPlayerOptions,
): void {
  const win = iframe.contentWindow;
  if (!win) {
    throw new Error("feedPlayer: iframe has no contentWindow");
  }

  const message = {
    type: "sources" as const,
    sources: [
      {
        url: mpdToDataUri(mpdXml),
        mode: ACCELERATED_DASH,
        headers: opts?.headers ?? {},
      },
    ],
    // Without autoSetSource, recieveSources nulls the chosen source and never
    // calls addSource(..., true) as current.
    autoSetSource: true,
    subtitles: [] as [],
  };

  const origin = globalThis.location?.origin;
  if (!origin) {
    throw new Error(
      "feedPlayer: globalThis.location.origin is required (browser / same-origin host)",
    );
  }
  win.postMessage(message, origin);
}
