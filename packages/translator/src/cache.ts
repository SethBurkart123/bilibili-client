import { createHash } from "node:crypto";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import type { TranslateOptions, Translator } from "@bili/types";

export interface TranslationCache {
  get(key: string): string | undefined | Promise<string | undefined>;
  set(key: string, value: string): void | Promise<void>;
}

export class MemoryCache implements TranslationCache {
  private readonly store = new Map<string, string>();

  get(key: string): string | undefined {
    return this.store.get(key);
  }

  set(key: string, value: string): void {
    this.store.set(key, value);
  }
}

export class JsonFileCache implements TranslationCache {
  private data: Record<string, string> | null = null;
  private dirty = false;
  private writeTimer: ReturnType<typeof setTimeout> | null = null;
  private writeChain: Promise<void> = Promise.resolve();

  constructor(private readonly path: string) {}

  private async ensureLoaded(): Promise<Record<string, string>> {
    if (this.data !== null) {
      return this.data;
    }
    try {
      const raw = await readFile(this.path, "utf8");
      const parsed: unknown = JSON.parse(raw);
      this.data =
        parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)
          ? (parsed as Record<string, string>)
          : {};
    } catch (err) {
      const code =
        err && typeof err === "object" && "code" in err
          ? (err as { code: unknown }).code
          : undefined;
      if (code === "ENOENT") {
        this.data = {};
      } else {
        throw err;
      }
    }
    return this.data;
  }

  async get(key: string): Promise<string | undefined> {
    const data = await this.ensureLoaded();
    return data[key];
  }

  async set(key: string, value: string): Promise<void> {
    const data = await this.ensureLoaded();
    data[key] = value;
    this.dirty = true;
    this.scheduleWrite();
  }

  private scheduleWrite(): void {
    if (this.writeTimer !== null) {
      clearTimeout(this.writeTimer);
    }
    this.writeTimer = setTimeout(() => {
      this.writeTimer = null;
      this.writeChain = this.writeChain.then(() => this.persist());
    }, 500);
  }

  private async persist(): Promise<void> {
    if (!this.dirty || this.data === null) {
      return;
    }
    this.dirty = false;
    await mkdir(dirname(this.path), { recursive: true });
    await writeFile(this.path, JSON.stringify(this.data), "utf8");
  }

  async flush(): Promise<void> {
    if (this.writeTimer !== null) {
      clearTimeout(this.writeTimer);
      this.writeTimer = null;
    }
    this.writeChain = this.writeChain.then(() => this.persist());
    await this.writeChain;
  }
}

function cacheKey(text: string, to: string, keyExtra?: string): string {
  const material = `${keyExtra ?? ""} ${to} ${text}`;
  return createHash("sha1").update(material).digest("hex");
}

export function withCache(
  inner: Translator,
  cache: TranslationCache,
  keyExtra?: string,
): Translator {
  return {
    async translateBatch(
      texts: string[],
      opts?: TranslateOptions,
    ): Promise<string[]> {
      const to = opts?.to ?? "en";
      const keys = texts.map((text) => cacheKey(text, to, keyExtra));
      const results: (string | undefined)[] = await Promise.all(
        keys.map((key) => Promise.resolve(cache.get(key))),
      );

      const missIndices: number[] = [];
      const missTexts: string[] = [];
      for (let i = 0; i < texts.length; i++) {
        if (results[i] === undefined) {
          missIndices.push(i);
          missTexts.push(texts[i]!);
        }
      }

      if (missTexts.length > 0) {
        const translated = await inner.translateBatch(missTexts, opts);
        for (let j = 0; j < missIndices.length; j++) {
          const idx = missIndices[j]!;
          const value = translated[j]!;
          results[idx] = value;
          // providers fall back to the original text on failure — don't cache
          // those, or a transient error becomes a permanently "translated" entry
          if (value !== missTexts[j]) {
            await Promise.resolve(cache.set(keys[idx]!, value));
          }
        }
      }

      return results as string[];
    },
  };
}
