import { describe, expect, it } from "vitest";
import { parseLedger, serializeLedger } from "./storage";
import { emptyLedger, type Ledger } from "./types";

const sample: Ledger = {
  version: 1,
  groupName: "301号室",
  members: [
    { id: "a", name: "佐藤" },
    { id: "b", name: "田中" },
  ],
  expenses: [
    { id: "e1", amount: 4620, memo: "スーパー", paidBy: "a", sharedBy: ["a", "b"], date: "2026-10-28", createdAt: 1 },
  ],
};

describe("parseLedger", () => {
  it("保存した物を読み戻せる", () => {
    expect(parseLedger(serializeLedger(sample))).toEqual(sample);
  });
  it("無い値は空", () => {
    expect(parseLedger(null)).toEqual(emptyLedger());
  });
  it("壊れた値は空", () => {
    expect(parseLedger("{not json")).toEqual(emptyLedger());
    expect(parseLedger("[]")).toEqual(emptyLedger());
    expect(parseLedger(JSON.stringify({ ...sample, version: 2 }))).toEqual(emptyLedger());
    expect(parseLedger(JSON.stringify({ ...sample, members: "x" }))).toEqual(emptyLedger());
    expect(parseLedger(JSON.stringify({ ...sample, members: [{ id: 1, name: "a" }] }))).toEqual(emptyLedger());
  });
  it("いないメンバーを指す記録・形の違う記録は捨てる", () => {
    const raw = JSON.stringify({
      ...sample,
      expenses: [
        ...sample.expenses,
        { ...sample.expenses[0], id: "e2", paidBy: "zzz" },
        { ...sample.expenses[0], id: "e3", amount: 1.5 },
        { ...sample.expenses[0], id: "e4", sharedBy: ["zzz"] },
      ],
    });
    expect(parseLedger(raw).expenses.map((e) => e.id)).toEqual(["e1"]);
  });
  it("グループ名が無ければ初期値", () => {
    expect(parseLedger(JSON.stringify({ ...sample, groupName: "" })).groupName).toBe("みんなの精算");
  });
});
