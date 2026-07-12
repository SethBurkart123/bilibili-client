import { beforeAll, describe, expect, test } from "bun:test";
import type { DashInfo, SubtitleLine } from "@bili/types";
import { buildMpd, mpdToDataUri } from "../src/mpd";
import { feedPlayer, ACCELERATED_DASH } from "../src/feed";
import { mergeDualLines, subtitleLinesToVtt } from "../src/subtitles";

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

  test("encodes non-ASCII without Node Buffer", () => {
    const mpd = '<?xml version="1.0"?><MPD title="测试 / café"/>';
    const uri = mpdToDataUri(mpd);
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

  test("maps two subtitle tracks to inline {label,language,data} wire shape", () => {
    const posted: unknown[] = [];
    const fakeIframe = {
      contentWindow: {
        postMessage(data: unknown) {
          posted.push(data);
        },
      },
    } as unknown as HTMLIFrameElement;

    const vttZh = subtitleLinesToVtt([
      { from: 0, to: 1, content: "你好" },
    ]);
    const vttEn = subtitleLinesToVtt([
      { from: 0, to: 1, content: "Hello" },
    ]);

    feedPlayer(fakeIframe, "<MPD/>", {
      subtitles: [
        { label: "Chinese", language: "zh-CN", vtt: vttZh },
        { label: "English", language: "en", vtt: vttEn },
      ],
    });

    const data = posted[0] as {
      type: string;
      autoSetSource: boolean;
      subtitles: Array<{ label: string; language: string; data: string }>;
    };

    // Wire shape from main.mjs recieveSources / loadSubtitles:
    // inline tracks use { label, language, data } (data = VTT text).
    expect(data.type).toBe("sources");
    expect(data.autoSetSource).toBe(true);
    expect(data.subtitles).toEqual([
      { label: "Chinese", language: "zh-CN", data: vttZh },
      { label: "English", language: "en", data: vttEn },
    ]);
    for (const sub of data.subtitles) {
      expect(sub).not.toHaveProperty("source");
      expect(sub).not.toHaveProperty("vtt");
      expect(sub.data.startsWith("WEBVTT")).toBe(true);
    }
  });
});

describe("subtitleLinesToVtt", () => {
  test("formats >1h timestamps as HH:MM:SS.mmm", () => {
    const vtt = subtitleLinesToVtt([
      { from: 3661.5, to: 3663.25, content: "over an hour" },
    ]);
    expect(vtt).toContain("01:01:01.500 --> 01:01:03.250");
    expect(vtt.startsWith("WEBVTT")).toBe(true);
  });

  test("escapes &, <, > in cue text", () => {
    const vtt = subtitleLinesToVtt([
      { from: 0, to: 1, content: "A & B <C> >D" },
    ]);
    expect(vtt).toContain("A &amp; B &lt;C&gt; &gt;D");
    const cueText = vtt.split("\n").find((l) => l.includes("&amp;"))!;
    expect(cueText.includes("<")).toBe(false);
    expect(cueText.includes(">")).toBe(false);
    expect(cueText.replace(/&(?:amp|lt|gt);/g, "").includes("&")).toBe(false);
  });

  test("clamps zero/negative duration to +0.5s", () => {
    const zero = subtitleLinesToVtt([{ from: 10, to: 10, content: "z" }]);
    expect(zero).toContain("00:00:10.000 --> 00:00:10.500");

    const neg = subtitleLinesToVtt([{ from: 5, to: 3, content: "n" }]);
    expect(neg).toContain("00:00:05.000 --> 00:00:05.500");
  });

  test("sorts cues by start time", () => {
    const vtt = subtitleLinesToVtt([
      { from: 2, to: 3, content: "second" },
      { from: 0.5, to: 1, content: "first" },
      { from: 4, to: 5, content: "third" },
    ]);
    const firstIdx = vtt.indexOf("first");
    const secondIdx = vtt.indexOf("second");
    const thirdIdx = vtt.indexOf("third");
    expect(firstIdx).toBeLessThan(secondIdx);
    expect(secondIdx).toBeLessThan(thirdIdx);
  });

  test("optional label becomes WEBVTT file description", () => {
    const vtt = subtitleLinesToVtt([{ from: 0, to: 1, content: "x" }], {
      label: "Chinese",
    });
    expect(vtt.startsWith("WEBVTT Chinese\n")).toBe(true);
  });
});

describe("mergeDualLines", () => {
  test("places translated text above original", () => {
    const original: SubtitleLine[] = [
      { from: 0, to: 1, content: "你好" },
      { from: 1, to: 2, content: "世界" },
    ];
    const merged = mergeDualLines(original, ["Hello", "World"]);
    expect(merged).toEqual([
      { from: 0, to: 1, content: "Hello\n你好" },
      { from: 1, to: 2, content: "World\n世界" },
    ]);
  });

  test("throws RangeError on length mismatch", () => {
    expect(() =>
      mergeDualLines([{ from: 0, to: 1, content: "a" }], ["x", "y"]),
    ).toThrow(RangeError);
  });
});
