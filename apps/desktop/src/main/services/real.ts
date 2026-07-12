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
  LoginPollResult,
  LoginQr,
  LoginState,
  PlayUrlResult,
  SubtitleLine,
  SubtitleTrackInfo,
  TranslateOptions,
  Translator,
  TranslatorSettings,
  VideoId,
  VideoInfo,
} from "@bili/types";
import type { BiliBridge } from "./bridge";
import {
  clearSessionCookies,
  loadSessionCookies,
  saveSessionCookies,
} from "./session-store";
import { loadSettings, saveSettings } from "./settings-store";
import { StreamProxy } from "./stream-proxy";

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
  private readonly streamProxy = new StreamProxy();
  private settings: TranslatorSettings = loadSettings();
  private translator: Translator = buildTranslator(this.settings, this.cache);

  constructor() {
    const cookies = loadSessionCookies();
    if (cookies) {
      this.client.setCookies(cookies);
    }
  }

  private rebuildTranslator(): void {
    this.translator = buildTranslator(this.settings, this.cache);
  }

  async flush(): Promise<void> {
    try {
      await this.cache.flush();
    } finally {
      await this.streamProxy.stop();
    }
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
    await this.streamProxy.start();
    const dash = structuredClone(playUrl.dash);
    for (const tracks of [dash.video, dash.audio]) {
      for (const track of tracks) {
        track.baseUrl = proxyUrlForTrack(this.streamProxy, track.baseUrl, track.backupUrl);
        track.backupUrl = [];
      }
    }
    return { playUrl, mpdXml: buildMpd(dash) };
  }

  async getComments(aid: number, offset: string | null) {
    return this.client.getComments(aid, offset);
  }

  async getReplies(aid: number, root: number, pn: number) {
    return this.client.getReplies(aid, root, pn);
  }

  async translate(texts: string[], opts?: TranslateOptions): Promise<string[]> {
    const results = await this.translator.translateBatch(texts, {
      from: opts?.from ?? "zh-CN",
      to: opts?.to ?? this.settings.targetLang,
      context: opts?.context,
    });
    if (texts.length > 0) {
      let identical = 0;
      for (let i = 0; i < texts.length; i++) {
        if (results[i] === texts[i]) identical++;
      }
      if (identical / texts.length >= 0.5) {
        console.warn(
          `[translate] ${identical}/${texts.length} results identical to input` +
            (opts?.context ? ` (context: ${opts.context})` : "") +
            " — provider may have failed silently",
        );
      }
    }
    return results;
  }

  async getSettings(): Promise<TranslatorSettings> {
    return structuredClone(this.settings);
  }

  async setSettings(s: TranslatorSettings): Promise<void> {
    this.settings = structuredClone(s);
    saveSettings(this.settings);
    this.rebuildTranslator();
  }

  async getSubtitles(id: VideoId, cid: number): Promise<SubtitleTrackInfo[]> {
    return this.client.getSubtitles(id, cid);
  }

  async getSubtitleLines(url: string): Promise<SubtitleLine[]> {
    return this.client.getSubtitleLines(url);
  }

  async loginQrStart(): Promise<LoginQr> {
    return this.client.loginQrStart();
  }

  async loginQrPoll(qrcodeKey: string): Promise<LoginPollResult> {
    const result = await this.client.loginQrPoll(qrcodeKey);
    if (result.status === "success") {
      saveSessionCookies(this.client.getCookies());
    }
    return result;
  }

  async getLoginState(): Promise<LoginState> {
    return this.client.getLoginState();
  }

  async logout(): Promise<void> {
    await this.client.logout();
    clearSessionCookies();
  }
}

function proxyUrlForTrack(proxy: StreamProxy, baseUrl: string, backupUrl: string[]): string {
  const url = new URL(proxy.urlFor(baseUrl));
  if (backupUrl.length > 0) {
    url.searchParams.set("b", Buffer.from(JSON.stringify(backupUrl)).toString("base64url"));
  }
  return url.toString();
}
