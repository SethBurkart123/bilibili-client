import { describe, expect, test } from "bun:test";
import { createOpenAITranslator } from "./openai.ts";

type ChatBody = {
  model: string;
  temperature: number;
  messages: Array<{ role: string; content: string }>;
};

describe("createOpenAITranslator", () => {
  test("single request carries all texts as a JSON array", async () => {
    const bodies: ChatBody[] = [];
    const translator = createOpenAITranslator({
      baseURL: "https://api.example.com",
      apiKey: "sk-test",
      model: "gpt-test",
      fetch: async (_input, init) => {
        bodies.push(JSON.parse(String(init?.body)) as ChatBody);
        return new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify(["Hello", "World"]),
                },
              },
            ],
          }),
          { status: 200 },
        );
      },
    });

    const out = await translator.translateBatch(["你好", "世界"]);
    expect(out).toEqual(["Hello", "World"]);
    expect(bodies).toHaveLength(1);
    expect(bodies[0]!.model).toBe("gpt-test");
    expect(bodies[0]!.temperature).toBe(0.2);
    expect(JSON.parse(bodies[0]!.messages[1]!.content)).toEqual([
      "你好",
      "世界",
    ]);
    expect(bodies[0]!.messages[0]!.content).toContain("zh-CN");
    expect(bodies[0]!.messages[0]!.content).toContain("[doge]");
  });

  test("does not double /v1 when baseURL already ends with it", async () => {
    const urls: string[] = [];
    const translator = createOpenAITranslator({
      baseURL: "https://api.example.com/v1/",
      apiKey: "sk-test",
      model: "gpt-test",
      fetch: async (input) => {
        urls.push(String(input));
        return new Response(
          JSON.stringify({
            choices: [{ message: { content: '["a"]' } }],
          }),
          { status: 200 },
        );
      },
    });

    await translator.translateBatch(["x"]);
    expect(urls[0]).toBe("https://api.example.com/v1/chat/completions");
  });

  test("90-text batch with batchSize 40 splits into 3 requests", async () => {
    const requestCounts: number[] = [];
    const translator = createOpenAITranslator({
      baseURL: "https://api.example.com",
      apiKey: "sk-test",
      model: "gpt-test",
      batchSize: 40,
      fetch: async (_input, init) => {
        const body = JSON.parse(String(init?.body)) as ChatBody;
        const texts = JSON.parse(body.messages[1]!.content) as string[];
        requestCounts.push(texts.length);
        return new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify(texts.map((t) => `T:${t}`)),
                },
              },
            ],
          }),
          { status: 200 },
        );
      },
    });

    const texts = Array.from({ length: 90 }, (_, i) => `t${i}`);
    const out = await translator.translateBatch(texts);

    expect(requestCounts).toEqual([40, 40, 10]);
    expect(out).toHaveLength(90);
    expect(out[0]).toBe("T:t0");
    expect(out[89]).toBe("T:t89");
  });

  test("length-mismatch reply triggers exactly one retry then falls back", async () => {
    let calls = 0;
    const translator = createOpenAITranslator({
      baseURL: "https://api.example.com",
      apiKey: "sk-test",
      model: "gpt-test",
      fetch: async () => {
        calls++;
        return new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify(["only-one"]),
                },
              },
            ],
          }),
          { status: 200 },
        );
      },
    });

    const originals = ["一", "二", "三"];
    const out = await translator.translateBatch(originals);
    expect(calls).toBe(2);
    expect(out).toEqual(originals);
  });

  test("parses ```json fenced reply", async () => {
    const translator = createOpenAITranslator({
      baseURL: "https://api.example.com",
      apiKey: "sk-test",
      model: "gpt-test",
      fetch: async () =>
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: '```json\n["Hello", "World"]\n```',
                },
              },
            ],
          }),
          { status: 200 },
        ),
    });

    const out = await translator.translateBatch(["你好", "世界"]);
    expect(out).toEqual(["Hello", "World"]);
  });
});
