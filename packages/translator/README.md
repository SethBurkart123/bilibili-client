# @bili/translate

Dependency-free TypeScript translation helpers for the bilibili-client monorepo.
Implements the shared `Translator` contract from `@bili/types`.

## Install

Workspace package — use from other packages via `"@bili/translate": "workspace:*"`.

## Usage

```ts
import {
  createGoogleTranslator,
  createOpenAITranslator,
  MemoryCache,
  JsonFileCache,
  withCache,
} from "@bili/translate";

// Free unofficial Google gtx endpoint (inject fetch in tests)
const google = createGoogleTranslator({ concurrency: 3, delayMs: 250 });
const [en] = await google.translateBatch(["你好世界"]);

// OpenAI-compatible chat completions
const openai = createOpenAITranslator({
  baseURL: "https://api.openai.com/v1",
  apiKey: process.env.OPENAI_API_KEY!,
  model: "gpt-4o-mini",
  batchSize: 40,
});

// Cache layer (memory or JSON file)
const cached = withCache(google, new MemoryCache(), "gtx");
// or: withCache(google, new JsonFileCache("./.cache/translations.json"));

const out = await cached.translateBatch(
  ["这个视频很有趣", "点赞[doge]"],
  { from: "zh-CN", to: "en", context: "bilibili video comments" },
);
```

## Live smoke

```bash
bun packages/translator/scripts/live-smoke.ts
```

Hits the real Google gtx endpoint with two sample Chinese strings.
