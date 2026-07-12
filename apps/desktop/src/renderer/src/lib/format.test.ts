import { describe, expect, it } from "bun:test";
import { formatCount, parseCjkCount } from "./format";

describe("formatCount", () => {
  it("returns raw values under 1000", () => {
    expect(formatCount(812)).toBe("812");
    expect(formatCount(0)).toBe("0");
  });

  it("uses one decimal for K under 100K", () => {
    expect(formatCount(70_900)).toBe("70.9K");
  });

  it("rounds K at or above 100K", () => {
    expect(formatCount(709_000)).toBe("709K");
  });

  it("formats millions and billions", () => {
    expect(formatCount(3_400_000)).toBe("3.4M");
    expect(formatCount(1_200_000_000)).toBe("1.2B");
  });
});

describe("parseCjkCount", () => {
  it("parses 万 and 亿 suffixes", () => {
    expect(parseCjkCount("70.9万")).toBe(709_000);
    expect(parseCjkCount("3.4亿")).toBe(340_000_000);
  });

  it("handles numbers and plain digit strings", () => {
    expect(parseCjkCount(812)).toBe(812);
    expect(parseCjkCount("812")).toBe(812);
  });

  it("returns 0 for invalid input", () => {
    expect(parseCjkCount("")).toBe(0);
    expect(parseCjkCount("abc")).toBe(0);
    expect(parseCjkCount(Number.NaN)).toBe(0);
  });
});
