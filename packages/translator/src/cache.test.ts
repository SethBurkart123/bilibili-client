import { describe, expect, test } from "bun:test";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Translator } from "@bili/types";
import {
  JsonFileCache,
  MemoryCache,
  withCache,
} from "./cache.ts";

function countingTranslator(calls: string[][]): Translator {
  return {
    async translateBatch(texts) {
      calls.push([...texts]);
      return texts.map((t) => `TR:${t}`);
    },
  };
}

describe("withCache", () => {
  test("second identical call performs zero inner calls", async () => {
    const calls: string[][] = [];
    const cached = withCache(countingTranslator(calls), new MemoryCache());

    const first = await cached.translateBatch(["你好", "世界"], { to: "en" });
    expect(first).toEqual(["TR:你好", "TR:世界"]);
    expect(calls).toHaveLength(1);

    const second = await cached.translateBatch(["你好", "世界"], { to: "en" });
    expect(second).toEqual(["TR:你好", "TR:世界"]);
    expect(calls).toHaveLength(1);
  });

  test("mixed hit/miss batch only sends misses and preserves order", async () => {
    const calls: string[][] = [];
    const cache = new MemoryCache();
    const cached = withCache(countingTranslator(calls), cache);

    await cached.translateBatch(["A", "C"], { to: "en" });
    expect(calls).toEqual([["A", "C"]]);

    const out = await cached.translateBatch(["A", "B", "C"], { to: "en" });
    expect(calls).toEqual([["A", "C"], ["B"]]);
    expect(out).toEqual(["TR:A", "TR:B", "TR:C"]);
  });
});

describe("JsonFileCache", () => {
  test("set + flush + new instance re-reads the value", async () => {
    const dir = await mkdtemp(join(tmpdir(), "bili-translate-"));
    const path = join(dir, "cache.json");
    try {
      const a = new JsonFileCache(path);
      await a.set("k1", "v1");
      await a.flush();

      const b = new JsonFileCache(path);
      expect(await b.get("k1")).toBe("v1");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
