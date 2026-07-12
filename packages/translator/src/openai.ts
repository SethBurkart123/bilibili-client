import type { TranslateOptions, Translator } from "@bili/types";

export interface OpenAITranslatorConfig {
  baseURL: string;
  apiKey: string;
  model: string;
  fetch?: typeof fetch;
  batchSize?: number;
}

function chatCompletionsUrl(baseURL: string): string {
  const trimmed = baseURL.replace(/\/+$/, "");
  if (trimmed.endsWith("/v1")) {
    return `${trimmed}/chat/completions`;
  }
  return `${trimmed}/v1/chat/completions`;
}

function systemPrompt(
  from: string,
  to: string,
  context?: string,
  corrective?: boolean,
): string {
  const lines = [
    `Translate the following JSON array of ${from} texts to ${to}.`,
    "Return ONLY a JSON array of strings with the same length and order.",
    "Preserve tokens like [doge] untouched.",
  ];
  if (context) {
    lines.push(`Context: ${context}`);
  }
  if (corrective) {
    lines.push(
      "Your previous reply did not contain a JSON array of the same length. Return ONLY a JSON array of strings with exactly the same length and order as the input.",
    );
  }
  return lines.join(" ");
}

function stripFence(content: string): string {
  const trimmed = content.trim();
  const fence = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i.exec(trimmed);
  if (fence) {
    return fence[1]!.trim();
  }
  return trimmed;
}

function parseReplyArray(content: string): string[] | null {
  try {
    const parsed: unknown = JSON.parse(stripFence(content));
    if (
      !Array.isArray(parsed) ||
      !parsed.every((item) => typeof item === "string")
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

async function completeChunk(
  texts: string[],
  from: string,
  to: string,
  context: string | undefined,
  cfg: OpenAITranslatorConfig,
  doFetch: typeof fetch,
  url: string,
  corrective: boolean,
): Promise<string[] | null> {
  const res = await doFetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content: systemPrompt(from, to, context, corrective),
        },
        {
          role: "user",
          content: JSON.stringify(texts),
        },
      ],
    }),
  });

  if (!res.ok) {
    return null;
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    return null;
  }

  const parsed = parseReplyArray(content);
  if (!parsed || parsed.length !== texts.length) {
    return null;
  }
  return parsed;
}

export function createOpenAITranslator(cfg: OpenAITranslatorConfig): Translator {
  const doFetch = cfg.fetch ?? globalThis.fetch.bind(globalThis);
  const batchSize = cfg.batchSize ?? 40;
  const url = chatCompletionsUrl(cfg.baseURL);

  return {
    async translateBatch(
      texts: string[],
      translateOpts?: TranslateOptions,
    ): Promise<string[]> {
      const from = translateOpts?.from ?? "zh-CN";
      const to = translateOpts?.to ?? "en";
      const context = translateOpts?.context;

      const results: string[] = new Array(texts.length);
      const chunks: Array<{ start: number; items: string[] }> = [];
      for (let i = 0; i < texts.length; i += batchSize) {
        chunks.push({ start: i, items: texts.slice(i, i + batchSize) });
      }

      for (const chunk of chunks) {
        let translated = await completeChunk(
          chunk.items,
          from,
          to,
          context,
          cfg,
          doFetch,
          url,
          false,
        );

        if (!translated) {
          translated = await completeChunk(
            chunk.items,
            from,
            to,
            context,
            cfg,
            doFetch,
            url,
            true,
          );
        }

        if (!translated) {
          for (let i = 0; i < chunk.items.length; i++) {
            results[chunk.start + i] = chunk.items[i]!;
          }
        } else {
          for (let i = 0; i < translated.length; i++) {
            results[chunk.start + i] = translated[i]!;
          }
        }
      }

      return results;
    },
  };
}
