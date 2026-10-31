import { describe, expect, it } from "vitest";
import {
  expenseDetail,
  formatDateLabel,
  formatYen,
  perPersonText,
  sharedLabel,
  sortNewestFirst,
  summaryText,
  toIsoDate,
  transferLabel,
} from "./format";
import type { Expense, Member } from "./types";

const members: Member[] = [
  { id: "a", name: "佐藤" },
  { id: "b", name: "田中" },
  { id: "c", name: "鈴木" },
  { id: "d", name: "高橋" },
];

const exp = (over: Partial<Expense>): Expense => ({
  id: "x",
  amount: 1000,
  memo: "",
  paidBy: "a",
  sharedBy: ["a", "b", "c", "d"],
  date: "2026-10-28",
  createdAt: 0,
  ...over,
});

describe("formatYen", () => {
  it("桁区切りと円", () => {
    expect(formatYen(48620)).toBe("48,620円");
    expect(formatYen(0)).toBe("0円");
  });
});

describe("formatDateLabel", () => {
  const now = new Date(2026, 9, 31);
  it("今年は月と日だけ", () => {
    expect(formatDateLabel("2026-10-28", now)).toBe("10月28日");
  });
  it("今年でなければ年も", () => {
    expect(formatDateLabel("2025-10-28", now)).toBe("2025年10月28日");
  });
});

describe("toIsoDate", () => {
  it("YYYY-MM-DD", () => {
    expect(toIsoDate(new Date(2026, 0, 5))).toBe("2026-01-05");
  });
});

describe("summaryText", () => {
  it("件数と合計", () => {
    expect(summaryText(4, [exp({ amount: 4620 }), exp({ amount: 44000 })])).toBe("4人で2件、合計48,620円");
  });
  it("0件", () => {
    expect(summaryText(3, [])).toBe("3人で0件");
  });
});

describe("perPersonText", () => {
  it("割り切れる", () => {
    expect(perPersonText("4,620", 4)).toBe("1人あたり 1,155円（4人で割る）");
  });
  it("端数がある", () => {
    expect(perPersonText("4622", 4)).toBe("1人あたり 1,155円（4人で割る・端数は1円ずつ上乗せ）");
  });
  it("足りないとき", () => {
    expect(perPersonText("", 4)).toBe("1人あたり —");
    expect(perPersonText("100", 0)).toBe("1人あたり —");
  });
});

describe("sharedLabel と expenseDetail", () => {
  it("全員なら人数", () => {
    expect(sharedLabel(["a", "b", "c", "d"], members)).toBe("4人の分");
  });
  it("一部なら足した順に名前", () => {
    expect(sharedLabel(["b", "a"], members)).toBe("佐藤・田中の分");
  });
  it("2行目の文", () => {
    expect(expenseDetail(exp({}), members, new Date(2026, 9, 31))).toBe("10月28日 佐藤さんが払った（4人の分）");
  });
});

describe("transferLabel", () => {
  it("読み上げの文", () => {
    expect(transferLabel("田中", "佐藤", 6210)).toBe("田中さんが佐藤さんに6,210円返す");
  });
});

describe("sortNewestFirst", () => {
  it("日付の新しい順、同じ日なら後から記録した方が上", () => {
    const r = sortNewestFirst([
      exp({ id: "1", date: "2026-10-01", createdAt: 1 }),
      exp({ id: "2", date: "2026-10-28", createdAt: 2 }),
      exp({ id: "3", date: "2026-10-28", createdAt: 3 }),
    ]);
    expect(r.map((e) => e.id)).toEqual(["3", "2", "1"]);
  });
});
