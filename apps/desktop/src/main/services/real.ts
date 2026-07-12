import { join } from "node:path";
import { app } from "electron";
import { BiliClient } from "@bili/api";
import { buildMpd } from "@bili/player";
import {
  createGoogleTranslator,
  createOpenAITranslator,
  JsonFileCache,
  withCache,
} from "@bili/translate";
import type {
  PlayUrlResult,
  TranslateOptions,
  Translator,
  TranslatorSettings,
  VideoId,
  VideoInfo,
} from "@bili/types";
import type { BiliBridge } from "./bridge";
import { loadSettings, saveSettings } from "./settings-store";

function translationsCachePath(): string {
  return join(app.getPath("userData"), "translations.json");
}

function openaiConfigured(settings: TranslatorSettings): boolean {
  const openai = settings.openai;
  return (
    settings.provider === "openai" &&
    !!openai &&
    openai.apiKey.trim().length > 0 &&
    openai.baseURL.trim().length > 0 &&
    openai.model.trim().length > 0
  );
}

function buildTranslator(
  settings: TranslatorSettings,
  cache: JsonFileCache,
): Translator {
  if (openaiConfigured(settings)) {
    const openai = settings.openai!;
    return withCache(
      createOpenAITranslator({
        baseURL: openai.baseURL,
        apiKey: openai.apiKey,
        model: openai.model,
      }),
      cache,
      "openai",
    );
  }
  return withCache(createGoogleTranslator(), cache, "gtx");
}

export class RealBiliService implements BiliBridge {
  private readonly client = new BiliClient();
  private readonly cache = new JsonFileCache(translationsCachePath());
  private settings: TranslatorSettings = loadSettings();
  private translator: Translator = buildTranslator(this.settings, this.cache);

  private rebuildTranslator(): void {
    this.translator = buildTranslator(this.settings, this.cache);
  }

  async flush(): Promise<void> {
    await this.cache.flush();
  }

  async resolveVideo(url: string): Promise<VideoInfo> {
    const id = await this.client.parseVideoUrl(url);
    return this.client.getView(id);
  }

  async getStreams(
    id: VideoId,
    cid: number,
  ): Promise<{ playUrl: PlayUrlResult; mpdXml: string }> {
    const playUrl = await this.client.getPlayUrl(id, cid);
    return { playUrl, mpdXml: buildMpd(playUrl.dash) };
  }

  async getComments(aid: number, offset: string | null) {
    return this.client.getComments(aid, offset);
  }

  async getReplies(aid: number, root: number, pn: number) {
    return this.client.getReplies(aid, root, pn);
  }

  async translate(texts: string[], opts?: TranslateOptions): Promise<string[]> {
    return this.translator.translateBatch(texts, {
      from: opts?.from ?? "zh-CN",
      to: opts?.to ?? this.settings.targetLang,
      context: opts?.context,
    });
  }

  async getSettings(): Promise<TranslatorSettings> {
    return structuredClone(this.settings);
  }

  async setSettings(s: TranslatorSettings): Promise<void> {
    this.settings = structuredClone(s);
    saveSettings(this.settings);
    this.rebuildTranslator();
  }
}
