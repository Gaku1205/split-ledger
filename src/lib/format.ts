import { parseAmount } from "./amount";
import { perPerson } from "./split";
import type { Expense, Member } from "./types";

const numberFormat = new Intl.NumberFormat("ja-JP");

/** 桁区切りの数字（「円」は付けない） */
export function formatNumber(n: number): string {
  return numberFormat.format(n);
}

/** 「6,210円」 */
export function formatYen(n: number): string {
  return `${formatNumber(n)}円`;
}

function parseIsoDate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** 一覧の日付。「10月28日」、今年でなければ「2025年10月28日」 */
export function formatDateLabel(iso: string, now: Date): string {
  const d = parseIsoDate(iso);
  if (!d) return iso;
  const options: Intl.DateTimeFormatOptions =
    d.getFullYear() === now.getFullYear()
      ? { month: "long", day: "numeric" }
      : { year: "numeric", month: "long", day: "numeric" };
  return new Intl.DateTimeFormat("ja-JP", options).format(d);
}

/** その日の YYYY-MM-DD（ブラウザの時刻で） */
export function toIsoDate(d: Date): string {
  const y = String(d.getFullYear()).padStart(4, "0");
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** 要約「4人で12件、合計48,620円」（0件なら「3人で0件」） */
export function summaryText(memberCount: number, expenses: readonly Expense[]): string {
  if (expenses.length === 0) return `${memberCount}人で0件`;
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  return `${memberCount}人で${expenses.length}件、合計${formatYen(total)}`;
}

/** フォームの「1人あたり」 */
export function perPersonText(amountInput: string, people: number): string {
  const amount = parseAmount(amountInput);
  if (!amount.ok || people < 1) return "1人あたり —";
  const { base, hasRemainder } = perPerson(amount.value, people);
  const note = hasRemainder ? `${people}人で割る・端数は1円ずつ上乗せ` : `${people}人で割る`;
  return `1人あたり ${formatYen(base)}（${note}）`;
}

/** 記録の2行目の「（4人の分）」「（佐藤・田中の分）」の中身 */
export function sharedLabel(sharedBy: readonly string[], members: readonly Member[]): string {
  const ids = new Set(sharedBy);
  const included = members.filter((m) => ids.has(m.id));
  if (included.length === members.length && included.length > 0) return `${included.length}人の分`;
  return `${included.map((m) => m.name).join("・")}の分`;
}

/** 記録の2行目「10月28日 佐藤さんが払った（4人の分）」 */
export function expenseDetail(expense: Expense, members: readonly Member[], now: Date): string {
  const payer = members.find((m) => m.id === expense.paidBy)?.name ?? "";
  return `${formatDateLabel(expense.date, now)} ${payer}さんが払った（${sharedLabel(expense.sharedBy, members)}）`;
}

/** 返す組の読み上げ「田中さんが佐藤さんに6,210円返す」 */
export function transferLabel(fromName: string, toName: string, amount: number): string {
  return `${fromName}さんが${toName}さんに${formatYen(amount)}返す`;
}

/** 記録を新しい順に（日付の新しい順、同じ日付なら後から記録した方が上） */
export function sortNewestFirst(expenses: readonly Expense[]): Expense[] {
  return [...expenses].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? 1 : -1;
    return b.createdAt - a.createdAt;
  });
}
