import { expect, test } from "bun:test";
import { normalizeCommentPage } from "./normalizers.js";

test("comment normalization maps authors, emotes, reply counts, and previews", () => {
  const page = normalizeCommentPage({
    cursor: { all_count: 2, is_end: false, pagination_reply: { next_offset: "{\"type\":1}" } },
    replies: [{
      rpid: 1,
      like: 2,
      ctime: 3,
      rcount: 4,
      member: { mid: "5", uname: "Alice", avatar: "https://avatar" },
      content: { message: "Hi [doge]", emote: { "[doge]": { text: "[doge]", url: "https://emote" } } },
      replies: [{ rpid: 6, member: { mid: "7", uname: "Bob", avatar: "" }, content: { message: "Hello" } }],
    }],
  });
  expect(page).toEqual({
    items: [{
      rpid: 1,
      author: { mid: "5", uname: "Alice", avatar: "https://avatar" },
      message: "Hi [doge]",
      emotes: { "[doge]": { text: "[doge]", url: "https://emote" } },
      like: 2,
      ctime: 3,
      replyCount: 4,
      replies: [{ rpid: 6, author: { mid: "7", uname: "Bob", avatar: "" }, message: "Hello", emotes: {}, like: 0, ctime: 0, replyCount: 0, replies: [] }],
    }],
    nextOffset: "{\"type\":1}",
    isEnd: false,
    allCount: 2,
  });
});
