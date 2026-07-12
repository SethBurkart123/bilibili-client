import type { TranslateOptions, Translator } from "@bili/types";

export interface GoogleTranslatorOptions {
  fetch?: typeof fetch;
  concurrency?: number;
  delayMs?: number;
}

function parseGtxResponse(data: unknown): string {
  if (!Array.isArray(data) || !Array.isArray(data[0])) {
    throw new Error("unexpected gtx response shape");
  }
  const segments = data[0] as unknown[];
  return segments
    .map((seg) => {
      if (!Array.isArray(seg) || typeof seg[0] !== "string") {
        throw new Error("unexpected gtx segment shape");
      }
      return seg[0];
    })
    .join("");
}

async function translateOne(
  text: string,
  from: string,
  to: string,
  doFetch: typeof fetch,
): Promise<string> {
  const url = new URL("https://translate.googleapis.com/translate_a/single");
  url.searchParams.set("client", "gtx");
  url.searchParams.set("sl", from);
  url.searchParams.set("tl", to);
  url.searchParams.set("dt", "t");
  url.searchParams.set("q", text);

  const res = await doFetch(url.toString());
  if (!res.ok) {
    throw new Error(`gtx HTTP ${res.status}`);
  }
  const data: unknown = await res.json();
  return parseGtxResponse(data);
}

/**
 * Small per-factory queue: at most `concurrency` in flight, and each slot
 * waits at least `delayMs` after its previous start before starting the next.
 */
function createQueue(concurrency: number, delayMs: number) {
  type Task = {
    fn: () => Promise<unknown>;
    resolve: (value: unknown) => void;
    reject: (reason: unknown) => void;
  };

  const pending: Task[] = [];
  const slots = Array.from({ length: concurrency }, () => ({
    busy: false,
    nextAt: 0,
  }));

  function pump() {
    for (const slot of slots) {
      if (slot.busy || pending.length === 0) continue;
      const task = pending.shift()!;
      slot.busy = true;
      void (async () => {
        const waitMs = Math.max(0, slot.nextAt - Date.now());
        if (waitMs > 0) {
          await new Promise((r) => setTimeout(r, waitMs));
        }
        slot.nextAt = Date.now() + delayMs;
        try {
          task.resolve(await task.fn());
        } catch (err) {
          task.reject(err);
        } finally {
          slot.busy = false;
          pump();
        }
      })();
    }
  }

  return function runQueued<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      pending.push({
        fn,
        resolve: resolve as (value: unknown) => void,
        reject,
      });
      pump();
    });
  };
}

export function createGoogleTranslator(
  opts: GoogleTranslatorOptions = {},
): Translator {
  const doFetch = opts.fetch ?? globalThis.fetch.bind(globalThis);
  const concurrency = opts.concurrency ?? 3;
  const delayMs = opts.delayMs ?? 250;
  const runQueued = createQueue(concurrency, delayMs);

  return {
    async translateBatch(
      texts: string[],
      translateOpts?: TranslateOptions,
    ): Promise<string[]> {
      const from = translateOpts?.from ?? "zh-CN";
      const to = translateOpts?.to ?? "en";

      return Promise.all(
        texts.map((text) =>
          runQueued(async () => {
            try {
              return await translateOne(text, from, to, doFetch);
            } catch {
              return text;
            }
          }),
        ),
      );
    },
  };
}
