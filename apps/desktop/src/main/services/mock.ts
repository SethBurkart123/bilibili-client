import type {
  LoginPollResult,
  LoginQr,
  LoginState,
  SubtitleLine,
  SubtitleTrackInfo,
  TranslateOptions,
  TranslatorSettings,
  VideoId,
  VideoInfo,
} from "@bili/types";
import type { BiliBridge } from "./bridge";
import {
  DEFAULT_SETTINGS,
  getCommentPage,
  getReplyPage,
  MOCK_MPD_XML,
  MOCK_PLAY_URL,
  MOCK_VIDEO,
} from "./fixtures";
import { loadSettings, saveSettings } from "./settings-store";

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function latency(): Promise<void> {
  return delay(150 + Math.floor(Math.random() * 251));
}

export class MockBiliService implements BiliBridge {
  private settings: TranslatorSettings = { ...DEFAULT_SETTINGS };
  private settingsLoaded = false;

  private ensureSettings(): void {
    if (!this.settingsLoaded) {
      this.settings = loadSettings();
      this.settingsLoaded = true;
    }
  }

  async resolveVideo(url: string): Promise<VideoInfo> {
    await latency();
    const trimmed = url.trim();
    if (!trimmed) {
      throw new Error("Empty video URL");
    }
    const bvidMatch = trimmed.match(/BV[\w]+/i);
    const video: VideoInfo = {
      ...MOCK_VIDEO,
      bvid: bvidMatch ? bvidMatch[0].replace(/^bv/i, "BV") : MOCK_VIDEO.bvid,
    };
    return video;
  }

  async getStreams(
    _id: VideoId,
    _cid: number,
  ): Promise<{ playUrl: typeof MOCK_PLAY_URL; mpdXml: string }> {
    await latency();
    return {
      playUrl: MOCK_PLAY_URL,
      mpdXml: MOCK_MPD_XML,
    };
  }

  async getComments(aid: number, offset: string | null) {
    await latency();
    if (!aid) {
      throw new Error("aid is required");
    }
    return getCommentPage(offset);
  }

  async getReplies(aid: number, root: number, pn: number) {
    await latency();
    if (!aid || !root) {
      throw new Error("aid and root are required");
    }
    return getReplyPage(root, pn);
  }

  async translate(texts: string[], _opts?: TranslateOptions): Promise<string[]> {
    await delay(300);
    return texts.map((t) => "[EN] " + t);
  }

  async getSettings(): Promise<TranslatorSettings> {
    await latency();
    this.ensureSettings();
    return structuredClone(this.settings);
  }

  async setSettings(s: TranslatorSettings): Promise<void> {
    await latency();
    this.settings = structuredClone(s);
    this.settingsLoaded = true;
    saveSettings(this.settings);
  }

  async getSubtitles(_id: VideoId, _cid: number): Promise<SubtitleTrackInfo[]> {
    await latency();
    return [];
  }

  async getSubtitleLines(_url: string): Promise<SubtitleLine[]> {
    await latency();
    return [];
  }

  async loginQrStart(): Promise<LoginQr> {
    await latency();
    return { url: "https://example.invalid/qr", qrcodeKey: "mock" };
  }

  async loginQrPoll(_qrcodeKey: string): Promise<LoginPollResult> {
    await latency();
    return { status: "waiting" };
  }

  async getLoginState(): Promise<LoginState> {
    await latency();
    return { loggedIn: false };
  }

  async logout(): Promise<void> {
    await latency();
  }
}
