import { describe, expect, it } from "vitest";
import { computeBalances } from "./balances";
import { settle } from "./settle";
import type { Balance, Expense, Member } from "./types";

const b = (pairs: [string, number][]): Balance[] => pairs.map(([memberId, balance]) => ({ memberId, balance }));

describe("settle", () => {
  it("全員0円なら返す組は無い", () => {
    expect(settle(b([["a", 0], ["b", 0]]))).toEqual([]);
    expect(settle([])).toEqual([]);
  });
  it("2人なら1組", () => {
    expect(settle(b([["a", 500], ["b", -500]]))).toEqual([{ from: "b", to: "a", amount: 500 }]);
  });
  it("大きい順に相殺し、金額の大きい順に並べる", () => {
    const r = settle(b([["sato", 9050], ["tanaka", -6210], ["suzuki", -3370], ["takahashi", 530]]));
    expect(r).toEqual([
      { from: "tanaka", to: "sato", amount: 6210 },
      { from: "suzuki", to: "sato", amount: 2840 },
      { from: "suzuki", to: "takahashi", amount: 530 },
    ]);
  });
  it("同額のときはメンバーに足した順", () => {
    expect(settle(b([["a", -100], ["b", -100], ["c", 200]]))).toEqual([
      { from: "a", to: "c", amount: 100 },
      { from: "b", to: "c", amount: 100 },
    ]);
  });
  it("返す組のとおりに返すと、全員の差し引きが0になる", () => {
    const members: Member[] = ["a", "b", "c", "d"].map((id) => ({ id, name: id }));
    const e = (amount: number, paidBy: string, sharedBy: string[]): Expense => ({
      id: String(amount),
      amount,
      memo: "",
      paidBy,
      sharedBy,
      date: "2026-10-01",
      createdAt: 0,
    });
    const balances = computeBalances(members, [
      e(4622, "a", ["a", "b", "c", "d"]),
      e(1001, "b", ["c", "d"]),
      e(333, "d", ["a"]),
    ]);
    const rest = new Map(balances.map((x) => [x.memberId, x.balance]));
    const transfers = settle(balances);
    for (const t of transfers) {
      expect(t.amount).toBeGreaterThan(0);
      rest.set(t.from, (rest.get(t.from) ?? 0) + t.amount);
      rest.set(t.to, (rest.get(t.to) ?? 0) - t.amount);
    }
    expect([...rest.values()].every((v) => v === 0)).toBe(true);
    expect(transfers.length).toBeLessThanOrEqual(members.length - 1);
  });
});
