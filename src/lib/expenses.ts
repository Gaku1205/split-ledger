import type { Expense } from "./types";

/** 直す・足すときの中身（id と記録した時刻は含まない） */
export type ExpenseFields = Omit<Expense, "id" | "createdAt">;

/** 消した記録と、消す前に並びの中にあった位置（0始まり） */
export type RemovedExpense = { expense: Expense; index: number };

/**
 * 記録の中身を差し替える（id と記録した時刻は変えない）。
 * 存在しない id なら null（何も変えない）。
 */
export function replaceExpense(expenses: readonly Expense[], id: string, fields: ExpenseFields): Expense[] | null {
  if (!expenses.some((e) => e.id === id)) return null;
  return expenses.map((e) => (e.id === id ? { ...fields, id: e.id, createdAt: e.createdAt } : e));
}

/**
 * 記録を消す。消した記録と元の位置も返す。
 * 存在しない id なら null（何も変えない）。
 */
export function removeExpense(
  expenses: readonly Expense[],
  id: string,
): { expenses: Expense[]; removed: RemovedExpense } | null {
  const index = expenses.findIndex((e) => e.id === id);
  if (index < 0) return null;
  return {
    expenses: expenses.filter((e) => e.id !== id),
    removed: { expense: expenses[index], index },
  };
}

/**
 * 消した記録を元の位置に戻す。位置が並びの長さを超えていれば末尾に入れる。
 * すでに同じ id の記録があれば何も変えない（二重に戻さない）。
 */
export function restoreExpense(expenses: readonly Expense[], removed: RemovedExpense): Expense[] {
  if (expenses.some((e) => e.id === removed.expense.id)) return [...expenses];
  const index = Math.min(Math.max(removed.index, 0), expenses.length);
  return [...expenses.slice(0, index), removed.expense, ...expenses.slice(index)];
}

/** 消したときの知らせ「スーパーの記録を消しました」（何にが空なら「記録を消しました」） */
export function removedMessage(memo: string): string {
  const name = memo.trim();
  return name === "" ? "記録を消しました" : name + "の記録を消しました";
}
