import { describe, expect, it } from "vitest";
import { perPerson, splitAmount } from "./split";

const order = ["a", "b", "c", "d"];

describe("splitAmount", () => {
  it("割り切れるときは同じ金額", () => {
    expect(Object.fromEntries(splitAmount(1200, ["a", "b", "c"], order))).toEqual({ a: 400, b: 400, c: 400 });
  });
  it("端数はメンバーに足した順に1円ずつ足す", () => {
    expect(Object.fromEntries(splitAmount(1000, ["c", "a", "b"], order))).toEqual({ a: 334, b: 333, c: 333 });
    const r = splitAmount(4622, ["d", "b", "a", "c"], order);
    expect(Object.fromEntries(r)).toEqual({ a: 1156, b: 1156, c: 1155, d: 1155 });
    expect([...r.values()].reduce((s, v) => s + v, 0)).toBe(4622);
  });
  it("1人だけの分", () => {
    expect(Object.fromEntries(splitAmount(777, ["b"], order))).toEqual({ b: 777 });
  });
  it("金額が人数より少ないとき", () => {
    expect(Object.fromEntries(splitAmount(2, ["a", "b", "c"], order))).toEqual({ a: 1, b: 1, c: 0 });
  });
  it("同じ人が2回入っていても1人として数える", () => {
    expect(Object.fromEntries(splitAmount(100, ["a", "a", "b"], order))).toEqual({ a: 50, b: 50 });
  });
  it("誰もいなければ空", () => {
    expect(splitAmount(100, [], order).size).toBe(0);
  });
});

describe("perPerson", () => {
  it("切り捨てた金額と端数の有無", () => {
    expect(perPerson(4620, 4)).toEqual({ base: 1155, hasRemainder: false });
    expect(perPerson(4622, 4)).toEqual({ base: 1155, hasRemainder: true });
  });
});
