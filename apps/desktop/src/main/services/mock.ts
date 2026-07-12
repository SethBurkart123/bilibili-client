import type {
  ChannelInfo,
  ChannelVideosPage,
  LoginPollResult,
  LoginQr,
  LoginState,
  SearchUsersPage,
  SearchVideosPage,
  SubtitleLine,
  SubtitleTrackInfo,
  TranslateOptions,
  TranslatorSettings,
  VideoCard,
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

const MOCK_CHANNEL_VIDEOS: VideoCard[] = [
  {
    bvid: "BV1xx411c7mD",
    aid: 170001,
    title: "【双语字幕】深入浅出：Electron 桌面应用从零到一",
    pic: "https://example.invalid/cover/BV1xx411c7mD.jpg",
    duration: 1265,
    pubdate: 1719800000,
    views: 1_284_532,
    danmaku: 8_421,
    authorName: "码农小明",
    authorMid: 208259,
  },
  {
    bvid: "BV1yy411c8nE",
    aid: 170002,
    title: "IPC 通信实战：主进程与渲染进程协作",
    pic: "https://example.invalid/cover/BV1yy411c8nE.jpg",
    duration: 842,
    pubdate: 1717200000,
    views: 456_200,
    danmaku: 2_110,
    authorName: "码农小明",
    authorMid: 208259,
  },
  {
    bvid: "BV1zz411c9pF",
    aid: 170003,
    title: "打包发布指南：macOS / Windows / Linux",
    pic: "https://example.invalid/cover/BV1zz411c9pF.jpg",
    duration: 1104,
    pubdate: 1714600000,
    views: 298_800,
    danmaku: 1_540,
    authorName: "码农小明",
    authorMid: 208259,
  },
];

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

  async getChannelInfo(mid: number): Promise<ChannelInfo> {
    await latency();
    return {
      mid,
      name: "码农小明",
      face: "https://example.invalid/face/owner.jpg",
      sign: "写点 Electron，看看 bilibili。",
      follower: 128_400,
    };
  }

  async getChannelVideos(_mid: number, _page: number): Promise<ChannelVideosPage> {
    await latency();
    return {
      items: MOCK_CHANNEL_VIDEOS,
      total: MOCK_CHANNEL_VIDEOS.length,
      hasMore: false,
    };
  }

  async searchVideos(keyword: string, page: number): Promise<SearchVideosPage> {
    await latency();
    const q = keyword.trim().toLowerCase();
    const items = MOCK_CHANNEL_VIDEOS.filter((v) =>
      q ? v.title.toLowerCase().includes(q) || v.bvid.toLowerCase().includes(q) : true,
    ).slice(0, 2);
    return {
      items:
        items.length > 0
          ? items
          : MOCK_CHANNEL_VIDEOS.slice(0, 2).map((v) => ({
              ...v,
              title: `${keyword} — ${v.title}`,
            })),
      hasMore: false,
      page,
    };
  }

  async searchUsers(keyword: string, page: number): Promise<SearchUsersPage> {
    await latency();
    const label = keyword.trim() || "uploader";
    return {
      items: [
        {
          mid: 208259,
          name: "码农小明",
          face: "https://example.invalid/face/owner.jpg",
          sign: `Matches “${label}”`,
          followers: 128_400,
          videos: 42,
        },
        {
          mid: 308260,
          name: "前端阿花",
          face: "https://example.invalid/face/user2.jpg",
          sign: "React / Electron notes",
          followers: 56_200,
          videos: 18,
        },
      ],
      hasMore: false,
      page,
    };
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
