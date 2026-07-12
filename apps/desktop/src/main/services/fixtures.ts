import type {
  CommentEmote,
  CommentItem,
  CommentPage,
  PlayUrlResult,
  TranslatorSettings,
  VideoInfo,
} from "@bili/types";

const DOGE: CommentEmote = {
  text: "[doge]",
  url: "https://example.invalid/emote/doge.png",
};

const TV_XIAOKU: CommentEmote = {
  text: "[tv_小电视]",
  url: "https://example.invalid/emote/tv.png",
};

function comment(
  rpid: number,
  uname: string,
  message: string,
  opts: {
    like?: number;
    replyCount?: number;
    replies?: CommentItem[];
    emotes?: Record<string, CommentEmote>;
    mid?: string;
    hoursAgo?: number;
  } = {},
): CommentItem {
  const hoursAgo = opts.hoursAgo ?? (rpid % 48) + 1;
  return {
    rpid,
    author: {
      mid: opts.mid ?? String(10000 + rpid),
      uname,
      avatar: `https://example.invalid/face/${rpid % 20}.jpg`,
    },
    message,
    emotes: opts.emotes ?? {},
    like: opts.like ?? (rpid * 7) % 500,
    ctime: Math.floor(Date.now() / 1000) - hoursAgo * 3600,
    replyCount: opts.replyCount ?? opts.replies?.length ?? 0,
    replies: opts.replies ?? [],
  };
}

export const MOCK_VIDEO: VideoInfo = {
  bvid: "BV1xx411c7mD",
  aid: 170001,
  title: "【双语字幕】深入浅出：Electron 桌面应用从零到一",
  desc: "本视频用通俗易懂的方式讲解 Electron 主进程与渲染进程、IPC 通信、以及如何把网页应用打包成跨平台桌面软件。适合有一点前端基础的同学。\n\n章节：\n00:00 开场\n02:15 项目结构\n08:40 IPC 与安全\n15:20 打包发布\n\n封面图仅供演示，内容为客户端开发脚手架示例。",
  pic: "https://example.invalid/cover/BV1xx411c7mD.jpg",
  pubdate: 1719800000,
  duration: 1265,
  owner: {
    mid: 208259,
    name: "码农小明",
    face: "https://example.invalid/face/owner.jpg",
  },
  stat: {
    view: 1_284_532,
    danmaku: 8_421,
    reply: 3_156,
    like: 96_420,
    coin: 12_340,
    favorite: 45_678,
    share: 3_210,
  },
  cid: 280001,
  pages: [
    {
      cid: 280001,
      page: 1,
      part: "正片",
      duration: 1265,
      dimension: { width: 1920, height: 1080, rotate: 0 },
    },
  ],
};

function dashTrack(
  id: number,
  quality: { width: number; height: number; bandwidth: number; codecs: string },
): PlayUrlResult["dash"]["video"][number] {
  return {
    id,
    baseUrl: `https://example.invalid/video/${id}.m4s`,
    backupUrl: [`https://example.invalid/backup/video/${id}.m4s`],
    bandwidth: quality.bandwidth,
    mimeType: "video/mp4",
    codecs: quality.codecs,
    codecid: 7,
    segmentBase: {
      initialization: "0-989",
      indexRange: "990-1455",
    },
    width: quality.width,
    height: quality.height,
    frameRate: "30.000",
  };
}

export const MOCK_PLAY_URL: PlayUrlResult = {
  acceptQuality: [80, 64, 32],
  acceptDescription: ["高清 1080P", "高清 720P", "清晰 480P"],
  dash: {
    duration: 1265,
    minBufferTime: 1.5,
    video: [
      dashTrack(80, {
        width: 1920,
        height: 1080,
        bandwidth: 2_800_000,
        codecs: "avc1.640028",
      }),
      dashTrack(64, {
        width: 1280,
        height: 720,
        bandwidth: 1_500_000,
        codecs: "avc1.64001F",
      }),
      dashTrack(32, {
        width: 852,
        height: 480,
        bandwidth: 800_000,
        codecs: "avc1.64001E",
      }),
    ],
    audio: [
      {
        id: 30280,
        baseUrl: "https://example.invalid/audio/30280.m4s",
        backupUrl: ["https://example.invalid/backup/audio/30280.m4s"],
        bandwidth: 128000,
        mimeType: "audio/mp4",
        codecs: "mp4a.40.2",
        codecid: 0,
        segmentBase: {
          initialization: "0-907",
          indexRange: "908-1283",
        },
      },
    ],
  },
};

