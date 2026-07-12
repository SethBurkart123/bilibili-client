import { createHash } from "node:crypto";

const MIXIN_KEY_ENC_TAB = [
  46, 47, 18, 2, 53, 8, 23, 32, 15, 50, 10, 31, 58, 3, 45, 35, 27, 43, 5,
  49, 33, 9, 42, 19, 29, 28, 14, 39, 12, 38, 41, 13, 37, 48, 7, 16, 24, 55,
  40, 61, 26, 17, 0, 1, 60, 51, 30, 4, 22, 25, 54, 21, 56, 59, 6, 63, 57,
  62, 11, 36, 20, 34, 44, 52,
] as const;

export type WbiParams = Record<string, string | number | boolean>;

function encode(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (character) =>
    `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

export function encWbi(params: WbiParams, imgKey: string, subKey: string): WbiParams {
  const mixinKey = MIXIN_KEY_ENC_TAB.map((index) => `${imgKey}${subKey}`[index])
    .join("")
    .slice(0, 32);
  const wts = Math.floor(Date.now() / 1000);
  const signedParams = { ...params, wts };
  const query = Object.entries(signedParams)
    .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
    .map(([key, value]) => `${encode(key)}=${encode(String(value).replace(/[!'()*]/g, ""))}`)
    .join("&");
  const wRid = createHash("md5").update(`${query}${mixinKey}`).digest("hex");

  return { ...params, wts, w_rid: wRid };
}
