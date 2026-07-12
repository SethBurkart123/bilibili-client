# MVP bilibili Client API Specification

This specification covers a read-only MVP: accept a video URL, resolve its
identifier, show metadata, play DASH streams, and show comments. It is derived
only from the repository documentation cited in each section. `code: 0` denotes
success in the JSON envelopes below.

## 1. Parse a video URL into `bvid` / `aid`

**Sources:** [`docs/misc/bvid_desc.md`](docs/misc/bvid_desc.md),
[`docs/misc/b23tv.md`](docs/misc/b23tv.md).

Recognize `BV1` followed by nine Base58 characters as a `bvid` (12 characters
total). The alphabet excludes `0`, `I`, `O`, and `l`. Recognize `av<decimal>`
as an `aid`. `bvid` and `aid` denote the same video and can be converted.

| Input form | MVP result |
| --- | --- |
| `https://www.bilibili.com/video/BV…` or embedded `BV…` | Extract `bvid`; pass it directly to APIs. |
| `https://www.bilibili.com/video/av…` or embedded `av…` | Extract decimal `aid`; pass it directly to APIs. |
| `https://b23.tv/BV…` | Extract the suffix as `bvid`. |
| `https://b23.tv/av…` | Extract decimal suffix as `aid`. |
| Seven-character `b23.tv/<token>` | It is an arbitrary, potentially time-limited short link; follow its HTTP redirect, then parse the resulting video URL. The docs do not specify a resolution API. |

If local conversion is needed, use the documented `BV → AV` algorithm:

```text
alphabet = "FcwAPNKTMug3GV5Lj7EJnHpWsx4tb8haYeviqBz6rkCy12mUSDQX9RdoZf"
swap bvid character indexes 3↔9 and 4↔7; remove the "BV1" prefix
tmp = fold(chars, (value, char) => value * 58 + alphabet.indexOf(char))
aid = (tmp & 2251799813685247) XOR 23442827791579
```

Use arbitrary-precision integers: the documented `aid` maximum is `2^51`.

## 2. Video information

**Source:** [`docs/video/info.md`](docs/video/info.md).

### `GET https://api.bilibili.com/x/web-interface/view`

The documentation also lists `https://api.bilibili.com/x/web-interface/wbi/view`.
For this MVP use the explicitly requested non-WBI `/view` endpoint. The document
states that some videos restricted to visitors require a `SESSDATA` cookie.

| Query parameter | Type | Required | Meaning |
| --- | --- | --- | --- |
| `aid` | number | one of `aid` / `bvid` | Video AV ID. |
| `bvid` | string | one of `aid` / `bvid` | Video BV ID. |

Key `data` fields:

| Field | Type | Meaning |
| --- | --- | --- |
| `aid`, `bvid` | number, string | Canonical AV/BV IDs. |
| `title`, `desc` | string | Title and description. |
| `owner.mid`, `owner.name`, `owner.face` | number, string, string | Uploader ID, display name, and avatar URL. |
| `stat` | object | Counters: `aid`, `view`, `danmaku`, `reply`, `favorite`, `coin`, `share`, `now_rank`, `his_rank`, `like`, `dislike`, `evaluation`, `vt`. |
| `cid` | number | CID of the first part. |
| `pages[]` | array | Per-part records; use its `cid` for playback. |

`pages[]` entries contain `cid`, 1-based `page`, `from`, `part`, `duration`
(seconds), `vid`, `weblink`, and optionally `dimension` (`width`, `height`,
`rotate`).

```jsonc
{
  "code": 0,
  "data": {
    "bvid": "BV1xxxxxxxxx",
    "aid": 123456,
    "title": "Example title",
    "desc": "Example description",
    "owner": { "mid": 42, "name": "Uploader", "face": "https://…" },
    "stat": { "view": 100, "reply": 8, "like": 12 },
    "cid": 987654,
    "pages": [{ "cid": 987654, "page": 1, "part": "P1", "duration": 120 }]
  }
}
```

## 3. DASH playback and selectable resolutions

**Source:** [`docs/video/videostream_url.md`](docs/video/videostream_url.md).

### `GET https://api.bilibili.com/x/player/wbi/playurl`