export const MOCK_MPD_XML = `<?xml version="1.0" encoding="UTF-8"?>
<MPD xmlns="urn:mpeg:dash:schema:mpd:2011" type="static" mediaPresentationDuration="PT1265S" minBufferTime="PT1.5S" profiles="urn:mpeg:dash:profile:isoff-on-demand:2011">
  <Period>
    <AdaptationSet mimeType="video/mp4" contentType="video">
      <Representation id="80" bandwidth="2800000" width="1920" height="1080" codecs="avc1.640028">
        <BaseURL>https://example.invalid/video/80.m4s</BaseURL>
      </Representation>
      <Representation id="64" bandwidth="1500000" width="1280" height="720" codecs="avc1.64001F">
        <BaseURL>https://example.invalid/video/64.m4s</BaseURL>
      </Representation>
      <Representation id="32" bandwidth="800000" width="852" height="480" codecs="avc1.64001E">
        <BaseURL>https://example.invalid/video/32.m4s</BaseURL>
      </Representation>
    </AdaptationSet>
    <AdaptationSet mimeType="audio/mp4" contentType="audio">
      <Representation id="30280" bandwidth="128000" codecs="mp4a.40.2">
        <BaseURL>https://example.invalid/audio/30280.m4s</BaseURL>
      </Representation>
    </AdaptationSet>
  </Period>
</MPD>`;

const PAGE1_ITEMS: CommentItem[] = [
  comment(9001, "夜航星河", "讲得太清楚了，主进程和渲染进程终于分明白了 [doge]", {
    like: 842,
    replyCount: 3,
    emotes: { "[doge]": DOGE },
    hoursAgo: 2,
    replies: [
      comment(90011, "码农小明", "谢谢支持～后面会再出 IPC 专题", {
        like: 56,
        hoursAgo: 1,
      }),
      comment(90012, "路过的前端", "蹲一个打包篇", { like: 12, hoursAgo: 1 }),
    ],
  }),
  comment(9002, "青柠汽水", "封面党进来的，内容居然这么干货，收藏了", {
    like: 521,
    hoursAgo: 3,
  }),
  comment(9003, "键盘敲敲敲", "有没有同学也卡在 contextBridge 上？我调试了一下午 [tv_小电视]", {
    like: 388,
    replyCount: 2,
    emotes: { "[tv_小电视]": TV_XIAOKU },
    hoursAgo: 4,
    replies: [
      comment(90031, "调试狂人", "preload 路径配错了就会整页空白，检查一下", {
        like: 44,
        hoursAgo: 3,
      }),
    ],
  }),
  comment(9004, "南城旧梦", "双语字幕太贴心了，边看边记笔记", { like: 276, hoursAgo: 5 }),
  comment(9005, "Bug猎手", "希望能讲一下 session.webRequest 注入 Referer 的坑", {
    like: 198,
    hoursAgo: 6,
  }),
  comment(9006, "抹茶拿铁", "Electron + Vite 这一套比 webpack 时代舒服多了", {
    like: 165,
    hoursAgo: 7,
  }),
  comment(9007, "深夜代码", "UP 主语速刚好，比两倍速还舒服 [doge]", {
    like: 143,
    emotes: { "[doge]": DOGE },
    hoursAgo: 8,
  }),
  comment(9008, "云端漫步", "请问支持 macOS 和 Windows 一份代码吗？", {
    like: 121,
    replyCount: 1,
    hoursAgo: 9,
    replies: [
      comment(90081, "码农小明", "支持，打包配置里分平台即可", { like: 30, hoursAgo: 8 }),
    ],
  }),
  comment(9009, "像素诗人", "描述里的章节时间线很有用，跳着看效率高", { like: 98, hoursAgo: 10 }),
  comment(9010, "茶歇一刻", "第一次知道渲染进程不能直接打 bilibili API，学到了", {
    like: 87,
    hoursAgo: 11,
  }),
  comment(9011, "北方有佳人", "评论区翻译功能如果做成插件就好了哈哈", { like: 76, hoursAgo: 12 }),
  comment(9012, "海盐面包", "示例里的假 URL 看出来了，不过结构很完整", { like: 65, hoursAgo: 13 }),
  comment(9013, "梧桐雨巷", "求源码仓库地址！想跟着敲一遍", { like: 54, hoursAgo: 14 }),
  comment(9014, "星尘旅人", "IPC 那一段画图讲解太友好了", { like: 43, hoursAgo: 15 }),
  comment(9015, "柠檬气泡", "三连支持，期待下一期讲登录与 cookies", { like: 32, hoursAgo: 16 }),
];

