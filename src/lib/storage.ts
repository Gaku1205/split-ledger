import { emptyLedger, type Expense, type Ledger, type Member } from "./types";

export const STORAGE_KEY = "split-ledger:v1";

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function readMember(v: unknown): Member | null {
  if (!isRecord(v)) return null;
  if (typeof v.id !== "string" || typeof v.name !== "string" || v.id === "" || v.name.trim() === "") return null;
  return { id: v.id, name: v.name };
}

function readExpense(v: unknown, memberIds: Set<string>): Expense | null {
  if (!isRecord(v)) return null;
  const { id, amount, memo, paidBy, sharedBy, date, createdAt } = v;
  if (typeof id !== "string") return null;
  if (typeof amount !== "number" || !Number.isSafeInteger(amount) || amount < 1) return null;
  if (typeof memo !== "string") return null;
  if (typeof paidBy !== "string" || !memberIds.has(paidBy)) return null;
  if (!Array.isArray(sharedBy) || !sharedBy.every((s): s is string => typeof s === "string")) return null;
  const shared = sharedBy.filter((s) => memberIds.has(s));
  if (shared.length === 0) return null;
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  if (typeof createdAt !== "number" || !Number.isFinite(createdAt)) return null;
  return { id, amount, memo, paidBy, sharedBy: shared, date, createdAt };
}

/**
 * 保存された文字を読む。無い・壊れている・形が違うときは空として扱う。
 * いないメンバーを指す記録は捨てる。
 */
export function parseLedger(raw: string | null): Ledger {
  if (raw === null) return emptyLedger();
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return emptyLedger();
  }
  if (!isRecord(data) || data.version !== 1) return emptyLedger();
  if (!Array.isArray(data.members) || !Array.isArray(data.expenses)) return emptyLedger();
  const members: Member[] = [];
  const ids = new Set<string>();
  for (const m of data.members) {
    const member = readMember(m);
    if (!member || ids.has(member.id)) return emptyLedger();
    ids.add(member.id);
    members.push(member);
  }
  const expenses: Expense[] = [];
  for (const e of data.expenses) {
    const expense = readExpense(e, ids);
    if (expense) expenses.push(expense);
  }
  const groupName =
    typeof data.groupName === "string" && data.groupName.trim() !== "" ? data.groupName : emptyLedger().groupName;
  return { version: 1, groupName, members, expenses };
}

export function serializeLedger(ledger: Ledger): string {
  return JSON.stringify(ledger);
}
