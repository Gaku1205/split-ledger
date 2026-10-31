import { splitAmount } from "./split";
import type { Balance, Expense, Member } from "./types";

/**
 * ひとりずつの差し引き（受け取る＝正、返す＝負）。
 * 戻り値はメンバーに足した順。合計は必ず0になる。
 */
export function computeBalances(members: readonly Member[], expenses: readonly Expense[]): Balance[] {
  const order = members.map((m) => m.id);
  const totals = new Map<string, number>(order.map((id) => [id, 0]));
  for (const e of expenses) {
    if (!totals.has(e.paidBy)) continue;
    const shares = splitAmount(
      e.amount,
      e.sharedBy.filter((id) => totals.has(id)),
      order,
    );
    if (shares.size === 0) continue;
    totals.set(e.paidBy, (totals.get(e.paidBy) ?? 0) + e.amount);
    for (const [id, share] of shares) totals.set(id, (totals.get(id) ?? 0) - share);
  }
  return order.map((id) => ({ memberId: id, balance: totals.get(id) ?? 0 }));
}
