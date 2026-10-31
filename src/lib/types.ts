/** メンバー（members の並びが、メンバーに足した順） */
export type Member = {
  id: string;
  name: string;
};

/** 1件の立て替え */
export type Expense = {
  id: string;
  /** 1円単位の整数（1以上） */
  amount: number;
  memo: string;
  /** 払った人のメンバーid */
  paidBy: string;
  /** 誰の分（メンバーid、1人以上） */
  sharedBy: string[];
  /** YYYY-MM-DD */
  date: string;
  /** 記録した時刻（ミリ秒） */
  createdAt: number;
};

export type Ledger = {
  version: 1;
  groupName: string;
  members: Member[];
  expenses: Expense[];
};

/** 返す組（from が to に amount 円返す） */
export type Transfer = {
  from: string;
  to: string;
  amount: number;
};

export type Balance = {
  memberId: string;
  /** 受け取る＝正、返す＝負 */
  balance: number;
};

export const MAX_MEMBERS = 6;
export const DEFAULT_GROUP_NAME = "みんなの精算";

export function emptyLedger(): Ledger {
  return { version: 1, groupName: DEFAULT_GROUP_NAME, members: [], expenses: [] };
}