This is the documented current Web endpoint (the old `/x/player/playurl` is
struck out). It requires WBI signing and documents `SESSDATA` cookie
authentication. Stream URLs expire after 120 minutes. Request the selected
part's `cid`; a multi-part video requires a new request when the part changes.

| Query parameter | Type | Required | MVP use |
| --- | --- | --- | --- |
| `avid` | number | one of `avid` / `bvid` | AV ID (note the endpoint uses `avid`, not `aid`). |
| `bvid` | string | one of `avid` / `bvid` | BV ID. |
| `cid` | number | yes | Selected `pages[].cid`. |
| `qn` | number | no | Requested quality; in DASH it does **not** limit the returned set. |
| `fnval` | number | no | Stream-format bit flags; use `4048` to request all documented available DASH video options. |
| `fnver` | number | no | Documented fixed value: `0`. |
| `fourk` | number | no | `1` allows a 4K maximum; `0` (default) caps at 1080P. |
| `wts`, `w_rid` | number, string | yes | WBI timestamp and signature; see section 5. |

Relevant `fnval` values are `16` DASH, `64` HDR request, `128` 4K request,
`256` Dolby audio, `512` Dolby Vision, `1024` 8K, `2048` AV1; `4048` is the
documented all-available-DASH combination. `fourk=1` works with `fnval & 128`.

Quality IDs:

| `qn` | Label | Documented requirement / note |
| ---: | --- | --- |
| 6 | 240P Fast | MP4 only; only `platform=html5`. |
| 16 | 360P Smooth | |
| 32 | 480P Clear | |
| 64 | 720P HD | Web default; if absent, it is 720P60. |
| 74 | 720P60 High Frame Rate | Login required. |
| 80 | 1080P HD | Login required. |
| 100 | Intelligent Restoration | Premium required. |
| 112 | 1080P+ High Bitrate | Premium required. |
| 116 | 1080P60 High Frame Rate | Premium required. |
| 120 | 4K Ultra HD | `fnval & 128`, `fourk=1`, premium required. |
| 125 | HDR True Color | DASH only; `fnval & 64`; premium required. |
| 126 | Dolby Vision | DASH only; `fnval & 512`; premium required. |
| 127 | 8K Ultra HD | DASH only; `fnval & 1024`; premium required. |
| 129 | HDR Vivid | Premium required. |

Anonymous requests default to `qn=32`; logged-in requests default to `qn=64`.
The documentation says 720P and above require login, and high-frame-rate,
high-bitrate, HDR, and Dolby Vision require a premium account. Members-only
videos also require login. Do not promise qualities from the table: present only
the returned `accept_quality` / `accept_description` and actual DASH tracks.

### DASH response contract

`data.dash` has `duration` (seconds), `minBufferTime` / `min_buffer_time`,
`video[]`, `audio[]` (or `null`), optional `dolby`, and optional `flac`.
For each track in `dash.video[]` or `dash.audio[]` use:

| Field | Type | Meaning |
| --- | --- | --- |
| `id` | number | Video quality ID or audio quality ID. |
| `baseUrl` / `base_url` | string | Primary signed media URL. |
| `backupUrl` / `backup_url` | string[] | Fallback media URLs. |
| `bandwidth`, `mimeType` / `mime_type`, `codecs` | number, string, string | Selection and decoding metadata. |
| `width`, `height`, `frameRate` / `frame_rate` | number, number, string | Video-only display metadata. |
| `codecid` | number | Video codec: `7` AVC, `12` HEVC, `13` AV1; audio is `0`. |
| `SegmentBase` / `segment_base` | object | `initialization` and `index_range` byte ranges. |

Audio quality IDs are `30216` (64K), `30232` (132K), `30280` (192K), `30250`
(Dolby Atmos), and `30251` (Hi-Res lossless).

```jsonc
{
  "code": 0,
  "data": {
    "accept_quality": [80, 64, 32, 16],
    "accept_description": ["1080P", "720P", "480P", "360P"],
    "dash": {
      "duration": 120,
      "video": [{ "id": 80, "baseUrl": "https://…m4s", "codecs": "avc1…", "width": 1920, "height": 1080, "codecid": 7 }],
      "audio": [{ "id": 30280, "baseUrl": "https://…m4s", "codecs": "mp4a…", "codecid": 0 }]
    }
  }
}
```

