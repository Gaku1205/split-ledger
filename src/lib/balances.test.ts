import { describe, expect, it } from "vitest";
import { computeBalances } from "./balances";
import type { Balance, Expense, Member } from "./types";

const members: Member[] = [
  { id: "a", name: "佐藤" },
  { id: "b", name: "田中" },
  { id: "c", name: "鈴木" },
];

function exp(amount: number, paidBy: string, sharedBy: string[]): Expense {
  return { id: `${amount}${paidBy}`, amount, memo: "", paidBy, sharedBy, date: "2026-10-28", createdAt: 0 };
}

const sum = (xs: Balance[]) => xs.reduce((s, x) => s + x.balance, 0);

describe("computeBalances", () => {
  it("記録が無ければ全員0円", () => {
    expect(computeBalances(members, [])).toEqual([
      { memberId: "a", balance: 0 },
      { memberId: "b", balance: 0 },
      { memberId: "c", balance: 0 },
    ]);
  });
  it("払った人は受け取る、分け前の人は返す", () => {
    const r = computeBalances(members, [exp(3000, "a", ["a", "b", "c"])]);
    expect(r.map((x) => x.balance)).toEqual([2000, -1000, -1000]);
    expect(sum(r)).toBe(0);
  });
  it("端数が出ても合計は0", () => {
    const r = computeBalances(members, [exp(1000, "b", ["a", "b", "c"]), exp(101, "c", ["a", "b"])]);
    // 1000円 → a 334・b 333・c 333、101円 → a 51・b 50
    expect(r.map((x) => x.balance)).toEqual([-385, 617, -232]);
    expect(sum(r)).toBe(0);
  });
  it("払った人が分け前に入らない", () => {
    const r = computeBalances(members, [exp(1000, "a", ["b", "c"])]);
    expect(r.map((x) => x.balance)).toEqual([1000, -500, -500]);
  });
  it("1人だけの分", () => {
    const r = computeBalances(members, [exp(800, "a", ["c"])]);
    expect(r.map((x) => x.balance)).toEqual([800, 0, -800]);
  });
  it("打ち消し合えば全員0円", () => {
    const r = computeBalances(members, [exp(1000, "a", ["b"]), exp(1000, "b", ["a"])]);
    expect(r.every((x) => x.balance === 0)).toBe(true);
  });
  it("自分だけの分を自分で払っても0円", () => {
    const r = computeBalances(members, [exp(500, "a", ["a"])]);
    expect(r.every((x) => x.balance === 0)).toBe(true);
  });
});
