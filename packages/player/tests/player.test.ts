import { beforeAll, describe, expect, test } from "bun:test";
import type { DashInfo } from "@bili/types";
import { buildMpd, mpdToDataUri } from "../src/mpd";
import { feedPlayer, ACCELERATED_DASH } from "../src/feed";

beforeAll(() => {
  Object.defineProperty(globalThis, "location", {
    value: { origin: "http://localhost:4321" },
    configurable: true,
  });
});

/** Realistic bilibili-like DashInfo; BaseURLs include `&` to prove XML escaping. */
const fixture: DashInfo = {
  duration: 142.5,
  minBufferTime: 1.5,
  video: [
    {
      id: 30080,
      baseUrl:
        "https://xy.mcdn.bilivideo.cn:8082/v1/resource/video.m4s?deadline=1710000000&token=abc%3D%3D&nbs=1",
      backupUrl: [
        "https://backup.bilivideo.com/video.m4s?deadline=1710000000&token=abc",
      ],
      bandwidth: 2_400_000,
      mimeType: "video/mp4",
      codecs: "avc1.640032",
      codecid: 7,
      width: 1920,
      height: 1080,
      frameRate: "30",
      segmentBase: {
        initialization: "0-981",
        indexRange: "982-1455",
      },
    },
    {
      id: 30064,
      baseUrl:
        "https://xy.mcdn.bilivideo.cn:8082/v1/resource/video_720.m4s?bw=1200&platform=pc",
      backupUrl: [],
      bandwidth: 1_200_000,
      mimeType: "video/mp4",
      codecs: "avc1.640028",
      codecid: 7,
      width: 1280,
      height: 720,
      frameRate: "30",
      segmentBase: {
        initialization: "0-900",
        indexRange: "901-1300",
      },
    },
  ],
  audio: [
    {
      id: 30280,
      baseUrl:
        "https://xy.mcdn.bilivideo.cn:8082/v1/resource/audio.m4s?fnval=4048&qn=0&agrr=1",
      backupUrl: [],
      bandwidth: 192_000,
      mimeType: "audio/mp4",
      codecs: "mp4a.40.2",
      codecid: 0,
      segmentBase: {
        initialization: "0-743",
        indexRange: "744-1091",
      },
    },
  ],
};

/** DOMParser-free well-formedness: balanced tags + no raw `&` outside entities. */
function assertWellFormedXml(xml: string): void {
  const withoutDecl = xml.replace(/^<\?xml[^?]*\?>/, "");
  // Strip comments if any
  const body = withoutDecl.replace(/<!--[\s\S]*?-->/g, "");

  // No raw ampersands outside entities
  const rawAmp = body.replace(/&(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);/g, "");
  expect(rawAmp.includes("&")).toBe(false);

  const tagRe = /<\/?([A-Za-z][\w:.-]*)\b[^>]*?\/?>/g;
  const stack: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(body)) !== null) {
    const full = m[0];
    const name = m[1]!;
    if (full.endsWith("/>") || full.startsWith("<?")) continue;
    if (full.startsWith("</")) {
      const open = stack.pop();
      expect(open).toBe(name);
    } else {
      stack.push(name);
    }
  }
  expect(stack).toEqual([]);
}

