import { createGoogleTranslator } from "../src/index.ts";

const texts = ["你好世界", "这个视频很有趣"];

const translator = createGoogleTranslator({ concurrency: 1, delayMs: 300 });

try {
  const results = await translator.translateBatch(texts);
  for (let i = 0; i < texts.length; i++) {
    console.log(`${texts[i]} => ${results[i]}`);
  }
} catch (err) {
  console.error("live-smoke failed:", err);
  process.exitCode = 1;
}
