export const AMOUNT_EMPTY_ERROR = "金額を入れてください（1円以上）。";
export const AMOUNT_NOT_NUMBER_ERROR = "金額は数字で入れてください。";

export type AmountResult = { ok: true; value: number } | { ok: false; error: string };

/**
 * 入力された金額を読む。全角数字・桁区切り（, と ，）・空白を受け付ける。
 * 空・0 と、数字でないものはエラーの文言を返す。
 */
export function parseAmount(input: string): AmountResult {
  const normalized = input
    .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/[,，\s]/g, "");
  if (normalized === "") return { ok: false, error: AMOUNT_EMPTY_ERROR };
  if (!/^\d+$/.test(normalized)) return { ok: false, error: AMOUNT_NOT_NUMBER_ERROR };
  const value = Number(normalized);
  if (!Number.isSafeInteger(value)) return { ok: false, error: AMOUNT_NOT_NUMBER_ERROR };
  if (value === 0) return { ok: false, error: AMOUNT_EMPTY_ERROR };
  return { ok: true, value };
}