describe("buildMpd", () => {
  test("emits static MPD with video/audio AdaptationSets and escaped URLs", () => {
    const mpd = buildMpd(fixture);

    expect(mpd.startsWith('<?xml version="1.0" encoding="utf-8"?>')).toBe(true);
    expect(mpd).toContain('type="static"');
    expect(mpd).toContain('mediaPresentationDuration="PT142.5S"');
    expect(mpd).toContain('minBufferTime="PT1.5S"');
    expect(mpd).toContain('profiles="urn:mpeg:dash:profile:isoff-main:2011"');

    const adaptationSets = mpd.match(/<AdaptationSet>/g);
    expect(adaptationSets?.length).toBe(2);

    const representations = mpd.match(/<Representation\b/g);
    expect(representations?.length).toBe(3);

    expect(mpd).toMatch(/id="30080"/);
    expect(mpd).toMatch(/codecs="avc1\.640032"/);
    expect(mpd).toMatch(/bandwidth="2400000"/);
    expect(mpd).toMatch(/width="1920"/);
    expect(mpd).toMatch(/height="1080"/);
    expect(mpd).toMatch(/frameRate="30"/);
    expect(mpd).toMatch(/mimeType="video\/mp4"/);

    expect(mpd).toMatch(/id="30280"/);
    expect(mpd).toMatch(/mimeType="audio\/mp4"/);
    const audioRep = mpd.match(
      /<Representation id="30280"[^>]*>/,
    )?.[0];
    expect(audioRep).toBeDefined();
    expect(audioRep).not.toMatch(/\b(width|height|frameRate)=/);

    expect(mpd).toContain("&amp;");
    expect(mpd).toContain(
      "https://xy.mcdn.bilivideo.cn:8082/v1/resource/video.m4s?deadline=1710000000&amp;token=abc%3D%3D&amp;nbs=1",
    );
    expect(mpd).not.toContain(
      "video.m4s?deadline=1710000000&token=",
    );

    expect(mpd).toMatch(
      /<SegmentBase indexRange="982-1455"><Initialization range="0-981"\/>/,
    );
    expect(mpd).toMatch(
      /<SegmentBase indexRange="744-1091"><Initialization range="0-743"\/>/,
    );

    assertWellFormedXml(mpd);
  });
});

describe("mpdToDataUri", () => {
  test("round-trips base64 payload", () => {
    const mpd = buildMpd(fixture);
    const uri = mpdToDataUri(mpd);
    expect(uri.startsWith("data:application/dash+xml;base64,")).toBe(true);
    const b64 = uri.slice("data:application/dash+xml;base64,".length);
    expect(Buffer.from(b64, "base64").toString("utf8")).toBe(mpd);
  });
});

describe("feedPlayer", () => {
  test("posts the exact recieveSources payload", () => {
    const posted: unknown[] = [];
    const fakeIframe = {
      contentWindow: {
        postMessage(data: unknown, targetOrigin: string) {
          posted.push({ data, targetOrigin });
        },
      },
    } as unknown as HTMLIFrameElement;

    const mpd = "<MPD/>";
    const origin = globalThis.location.origin;

    feedPlayer(fakeIframe, mpd, { headers: { referer: "https://www.bilibili.com" } });

    expect(posted).toHaveLength(1);
    const msg = posted[0] as {
      data: {
        type: string;
        sources: Array<{ url: string; mode: string; headers: Record<string, string> }>;
        autoSetSource: boolean;
        subtitles: unknown[];
      };
      targetOrigin: string;
    };

    expect(msg.targetOrigin).toBe(origin);
    expect(msg.data.type).toBe("sources");
    expect(msg.data.autoSetSource).toBe(true);
    expect(msg.data.subtitles).toEqual([]);
    expect(msg.data.sources).toHaveLength(1);
    expect(msg.data.sources[0]!.mode).toBe(ACCELERATED_DASH);
    expect(msg.data.sources[0]!.mode).toBe("accelerated_dash");
    expect(msg.data.sources[0]!.headers).toEqual({
      referer: "https://www.bilibili.com",
    });
    expect(msg.data.sources[0]!.url).toBe(mpdToDataUri(mpd));
  });

  test("defaults headers to {}", () => {
    const posted: unknown[] = [];
    const fakeIframe = {
      contentWindow: {
        postMessage(data: unknown) {
          posted.push(data);
        },
      },
    } as unknown as HTMLIFrameElement;

    feedPlayer(fakeIframe, "<MPD/>");
    const data = posted[0] as {
      sources: Array<{ headers: Record<string, string> }>;
    };
    expect(data.sources[0]!.headers).toEqual({});
  });
});
