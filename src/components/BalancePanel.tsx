import type { Balance, Member } from "@/lib/types";
import { PersonMark } from "./PersonMark";
import { Yen } from "./Yen";

type Props = {
  /** null は読み込み中 */
  members: readonly Member[] | null;
  balances: readonly Balance[];
};

export function BalancePanel({ members, balances }: Props) {
  const maxAbs = balances.reduce((m, b) => Math.max(m, Math.abs(b.balance)), 0);
  return (
    <section className="block" aria-labelledby="balance-title">
      <h2 id="balance-title" className="block-title">
        ひとりずつの差し引き
      </h2>
      <div className="box">
        {members === null ? (
          <div aria-busy="true">
            <span className="visually-hidden">読み込み中…</span>
            {[0, 1, 2].map((i) => (
              <div className="balance-row" key={i} aria-hidden="true">
                <span className="skel skel-mark-24" />
                <span className="skel skel-name" />
                <span />
                <span className="skel skel-small-amount" />
              </div>
            ))}
          </div>
        ) : members.length === 0 ? (
          <p className="empty">
            <span className="muted-dash">—</span>
          </p>
        ) : (
          <ul className="rows">
            {members.map((m, index) => {
              const balance = balances.find((b) => b.memberId === m.id)?.balance ?? 0;
              const pct = maxAbs === 0 ? 0 : (Math.abs(balance) / maxAbs) * 50;
              return (
                <li key={m.id} className="balance-row">
                  <PersonMark name={m.name} index={index} size={24} />
                  <span className="balance-name">{m.name}</span>
                  <span className="bar-track" aria-hidden="true">
                    {balance !== 0 && (
                      <span
                        className={balance > 0 ? "bar-fill bar-plus" : "bar-fill bar-minus"}
                        style={{ width: `${pct}%` }}
                      />
                    )}
                  </span>
                  <span className="balance-value">
                    {balance > 0 && <span className="balance-word">受け取る </span>}
                    {balance < 0 && <span className="balance-word">返す </span>}
                    <Yen value={Math.abs(balance)} className="money-14" />
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