### Request headers

For documented WBI API examples, send a non-empty browser `User-Agent` and
`Referer: https://www.bilibili.com/`; this is shown for obtaining WBI keys. For
Web (`platform=pc`) media URLs, the documentation explicitly requires a
`.bilibili.com` `Referer` and a non-empty `User-Agent` on every CDN segment
request. An incorrect/missing one is documented to produce `403 Forbidden`.
`platform=html5` is documented as MP4-only and exempt from that anti-hotlink
check, so it is not the DASH MVP path.

## 4. Comments

**Sources:** [`docs/comment/list.md`](docs/comment/list.md),
[`docs/comment/readme.md`](docs/comment/readme.md).

For a video comment area use `type=1` and `oid=<aid>`.

### `GET https://api.bilibili.com/x/v2/reply/wbi/main`

This is the lazy-loading main-comments endpoint. It requires WBI signing; a
bad WBI signature returns `-403` according to the document.

| Query parameter | Type | Required | Meaning |
| --- | --- | --- | --- |
| `type`, `oid` | number, number | yes | Comment-area type and target ID; video is `type=1`, `oid=aid`. |
| `mode` | number | no | Default `3`; `0`/`3` popularity only, `1` popularity + time, `2` time only. |
| `pagination_str` | object | no | Cursor wrapper; prefer it over deprecated `next`. |
| `next` | number | no | Deprecated pagination; takes priority over `pagination_str`. |
| `plat`, `seek_rpid`, `web_location` | number, string, string | no | Documented optional values (`plat=1`, empty `seek_rpid` on first page, `web_location=1315875`). |
| `wts`, `w_rid` | number, string | yes | WBI signature fields. |

For page 1, `pagination_str.offset` is empty. For subsequent pages, set it to
the preceding `data.cursor.pagination_reply.next_offset`. That value is a
string containing JSON. With `mode=2`, its JSON has `type: 3`, `direction: 1`,
and `Data.cursor: <previous data.cursor.next>`; with `mode=3`, use `type: 1`,
`direction: 1`, and `data.pn: <previous data.cursor.next>` (capitalization is
documented as significant).

Response: `data.cursor` exposes `all_count`, `is_begin`, `prev`, `next`,
`is_end`, `mode`, `support_mode`, `name`, and `pagination_reply.next_offset`.
Render `data.replies`; `data.hots` contains hot comments, and `top` may contain
admin/uploader/vote pins.

A comment record has `rpid`, `oid`, `type`, `mid`, `root`, `parent`, `dialog`,
`count`/`rcount`, `ctime`, string ID counterparts, and `like`. `member` carries
the author (`mid`, `uname`, `avatar`, plus profile/badge fields). `content`
contains `message`, `plat`, optional mentioned `members`, optional `emote`,
optional `jump_url`, and optional `pictures`. `content.emote` maps each emote
token to `{ id, package_id, type, text, url, meta, … }`; `meta.size` is 1 small
or 2 large and may include `alias`. `replies` is only a one-level preview; use
the endpoint below for the complete thread.

```jsonc
{
  "code": 0,
  "data": {
    "cursor": { "is_begin": true, "next": 71859, "is_end": false, "pagination_reply": { "next_offset": "{\"type\":3,\"direction\":1,\"Data\":{\"cursor\":71859}}" } },
    "replies": [{
      "rpid": 123, "like": 7, "count": 2,
      "member": { "mid": "42", "uname": "Commenter", "avatar": "https://…" },
      "content": { "message": "Hello [doge]", "emote": { "[doge]": { "id": 1, "text": "[doge]", "url": "https://…" } },
      "replies": [{ "rpid": 124, "content": { "message": "Preview reply" } }]
    }]
  }
}
```

### `GET https://api.bilibili.com/x/v2/reply/reply`

Fetch a root comment's replies in reply order.

| Query parameter | Type | Required | Meaning |
| --- | --- | --- | --- |
| `type`, `oid`, `root` | number | yes | `type=1`, video `aid`, and root comment `rpid`. |
| `ps`, `pn` | number | no | Default `ps=20`, `pn=1`; documented `ps` range 1–49, but at most 20 replies are returned. |

