import type { SubtitleLine } from "@bili/types";

const MIN_DURATION_S = 0.5;

/** Escape WebVTT cue text (`&`, `<`, `>`). */
function escapeVttText(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Format seconds as WebVTT `HH:MM:SS.mmm` (hours always two digits, including >= 1h).
 */
function formatVttTimestamp(seconds: number): string {
  const totalMs = Math.max(0, Math.round(seconds * 1000));
  const ms = totalMs % 1000;
  const totalSec = Math.floor(totalMs / 1000);
  const s = totalSec % 60;
  const totalMin = Math.floor(totalSec / 60);
  const m = totalMin % 60;
  const h = Math.floor(totalMin / 60);

  const hh = String(h).padStart(2, "0");
  const mm = String(m).padStart(2, "0");
  const ss = String(s).padStart(2, "0");
  const mmm = String(ms).padStart(3, "0");
  return `${hh}:${mm}:${ss}.${mmm}`;
}

/**
 * Convert `SubtitleLine[]` to a valid WebVTT document.
 *
 * - Cues sorted by start time
 * - Zero/negative durations clamped to a +0.5s minimum
 * - Cue text escaped for `&`, `<`, `>`
 * - Optional `opts.label` becomes the WebVTT file description after `WEBVTT`
 */
export function subtitleLinesToVtt(
  lines: SubtitleLine[],
  opts?: { label?: string },
): string {
  const sorted = [...lines].sort((a, b) => a.from - b.from);

  const header =
    opts?.label !== undefined && opts.label !== ""
      ? `WEBVTT ${opts.label}`
      : "WEBVTT";

  const cues = sorted.map((line) => {
    const start = line.from;
    let end = line.to;
    if (end - start <= 0) {
      end = start + MIN_DURATION_S;
    }
    const text = escapeVttText(line.content);
    return `${formatVttTimestamp(start)} --> ${formatVttTimestamp(end)}\n${text}`;
  });

  if (cues.length === 0) {
    return `${header}\n\n`;
  }
  return `${header}\n\n${cues.join("\n\n")}\n`;
}

/**
 * Merge original timed lines with a same-length translated string array.
 * Translated text is placed above the original (`translated\\noriginal`).
 *
 * @throws {RangeError} if array lengths differ
 */
export function mergeDualLines(
  original: SubtitleLine[],
  translated: string[],
): SubtitleLine[] {
  if (original.length !== translated.length) {
    throw new RangeError(
      `mergeDualLines: length mismatch (original=${original.length}, translated=${translated.length})`,
    );
  }

  return original.map((line, i) => ({
    from: line.from,
    to: line.to,
    content: `${translated[i]!}\n${line.content}`,
  }));
}