const PAGE2_ITEMS: CommentItem[] = [
  comment(9016, "旧书店", "看完去改了我自己的桌面壳，顺利跑起来了", { like: 210, hoursAgo: 18 }),
  comment(9017, "风铃草", "TypeScript 严格模式那段劝退了好多人吧 [doge]", {
    like: 188,
    emotes: { "[doge]": DOGE },
    hoursAgo: 19,
  }),
  comment(9018, "白糖糕", "有没有推荐的 OpenAI 兼容翻译模型？", {
    like: 156,
    replyCount: 1,
    hoursAgo: 20,
    replies: [
      comment(90181, "翻译控", "本地 Ollama 也能接，改 baseURL 就行", { like: 22, hoursAgo: 19 }),
    ],
  }),
  comment(9019, "竹影清风", "高清 1080P 切换质量菜单在播放器里，这个设计合理", {
    like: 134,
    hoursAgo: 21,
  }),
  comment(9020, "小笼包", "评论分页游标讲清楚了，以前总搞错字段名", { like: 112, hoursAgo: 22 }),
  comment(9021, "月下独酌", "希望补充一下多 P 视频怎么切 cid", { like: 99, hoursAgo: 24 }),
  comment(9022, "咖啡续命", "暗色主题 UI 也好看，键盘操作友好", { like: 88, hoursAgo: 26 }),
  comment(9023, "纸飞机", "示例评论里的表情替换逻辑可以复用到别的项目", {
    like: 77,
    hoursAgo: 28,
  }),
  comment(9024, "南山雪", "终于理解为什么要 same-origin iframe 了", { like: 66, hoursAgo: 30 }),
  comment(9025, "琥珀糖", "FastStream 那块先放占位也行，集成再换真播放器", {
    like: 55,
    hoursAgo: 32,
  }),
  comment(9026, "青石板", "settings.json 持久化很朴素，够用", { like: 44, hoursAgo: 34 }),
  comment(9027, "雨打芭蕉", "有没有计划做弹幕？先不做也合理", { like: 33, hoursAgo: 36 }),
  comment(9028, "长风破浪", "mock 延迟模拟得很真实，加载状态可以测", { like: 28, hoursAgo: 38 }),
  comment(9029, "一叶知秋", "继续更新啊 UP，关注了", { like: 21, hoursAgo: 40 }),
  comment(9030, "银河旅社", "第二页也刷完了，内容扎实，感谢分享 [tv_小电视]", {
    like: 15,
    emotes: { "[tv_小电视]": TV_XIAOKU },
    hoursAgo: 42,
  }),
];

export const MOCK_HOTS: CommentItem[] = [
  comment(8001, "热评酱", "置顶：本评论区为演示数据，真实接口接入后替换 [doge]", {
    like: 9999,
    emotes: { "[doge]": DOGE },
    hoursAgo: 1,
  }),
];

export function getCommentPage(offset: string | null): CommentPage {
  if (offset === null || offset === "") {
    return {
      items: PAGE1_ITEMS,
      hots: MOCK_HOTS,
      nextOffset: "page2",
      isEnd: false,
      allCount: PAGE1_ITEMS.length + PAGE2_ITEMS.length,
    };
  }
  if (offset === "page2") {
    return {
      items: PAGE2_ITEMS,
      nextOffset: null,
      isEnd: true,
      allCount: PAGE1_ITEMS.length + PAGE2_ITEMS.length,
    };
  }
  return {
    items: [],
    nextOffset: null,
    isEnd: true,
    allCount: PAGE1_ITEMS.length + PAGE2_ITEMS.length,
  };
}

export function getReplyPage(root: number, pn: number): CommentPage {
  const all = [...PAGE1_ITEMS, ...PAGE2_ITEMS];
  const parent = all.find((c) => c.rpid === root);
  const replies = parent?.replies ?? [];
  if (pn > 1 || replies.length === 0) {
    return {
      items: [],
      nextOffset: null,
      isEnd: true,
      allCount: replies.length,
    };
  }
  return {
    items: replies,
    nextOffset: null,
    isEnd: true,
    allCount: replies.length,
  };
}

export const DEFAULT_SETTINGS: TranslatorSettings = {
  provider: "google",
  targetLang: "en",
};
