import { describe, expect, test } from "bun:test";
import { createGoogleTranslator } from "./google.ts";

const GTX_FIXTURE = [[["Hello ", "你好", null, null, 10]], null, "zh-CN"];

describe("createGoogleTranslator", () => {
  test("encodes text and langs in the gtx URL", async () => {
    const urls: string[] = [];
    const translator = createGoogleTranslator({
      concurrency: 1,
      delayMs: 0,
      fetch: async (input) => {
        urls.push(String(input));
        return new Response(JSON.stringify(GTX_FIXTURE), { status: 200 });
      },
    });

    await translator.translateBatch(["你好"], { from: "zh-CN", to: "en" });

    expect(urls).toHaveLength(1);
    const url = new URL(urls[0]!);
    expect(url.origin + url.pathname).toBe(
      "https://translate.googleapis.com/translate_a/single",
    );
    expect(url.searchParams.get("client")).toBe("gtx");
    expect(url.searchParams.get("sl")).toBe("zh-CN");
    expect(url.searchParams.get("tl")).toBe("en");
    expect(url.searchParams.get("dt")).toBe("t");
    expect(url.searchParams.get("q")).toBe("你好");
  });

  test("parses nested-array gtx response", async () => {
    const translator = createGoogleTranslator({
      concurrency: 1,
      delayMs: 0,
      fetch: async () =>
        new Response(JSON.stringify(GTX_FIXTURE), { status: 200 }),
    });

    const [out] = await translator.translateBatch(["你好"]);
    expect(out).toBe("Hello ");
  });

  test("joins multiple translated segments", async () => {
    const fixture = [
      [
        ["Hello ", "你好", null, null, 10],
        ["world", "世界", null, null, 10],
      ],
      null,
      "zh-CN",
    ];
    const translator = createGoogleTranslator({
      concurrency: 1,
      delayMs: 0,
      fetch: async () => new Response(JSON.stringify(fixture), { status: 200 }),
    });

    const [out] = await translator.translateBatch(["你好世界"]);
    expect(out).toBe("Hello world");
  });

  test("rejecting fetch yields the original text", async () => {
    const translator = createGoogleTranslator({
      concurrency: 1,
      delayMs: 0,
      fetch: async () => {
        throw new Error("network down");
      },
    });

    const [out] = await translator.translateBatch(["原始文本"]);
    expect(out).toBe("原始文本");
  });

  test("HTTP error yields the original text", async () => {
    const translator = createGoogleTranslator({
      concurrency: 1,
      delayMs: 0,
      fetch: async () => new Response("nope", { status: 429 }),
    });

    const [out] = await translator.translateBatch(["限流"]);
    expect(out).toBe("限流");
  });
});
