import { MAX_MEMBERS, type Expense, type Member } from "./types";

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

export type RenameResult = { ok: true; name: string; changed: boolean } | { ok: false; error: string };

/**
 * 名前の変更を確かめる（前後の空白を取る。空・自分以外と同じ名前はエラー）。
 * 自分の今の名前のままなら changed が false（変更なし）
 */
export function validateMemberRename(input: string, members: readonly Member[], id: string): RenameResult {
  const name = input.trim();
  if (name === "") return { ok: false, error: NAME_EMPTY_ERROR };
  if (members.some((m) => m.id !== id && m.name.trim() === name)) return { ok: false, error: NAME_DUPLICATE_ERROR };
  const current = members.find((m) => m.id === id);
  return { ok: true, name, changed: current?.name !== name };
}

/** メンバーの名前を変えた並びを返す（id と並びは変えない）。いないメンバーなら null */
export function renameMember(members: readonly Member[], id: string, name: string): Member[] | null {
  if (!members.some((m) => m.id === id)) return null;
  return members.map((m) => (m.id === id ? { ...m, name } : m));
}

/** メンバーを外した並びを返す。いないメンバーなら null */
export function removeMember(members: readonly Member[], id: string): Member[] | null {
  if (!members.some((m) => m.id === id)) return null;
  return members.filter((m) => m.id !== id);
}

/** 払った人か誰の分に入っている記録が1件でもあるか */
export function isMemberInExpenses(expenses: readonly Expense[], id: string): boolean {
  return expenses.some((e) => e.paidBy === id || e.sharedBy.includes(id));
}

/** 記録に出てくるメンバーを削除しようとしたときの理由 */
export function memberInUseMessage(name: string): string {
  return `${name}さんは立て替えの記録に出てくるので削除できません。`;
}

export type GroupNameResult = { ok: true; name: string; changed: boolean } | { ok: false; error: string };

/** グループ名の変更を確かめる（前後の空白を取る。空はエラー。今と同じなら changed が false） */
export function validateGroupName(input: string, current: string): GroupNameResult {
  const name = input.trim();
  if (name === "") return { ok: false, error: NAME_EMPTY_ERROR };
  return { ok: true, name, changed: name !== current };
}

/** 人の印の色の番号（足した順に1〜6、7人目から1に戻る） */
export function colorNumber(index: number): number {
  return (((index % 6) + 6) % 6) + 1;
}

/** 人の印の頭文字（名前の最初の1文字） */
export function initialOf(name: string): string {
  return Array.from(name.trim())[0] ?? "";
}
