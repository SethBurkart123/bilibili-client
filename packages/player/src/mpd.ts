import type { DashInfo, DashTrack } from "@bili/types";

/** Escape text/attribute content for well-formed XML. */
function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function representationXml(track: DashTrack): string {
  const attrs: string[] = [
    `id="${escapeXml(String(track.id))}"`,
    `codecs="${escapeXml(track.codecs)}"`,
    `bandwidth="${escapeXml(String(track.bandwidth))}"`,
  ];

  if (track.width != null) {
    attrs.push(`width="${escapeXml(String(track.width))}"`);
  }
  if (track.height != null) {
    attrs.push(`height="${escapeXml(String(track.height))}"`);
  }
  if (track.frameRate != null) {
    attrs.push(`frameRate="${escapeXml(track.frameRate)}"`);
  }

  attrs.push(`mimeType="${escapeXml(track.mimeType)}"`);

  const indexRange = escapeXml(track.segmentBase.indexRange);
  const initialization = escapeXml(
    track.segmentBase.initialization || initializationBefore(track.segmentBase.indexRange),
  );
  const baseUrl = escapeXml(track.baseUrl);

  return [
    `<Representation ${attrs.join(" ")}>`,
    `<BaseURL>${baseUrl}</BaseURL>`,
    `<SegmentBase indexRange="${indexRange}">`,
    `<Initialization range="${initialization}"/>`,
    `</SegmentBase>`,
    `</Representation>`,
  ].join("");
}

function initializationBefore(indexRange: string): string {
  const indexStart = Number(indexRange.split("-", 1)[0]);
  if (!Number.isSafeInteger(indexStart) || indexStart <= 0) {
    throw new Error(`Cannot derive initialization range from indexRange: ${indexRange}`);
  }
  return `0-${indexStart - 1}`;
}

function adaptationSetXml(tracks: DashTrack[]): string {
  const byId = new Map<number, DashTrack>();
  for (const track of tracks) {
    const existing = byId.get(track.id);
    // Bilibili reuses quality ids across codecs, while FastStream keys its
    // fragment store by that quality id. Keep one representation per quality,
    // preferring AVC for Chromium compatibility and stable fragment lookup.
    if (!existing || (track.codecid === 7 && existing.codecid !== 7)) {
      byId.set(track.id, track);
    }
  }
  return `<AdaptationSet>${Array.from(byId.values()).map(representationXml).join("")}</AdaptationSet>`;
}

/**
 * Build a static DASH MPD from normalized Bilibili DashInfo.
 * Faithful TypeScript port of FastStream's Bilibili2Dash (no DOM).
 */
export function buildMpd(dash: DashInfo): string {
  const minBufferTime = `PT${dash.minBufferTime}S`;
  const mediaPresentationDuration = `PT${dash.duration}S`;

  const mpd =
    `<MPD xmlns="urn:mpeg:dash:schema:mpd:2011"` +
    ` xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"` +
    ` xsi:schemaLocation="urn:mpeg:DASH:schema:MPD:2011 DASH-MPD.xsd"` +
    ` profiles="urn:mpeg:dash:profile:isoff-main:2011"` +
    ` minBufferTime="${escapeXml(minBufferTime)}"` +
    ` type="static"` +
    ` mediaPresentationDuration="${escapeXml(mediaPresentationDuration)}">` +
    `<Period>` +
    adaptationSetXml(dash.video) +
    adaptationSetXml(dash.audio) +
    `</Period>` +
    `</MPD>`;

  return `<?xml version="1.0" encoding="utf-8"?>${mpd}`;
}

/** UTF-8 → base64 without Node `Buffer` (renderer / DOM-safe). */
function utf8ToBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  const chunk = 0x8000;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

/** Encode an MPD string as a data URI for FastStream VideoSource. */
export function mpdToDataUri(mpd: string): string {
  return `data:application/dash+xml;base64,${utf8ToBase64(mpd)}`;
}
