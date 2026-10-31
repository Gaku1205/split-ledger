"use client";

import { useState } from "react";
import { expenseDetail, sortNewestFirst } from "@/lib/format";
import type { Expense, Member } from "@/lib/types";
import { Yen } from "./Yen";

type Props = {
  /** null は読み込み中 */
  members: readonly Member[] | null;
  expenses: readonly Expense[];
  /** 保存した直後の記録 */
  highlightId: string | null;
  /** 行を押した（その記録を直すフォームを開く） */
  onSelect: (id: string, button: HTMLButtonElement) => void;
};

const FIRST_COUNT = 5;

export function ExpenseListPanel({ members, expenses, highlightId, onSelect }: Props) {
  const [showAll, setShowAll] = useState(false);
  const sorted = sortNewestFirst(expenses);
  const visible = showAll ? sorted : sorted.slice(0, FIRST_COUNT);
  const many = sorted.length > 50;
  const now = new Date();

  return (
    <section className="block" aria-labelledby="expenses-title">
      <h2 id="expenses-title" className="block-title">
        立て替えの記録
      </h2>
      <div className="box">
        {members === null ? (
          <div aria-busy="true">
            <span className="visually-hidden">読み込み中…</span>
            {[0, 1, 2].map((i) => (
              <div className="expense-row" key={i} aria-hidden="true">
                <span className="expense-line">
                  <span className="skel skel-name" />
                  <span className="skel skel-small-amount" />
                </span>
              </div>
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <p className="empty">記録はまだありません。</p>
        ) : (
          <ul className="rows">
            {visible.map((e) => (
              <li key={e.id} className={many ? "expense-item expense-row-many" : "expense-item"}>
                <button
                  type="button"
                  className={e.id === highlightId ? "expense-row flash" : "expense-row"}
                  onClick={(ev) => onSelect(e.id, ev.currentTarget)}
                >
                  <span className="expense-line">
                    {e.memo === "" ? (
                      <span className="expense-memo muted-dash">—</span>
                    ) : (
                      <span className="expense-memo">{e.memo}</span>
                    )}
                    <Yen value={e.amount} className="money-16" />
                  </span>
                  <span className="expense-detail">{expenseDetail(e, members, now)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {members !== null && !showAll && sorted.length > FIRST_COUNT && (
        <div className="more">
          <button type="button" className="text-button" onClick={() => setShowAll(true)}>
            すべての記録（{sorted.length}件）
          </button>
        </div>
      )}
    </section>
  );
}
