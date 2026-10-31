import { MAX_MEMBERS, type Member } from "./types";

export const NAME_EMPTY_ERROR = "名前を入れてください。";
export const NAME_DUPLICATE_ERROR = "同じ名前のメンバーがいます。別の名前にしてください。";
export const MEMBER_LIMIT_TEXT = "メンバーは6人までです。";

export type NameResult = { ok: true; name: string } | { ok: false; error: string };

/** 足そうとしている名前を確かめる（前後の空白を取る。空・同じ名前・上限はエラー） */
export function validateMemberName(input: string, members: readonly Member[]): NameResult {
  const name = input.trim();
  if (members.length >= MAX_MEMBERS) return { ok: false, error: MEMBER_LIMIT_TEXT };
  if (name === "") return { ok: false, error: NAME_EMPTY_ERROR };
  if (members.some((m) => m.name.trim() === name)) return { ok: false, error: NAME_DUPLICATE_ERROR };
  return { ok: true, name };
}

/** 人の印の色の番号（足した順に1〜6、7人目から1に戻る） */
export function colorNumber(index: number): number {
  return (((index % 6) + 6) % 6) + 1;
}

/** 人の印の頭文字（名前の最初の1文字） */
export function initialOf(name: string): string {
  return Array.from(name.trim())[0] ?? "";
}
