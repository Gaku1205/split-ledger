import { describe, expect, it } from "vitest";
import { removeExpense, removedMessage, replaceExpense, restoreExpense } from "./expenses";
import type { Expense } from "./types";

function make(id: string, amount = 1000): Expense {
  return { id, amount, memo: id, paidBy: "a", sharedBy: ["a", "b"], date: "2026-10-01", createdAt: 1 };
}
const list = [make("e1"), make("e2"), make("e3")];
const fields = { amount: 500, memo: "新", paidBy: "b", sharedBy: ["b"], date: "2026-10-05" };

describe("replaceExpense", () => {
  it("中身を差し替え、id と記録した時刻は変えない", () => {
    const next = replaceExpense([{ ...list[0], createdAt: 77 }, list[1]], "e1", fields);
    expect(next).toEqual([{ ...fields, id: "e1", createdAt: 77 }, list[1]]);
  });
  it("位置は変えず、元の配列も変えない", () => {
    const next = replaceExpense(list, "e2", fields);
    expect(next?.map((e) => e.id)).toEqual(["e1", "e2", "e3"]);
    expect(list[1].amount).toBe(1000);
  });
  it("存在しない記録は null", () => {
    expect(replaceExpense(list, "zzz", fields)).toBeNull();
  });
});

describe("removeExpense", () => {
  it("記録と元の位置を返す", () => {
    const r = removeExpense(list, "e2");
    expect(r?.expenses.map((e) => e.id)).toEqual(["e1", "e3"]);
    expect(r?.removed).toEqual({ expense: list[1], index: 1 });
  });
  it("存在しない記録は null", () => {
    expect(removeExpense(list, "zzz")).toBeNull();
    expect(removeExpense([], "e1")).toBeNull();
  });
});

describe("restoreExpense", () => {
  it("消した記録を元の位置に戻す", () => {
    for (const id of ["e1", "e2", "e3"]) {
      const r = removeExpense(list, id);
      expect(r).not.toBeNull();
      if (r) expect(restoreExpense(r.expenses, r.removed)).toEqual(list);
    }
  });
  it("位置が長さを超えていれば末尾に入れる", () => {
    expect(restoreExpense([list[0]], { expense: list[2], index: 5 }).map((e) => e.id)).toEqual(["e1", "e3"]);
  });
  it("空の並びにも戻せる", () => {
    expect(restoreExpense([], { expense: list[0], index: 0 })).toEqual([list[0]]);
  });
  it("同じ id がすでにあれば二重に戻さない", () => {
    expect(restoreExpense(list, { expense: list[0], index: 0 })).toEqual(list);
  });
});

describe("removedMessage", () => {
  it("何にの名前を入れる", () => {
    expect(removedMessage("スーパー")).toBe("スーパーの記録を消しました");
  });
  it("何にが空なら名前なし", () => {
    expect(removedMessage("  ")).toBe("記録を消しました");
  });
});
