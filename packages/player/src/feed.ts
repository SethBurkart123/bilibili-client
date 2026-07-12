import { mpdToDataUri } from "./mpd";

/**
 * PlayerModes.ACCELERATED_DASH from vendor/faststream/chrome/player/enums/PlayerModes.mjs
 * Copied verbatim — do not invent alternate spellings.
 */
export const ACCELERATED_DASH = "accelerated_dash" as const;

/** Inline subtitle track for FastStream `recieveSources` (data = WebVTT text). */
export interface FeedSubtitleTrack {
  label: string;
  language: string;
  /** WebVTT document text (becomes `data` on the wire). */
  vtt: string;
}

export interface FeedPlayerOptions {
  headers?: Record<string, string>;
  /**
   * Subtitle tracks to attach. Mapped to FastStream's inline shape
   * `{ label, language, data }` where `data` is the VTT text.
   * When omitted, the payload still sends `subtitles: []`.
   */
  subtitles?: FeedSubtitleTrack[];
  /**
   * When true (default), FastStream enables autoplay for the new source.
   * Desktop embeds need this — without it the player sits on a black frame.
   */
  forceAutoplay?: boolean;
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

  const subtitles =
    opts?.subtitles?.map((t) => ({
      label: t.label,
      language: t.language,
      data: t.vtt,
    })) ?? [];

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
    // Without forceAutoplay, setSource never calls play() — black frame hang.
    forceAutoplay: opts?.forceAutoplay !== false,
    subtitles,
  };

  const origin = globalThis.location?.origin;
  if (!origin) {
    throw new Error(
      "feedPlayer: globalThis.location.origin is required (browser / same-origin host)",
    );
  }
  win.postMessage(message, origin);
}

/**
 * Add subtitle tracks to a playing FastStream iframe without reloading the source.
 *
 * Posts `{ type: "subtitles", subtitles, activateLabel? }` to the same-origin
 * message listener (vendored patch in `main.mjs`). Prefer `feedPlayer(..., {
 * subtitles })` for tracks known at initial feed time.
 */
export function addSubtitleTracks(
  iframe: HTMLIFrameElement,
  tracks: Array<{ label: string; language: string; vtt: string }>,
  opts?: { activateLabel?: string },
): void {
  const win = iframe.contentWindow;
  if (!win) {
    throw new Error("addSubtitleTracks: iframe has no contentWindow");
  }

  const message: {
    type: "subtitles";
    subtitles: Array<{ label: string; language: string; data: string }>;
    activateLabel?: string;
  } = {
    type: "subtitles",
    subtitles: tracks.map((t) => ({
      label: t.label,
      language: t.language,
      data: t.vtt,
    })),
  };
  if (opts?.activateLabel !== undefined) {
    message.activateLabel = opts.activateLabel;
  }

  const origin = globalThis.location?.origin;
  if (!origin) {
    throw new Error(
      "addSubtitleTracks: globalThis.location.origin is required (browser / same-origin host)",
    );
  }
  win.postMessage(message, origin);
}