The document lists Cookie (`SESSDATA`) or APP authentication. `data` includes
`root`, `replies[]`, and `page { count, num, size }`; each reply uses the same
comment-record structure above.

## 5. WBI signing

**Source:** [`docs/misc/sign/wbi.md`](docs/misc/sign/wbi.md).

For this MVP, the documented WBI-required endpoints are:

- `GET /x/player/wbi/playurl` (DASH play URL).
- `GET /x/v2/reply/wbi/main` (lazy-loaded main comments).

The requested non-WBI video-info URL `/x/web-interface/view` does not have a
WBI requirement in its documentation. Obtain `img_url` and `sub_url` from the
nav endpoint response (`data.wbi_img`) or `img`/`sub` from the bili-ticket
endpoint. Take the filename without `.png` as `img_key` and `sub_key`; these
values are documented as changing daily and should be cached/refreshed. They
are token-like URLs, not images to fetch.

The full, verbatim 64-entry mixin index table is:

```text
46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5, 49,
33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55, 40,
61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57, 62, 11,
36, 20, 34, 44, 52
```

Algorithm:

1. Concatenate `raw_wbi_key = img_key + sub_key`; select its characters in the
   index-table order and take the first 32 characters as `mixin_key`.
2. Copy the original request params, add current Unix seconds as `wts`, sort by
   parameter name ascending, and remove every `!`, `'`, `(`, `)`, and `*` from
   parameter values.
3. Percent-encode the sorted query with uppercase escapes and encode space as
   `%20` (not `+`).
4. `w_rid = md5(encoded_sorted_query + mixin_key)`. Append `w_rid` and `wts`
   to the original request parameters. The document says the final original
   parameter ordering need not be sorted.

## 6. Device identity and anti-abuse boundary

**Source:** [`docs/misc/buvid3_4.md`](docs/misc/buvid3_4.md).

### `GET https://api.bilibili.com/x/frontend/finger/spi`

The documented response has `data.b_3` (store as `buvid3`) and `data.b_4`
(store as `buvid4`); the document says they must be placed into cookies by the
client.

```jsonc
{ "code": 0, "data": { "b_3": "…", "b_4": "…" }, "message": "ok" }
```

This specification intentionally does not provide instructions for evading
`-412`, bypassing anti-crawl controls, or using cookies/headers to defeat risk
controls. Persist only cookies obtained through the documented endpoints and
handle a rejection as an application error or require normal user login.

## 7. QR login

**Source:** [`docs/login/login_action/QR.md`](docs/login/login_action/QR.md).

### Generate: `GET https://passport.bilibili.com/x/passport-login/web/qrcode/generate`

No query parameters are documented. The generated key expires in 180 seconds.
Render `data.url` as a QR code and retain `data.qrcode_key` (documented as 32
characters).

```jsonc
{ "code": 0, "data": { "url": "https://passport.bilibili.com/h5-app/passport/login/scan?…", "qrcode_key": "…" } }
```

### Poll: `GET https://passport.bilibili.com/x/passport-login/web/qrcode/poll`

| Query parameter | Type | Required | Meaning |
| --- | --- | --- | --- |
| `qrcode_key` | string | yes | Key returned by generate. |

The HTTP-envelope `code` is `0` for the documented poll states; inspect
`data.code` instead:

| `data.code` | Meaning | Client action |
| ---: | --- | --- |
| 86101 | Not scanned | Continue polling. |
| 86090 | Scanned, not confirmed | Continue polling and show waiting state. |
| 86038 | QR code expired | Stop; generate a new QR code. |
| 0 | Login succeeded | Persist response cookies; use `refresh_token` / `timestamp` as returned. |

On success persist the documented authentication cookies: `DedeUserID`,
`DedeUserID__ckMd5`, `SESSDATA`, and `bili_jct`. The captured success response
also sets `sid`; preserve it in the cookie jar as received.

```jsonc
{ "code": 0, "data": { "url": "", "refresh_token": "…", "timestamp": 1662363009601, "code": 0, "message": "" } }
```
