import { describe, expect, test } from "bun:test";
import { createGoogleTranslator, splitForGtx } from "./google.ts";

const GTX_FIXTURE = [[["Hello ", "你好", null, null, 10]], null, "zh-CN"];

/** ~600+ CJK chars — typical long bilibili comment; exceeds MAX_Q_CHARS once encoded. */
const LONG_ZH = (
  "可不可以用这种方法做一种光刻机，国内的电子产品被国外卡脖子，最主要的原因就造不出光刻机。" +
  "既然光的微加工形式不好造出来，那么可不可以用这种探针实现电化学或电火花或微机械加工等等的直接形式光刻，" +
  "或者探针能够导光或导超声波等的间接形式。太赞了老哥干了我想了多年的一件事，好多设备原理真的太简单了，" +
  "以前想不通为啥这么贵。不过看完老哥的手搓设备，现在回头想想实验级设备还是有十几万的道理。" +
  "自己也在做的Cute STM Project，视频给了很多启发和思路，继续加油把项目做完分享给大家看。" +
  "另外关于探针制备，有个不太靠谱的办法是边通电边拉升钨丝，需要制作对应的夹具才能稳定复现。" +
  "希望up主后续能再出一期讲解电路设计和软件控制的细节，这样爱好者更容易跟着复现整套系统。"
).repeat(2);

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

  test("splitForGtx chunks realistically long Chinese comments", () => {
    expect(LONG_ZH.length).toBeGreaterThan(200);
    const chunks = splitForGtx(LONG_ZH);
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.join("")).toBe(LONG_ZH);
    for (const chunk of chunks) {
      expect(chunk.length).toBeLessThanOrEqual(200);
    }
  });

  test("long Chinese comment is fetched in chunks and joined", async () => {
    const urls: string[] = [];
    let call = 0;
    const translator = createGoogleTranslator({
      concurrency: 1,
      delayMs: 0,
      fetch: async (input) => {
        urls.push(String(input));
        call += 1;
        const fixture = [
          [[`EN${call} `, "x", null, null, 10]],
          null,
          "zh-CN",
        ];
        return new Response(JSON.stringify(fixture), { status: 200 });
      },
    });

    const [out] = await translator.translateBatch([LONG_ZH]);
    expect(urls.length).toBeGreaterThan(1);
    for (const u of urls) {
      expect(u.length).toBeLessThan(2200);
      expect(new URL(u).searchParams.get("q")!.length).toBeLessThanOrEqual(200);
    }
    expect(out.startsWith("EN1 ")).toBe(true);
    expect(out).toContain(`EN${urls.length} `);
  });
});
