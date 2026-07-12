import type {
  CommentItem,
  CommentPage,
  DashTrack,
  PlayUrlResult,
  SubtitleLine,
  SubtitleTrackInfo,
  VideoInfo,
} from "@bili/types";

type JsonObject = Record<string, unknown>;

const object = (value: unknown): JsonObject =>
  value !== null && typeof value === "object" ? (value as JsonObject) : {};
const array = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const number = (value: unknown): number => (typeof value === "number" ? value : Number(value) || 0);
const string = (value: unknown): string => (typeof value === "string" ? value : "");

export function normalizeVideoInfo(data: unknown): VideoInfo {
  const source = object(data);
  const owner = object(source.owner);
  const stat = object(source.stat);
  return {
    bvid: string(source.bvid),
    aid: number(source.aid),
    title: string(source.title),
    desc: string(source.desc),
    pic: string(source.pic),
    pubdate: number(source.pubdate),
    duration: number(source.duration),
    owner: { mid: number(owner.mid), name: string(owner.name), face: string(owner.face) },
    stat: {
      view: number(stat.view),
      danmaku: number(stat.danmaku),
      reply: number(stat.reply),
      like: number(stat.like),
      coin: number(stat.coin),
      favorite: number(stat.favorite),
      share: number(stat.share),
    },
    cid: number(source.cid),
    pages: array(source.pages).map((page) => {
      const value = object(page);
      const dimension = object(value.dimension);
      return {
        cid: number(value.cid),
        page: number(value.page),
        part: string(value.part),
        duration: number(value.duration),
        ...(Object.keys(dimension).length > 0
          ? {
              dimension: {
                width: number(dimension.width),
                height: number(dimension.height),
                rotate: number(dimension.rotate),
              },
            }
          : {}),
      };
    }),
  };
}

function normalizeTrack(track: unknown): DashTrack {
  const source = object(track);
  const segmentBase = object(source.SegmentBase ?? source.segment_base);
  return {
    id: number(source.id),
    baseUrl: string(source.baseUrl ?? source.base_url),
    backupUrl: array(source.backupUrl ?? source.backup_url).map(string),
    bandwidth: number(source.bandwidth),
    mimeType: string(source.mimeType ?? source.mime_type),
    codecs: string(source.codecs),
    codecid: number(source.codecid),
    segmentBase: {
      initialization: string(segmentBase.initialization),
      indexRange: string(segmentBase.indexRange ?? segmentBase.index_range),
    },
    ...(source.width === undefined ? {} : { width: number(source.width) }),
    ...(source.height === undefined ? {} : { height: number(source.height) }),
    ...(source.frameRate === undefined && source.frame_rate === undefined
      ? {}
      : { frameRate: string(source.frameRate ?? source.frame_rate) }),
  };
}

export function normalizePlayUrl(data: unknown): PlayUrlResult {
  const source = object(data);
  const dash = object(source.dash);
  return {
    acceptQuality: array(source.accept_quality).map(number),
    acceptDescription: array(source.accept_description).map(string),
    dash: {
      duration: number(dash.duration),
      minBufferTime: number(dash.minBufferTime ?? dash.min_buffer_time),
      video: array(dash.video).map(normalizeTrack),
      audio: array(dash.audio).map(normalizeTrack),
    },
  };
}

export function normalizeComment(comment: unknown): CommentItem {
  const source = object(comment);
  const member = object(source.member);
  const content = object(source.content);
  const emote = object(content.emote);
  return {
    rpid: number(source.rpid),
    author: {
      mid: string(member.mid),
      uname: string(member.uname),
      avatar: string(member.avatar),
    },
    message: string(content.message),
    emotes: Object.fromEntries(
      Object.entries(emote).map(([token, value]) => {
        const item = object(value);
        return [token, { text: string(item.text), url: string(item.url) }];
      }),
    ),
    like: number(source.like),
    ctime: number(source.ctime),
    replyCount: number(source.rcount ?? source.count),
    replies: array(source.replies).map(normalizeComment),
  };
}

export function normalizeCommentPage(data: unknown): CommentPage {
  const source = object(data);
  const cursor = object(source.cursor);
  const pagination = object(cursor.pagination_reply);
  const hots = array(source.hots);
  return {
    items: array(source.replies).map(normalizeComment),
    ...(hots.length > 0 ? { hots: hots.map(normalizeComment) } : {}),
    nextOffset: cursor.is_end === true ? null : string(pagination.next_offset) || null,
    isEnd: cursor.is_end === true,
    allCount: number(cursor.all_count),
  };
}

export function normalizeReplyPage(data: unknown, pn: number): CommentPage {
  const source = object(data);
  const page = object(source.page);
  const count = number(page.count);
  const size = number(page.size);
  return {
    items: array(source.replies).map(normalizeComment),
    nextOffset: null,
    isEnd: size === 0 || pn * size >= count,
    allCount: count,
  };
}

export function normalizeSubtitles(data: unknown): SubtitleTrackInfo[] {
  const source = object(data);
  const subtitle = object(source.subtitle);
  return array(subtitle.subtitles).map((track) => {
    const value = object(track);
    const lan = string(value.lan);
    const url = string(value.subtitle_url);
    const type = value.type;
    const aiType = value.ai_type;
    return {
      lan,
      lanDoc: string(value.lan_doc),
      url: url.startsWith("//") ? `https:${url}` : url,
      aiGenerated: lan.startsWith("ai-") || type === 1 || type === true || aiType === 1 || aiType === true,
    };
  });
}

export function normalizeSubtitleLines(data: unknown): SubtitleLine[] {
  const source = object(data);
  return array(source.body).map((line) => {
    const value = object(line);
    const from = number(value.from);
    return {
      from,
      to: value.to === undefined || value.to === null ? from + 2 : number(value.to),
      content: string(value.content),
    };
  });
}
