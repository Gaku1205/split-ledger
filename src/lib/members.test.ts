import { describe, expect, it } from "vitest";
import {
  MEMBER_LIMIT_TEXT,
  NAME_DUPLICATE_ERROR,
  NAME_EMPTY_ERROR,
  colorNumber,
  initialOf,
  isMemberInExpenses,
  memberInUseMessage,
  removeMember,
  renameMember,
  validateGroupName,
  validateMemberName,
  validateMemberRename,
} from "./members";
import type { Expense, Member } from "./types";

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

describe("validateMemberRename", () => {
  it("前後の空白を取った名前を返す", () => {
    expect(validateMemberRename(" 鈴木 ", two, "a")).toEqual({ ok: true, name: "鈴木", changed: true });
  });
  it("空の名前はエラー", () => {
    expect(validateMemberRename("  ", two, "a")).toEqual({ ok: false, error: NAME_EMPTY_ERROR });
  });
  it("ほかのメンバーと同じ名前はエラー", () => {
    expect(validateMemberRename("田中 ", two, "a")).toEqual({ ok: false, error: NAME_DUPLICATE_ERROR });
  });
  it("自分の今の名前のままなら変更なし", () => {
    expect(validateMemberRename(" 佐藤", two, "a")).toEqual({ ok: true, name: "佐藤", changed: false });
  });
  it("6人いても名前は変えられる", () => {
    const six: Member[] = ["a", "b", "c", "d", "e", "f"].map((id) => ({ id, name: id }));
    expect(validateMemberRename("z", six, "a")).toEqual({ ok: true, name: "z", changed: true });
  });
});

describe("renameMember", () => {
  it("名前だけ変え、id と並びは変えない", () => {
    expect(renameMember(two, "b", "鈴木")).toEqual([
      { id: "a", name: "佐藤" },
      { id: "b", name: "鈴木" },
    ]);
  });
  it("元の配列は変えない", () => {
    renameMember(two, "b", "鈴木");
    expect(two[1].name).toBe("田中");
  });
  it("いないメンバーは null", () => {
    expect(renameMember(two, "x", "鈴木")).toBeNull();
  });
});

describe("removeMember", () => {
  it("そのメンバーを外し、残りの並びは保つ", () => {
    expect(removeMember(two, "a")).toEqual([{ id: "b", name: "田中" }]);
  });
  it("いないメンバーは null", () => {
    expect(removeMember(two, "x")).toBeNull();
  });
});

const expense = (paidBy: string, sharedBy: string[]): Expense => ({
  id: "e",
  amount: 100,
  memo: "",
  paidBy,
  sharedBy,
  date: "2026-10-28",
  createdAt: 0,
});

describe("isMemberInExpenses", () => {
  it("払った人なら true", () => {
    expect(isMemberInExpenses([expense("a", ["b"])], "a")).toBe(true);
  });
  it("誰の分に入っていれば true", () => {
    expect(isMemberInExpenses([expense("a", ["b"])], "b")).toBe(true);
  });
  it("どこにも出てこなければ false", () => {
    expect(isMemberInExpenses([expense("a", ["a"])], "b")).toBe(false);
    expect(isMemberInExpenses([], "a")).toBe(false);
  });
});

describe("memberInUseMessage", () => {
  it("理由の文", () => {
    expect(memberInUseMessage("佐藤")).toBe("佐藤さんは立て替えの記録に出てくるので削除できません。");
  });
});

describe("validateGroupName", () => {
  it("前後の空白を取る", () => {
    expect(validateGroupName(" 301号室 ", "みんなの精算")).toEqual({ ok: true, name: "301号室", changed: true });
  });
  it("空はエラー", () => {
    expect(validateGroupName("  ", "みんなの精算")).toEqual({ ok: false, error: NAME_EMPTY_ERROR });
  });
  it("今と同じ名前は変更なし（エラーにしない）", () => {
    expect(validateGroupName("みんなの精算 ", "みんなの精算")).toEqual({
      ok: true,
      name: "みんなの精算",
      changed: false,
    });
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
