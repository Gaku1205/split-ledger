import { describe, expect, it } from "vitest";
import { AMOUNT_EMPTY_ERROR, AMOUNT_NOT_NUMBER_ERROR, parseAmount } from "./amount";

describe("parseAmount", () => {
  it("半角の数字を読む", () => {
    expect(parseAmount("1200")).toEqual({ ok: true, value: 1200 });
  });
  it("全角の数字と桁区切りを受け付ける", () => {
    expect(parseAmount("１２，３４５")).toEqual({ ok: true, value: 12345 });
    expect(parseAmount("48,620")).toEqual({ ok: true, value: 48620 });
    expect(parseAmount(" 1 200 ")).toEqual({ ok: true, value: 1200 });
    expect(parseAmount("1　200")).toEqual({ ok: true, value: 1200 });
  });
  it("空と0はエラー", () => {
    expect(parseAmount("")).toEqual({ ok: false, error: AMOUNT_EMPTY_ERROR });
    expect(parseAmount("   ")).toEqual({ ok: false, error: AMOUNT_EMPTY_ERROR });
    expect(parseAmount("0")).toEqual({ ok: false, error: AMOUNT_EMPTY_ERROR });
    expect(parseAmount("００")).toEqual({ ok: false, error: AMOUNT_EMPTY_ERROR });
  });
  it("数字以外はエラー", () => {
    for (const s of ["abc", "12円", "1.5", "-100", "1e3", "99999999999999999999"]) {
      expect(parseAmount(s)).toEqual({ ok: false, error: AMOUNT_NOT_NUMBER_ERROR });
    }
  });
});
