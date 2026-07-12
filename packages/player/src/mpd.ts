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
  const initialization = escapeXml(track.segmentBase.initialization);
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

function adaptationSetXml(tracks: DashTrack[]): string {
  return `<AdaptationSet>${tracks.map(representationXml).join("")}</AdaptationSet>`;
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

/** Encode an MPD string as a data URI for FastStream VideoSource. */
export function mpdToDataUri(mpd: string): string {
  const base64 = Buffer.from(mpd, "utf8").toString("base64");
  return `data:application/dash+xml;base64,${base64}`;
}
