import type { Balance, Transfer } from "./types";

type Entry = { id: string; rest: number; rank: number };

/**
 * 差し引きから、返す組を求める（貪欲法）。
 * いちばん大きく返す人から、いちばん大きく受け取る人へ、2人の残りの小さいほうの金額を返す。
 * 同額はメンバーに足した順（balances の並び）。結果は金額の大きい順。
 *
 * @param balances メンバーに足した順の差し引き（受け取る＝正、返す＝負）
 */
export function settle(balances: readonly Balance[]): Transfer[] {
  const byRest = (a: Entry, b: Entry) => b.rest - a.rest || a.rank - b.rank;
  const creditors: Entry[] = [];
  const debtors: Entry[] = [];
  balances.forEach((b, rank) => {
    if (b.balance > 0) creditors.push({ id: b.memberId, rest: b.balance, rank });
    else if (b.balance < 0) debtors.push({ id: b.memberId, rest: -b.balance, rank });
  });
  const found: (Transfer & { fromRank: number; toRank: number })[] = [];
  while (creditors.length > 0 && debtors.length > 0) {
    creditors.sort(byRest);
    debtors.sort(byRest);
    const c = creditors[0];
    const d = debtors[0];
    const amount = Math.min(c.rest, d.rest);
    found.push({ from: d.id, to: c.id, amount, fromRank: d.rank, toRank: c.rank });
    c.rest -= amount;
    d.rest -= amount;
    if (c.rest === 0) creditors.shift();
    if (d.rest === 0) debtors.shift();
  }
  return found
    .sort((a, b) => b.amount - a.amount || a.fromRank - b.fromRank || a.toRank - b.toRank)
    .map(({ from, to, amount }) => ({ from, to, amount }));
}
