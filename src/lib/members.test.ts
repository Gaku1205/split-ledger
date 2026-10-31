import { describe, expect, it } from "vitest";
import {
  MEMBER_LIMIT_TEXT,
  NAME_DUPLICATE_ERROR,
  NAME_EMPTY_ERROR,
  colorNumber,
  initialOf,
  validateMemberName,
} from "./members";
import type { Member } from "./types";

const two: Member[] = [
  { id: "a", name: "佐藤" },
  { id: "b", name: "田中" },
];

describe("validateMemberName", () => {
  it("前後の空白を取った名前を返す", () => {
    expect(validateMemberName("  鈴木 ", two)).toEqual({ ok: true, name: "鈴木" });
  });
  it("空の名前は足せない", () => {
    expect(validateMemberName("   ", two)).toEqual({ ok: false, error: NAME_EMPTY_ERROR });
  });
  it("同じ名前は足せない", () => {
    expect(validateMemberName(" 佐藤", two)).toEqual({ ok: false, error: NAME_DUPLICATE_ERROR });
  });
  it("6人いたら足せない", () => {
    const six: Member[] = ["a", "b", "c", "d", "e", "f"].map((id) => ({ id, name: id }));
    expect(validateMemberName("g", six)).toEqual({ ok: false, error: MEMBER_LIMIT_TEXT });
  });
});

describe("colorNumber", () => {
  it("足した順に1〜6、7人目から1に戻る", () => {
    expect([0, 1, 2, 3, 4, 5, 6, 7].map(colorNumber)).toEqual([1, 2, 3, 4, 5, 6, 1, 2]);
  });
});

describe("initialOf", () => {
  it("名前の最初の1文字", () => {
    expect(initialOf("佐藤")).toBe("佐");
    expect(initialOf(" Ken")).toBe("K");
    expect(initialOf("")).toBe("");
  });
});
