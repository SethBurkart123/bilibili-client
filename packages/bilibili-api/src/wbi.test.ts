import { createHash } from "node:crypto";
import { afterEach, expect, test } from "bun:test";
import { encWbi } from "./wbi.js";

const originalNow = Date.now;
afterEach(() => {
  Date.now = originalNow;
});

test("encWbi creates the documented sorted and filtered WBI signature", () => {
  Date.now = () => 1_700_000_000_000;
  const imgKey = "abcdefghijklmnopqrstuvwxyz123456";
  const subKey = "ABCDEFGHIJKLMNOPQRSTUVWXYZ654321";
  const mixinKey = "OPscVixApSk66dND2LfRBjKt43oHmGJn";
  const query = "a=space%20value&b=hello&wts=1700000000&z=1";
  const expectedRid = createHash("md5").update(`${query}${mixinKey}`).digest("hex");

  expect(encWbi({ z: 1, b: "he!l'lo()*", a: "space value" }, imgKey, subKey)).toEqual({
    z: 1,
    b: "he!l'lo()*",
    a: "space value",
    wts: 1_700_000_000,
    w_rid: expectedRid,
  });
});
