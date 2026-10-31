import type { Ref } from "react";
import { transferLabel } from "@/lib/format";
import type { Member, Transfer } from "@/lib/types";
import { CheckIcon, TransferArrow } from "./Icons";
import { PersonMark } from "./PersonMark";
import { Yen } from "./Yen";

export type SettlementState =
  | { kind: "loading" }
  | { kind: "fewMembers" }
  | { kind: "noExpenses" }
  | { kind: "allZero" }
  | { kind: "transfers"; transfers: Transfer[] };

type Props = {
  state: SettlementState;
  members: readonly Member[];
  /** 保存で金額が変わった組（`from>to`） */
  changedKeys: ReadonlySet<string>;
  onAddMember: () => void;
  addMemberRef: Ref<HTMLButtonElement>;
};

export function transferKey(t: Transfer): string {
  return `${t.from}>${t.to}`;
}

export function SettlementPanel({ state, members, changedKeys, onAddMember, addMemberRef }: Props) {
  return (
    <section className="block" aria-labelledby="settlement-title">
      <h2 id="settlement-title" className="block-title">
        返す人と金額
      </h2>
      <div className="box">{renderBody()}</div>
    </section>
  );

  function renderBody() {
    switch (state.kind) {
      case "loading":
        return (
          <div aria-busy="true">
            <span className="visually-hidden">読み込み中…</span>
            {[0, 1, 2].map((i) => (
              <div className="transfer-row" key={i} aria-hidden="true">
                <span className="skel skel-mark-28" />
                <span className="skel skel-name" />
                <span className="transfer-spacer" />
                <span className="skel skel-amount" />
              </div>
            ))}
          </div>
        );
      case "fewMembers":
        return (
          <div className="empty">
            <p>一緒に精算する人を2人以上足すと、記録できるようになります。</p>
            <button ref={addMemberRef} type="button" className="button-primary empty-action" onClick={onAddMember}>
              メンバーを足す
            </button>
          </div>
        );
      case "noExpenses":
        return (
          <p className="empty">
            まだ立て替えがありません。最初の1件を記録すると、ここに誰が誰にいくら返すかが出ます。
          </p>
        );
      case "allZero":
        return (
          <p className="empty empty-done">
            <CheckIcon size={16} />
            <span>全員の差し引きが0円です。返すお金はありません。</span>
          </p>
        );
      case "transfers":
        return (
          <ul className="rows">
            {state.transfers.map((t) => {
              const fromIndex = members.findIndex((m) => m.id === t.from);
              const toIndex = members.findIndex((m) => m.id === t.to);
              const from = members[fromIndex];
              const to = members[toIndex];
              if (!from || !to) return null;
              const key = transferKey(t);
              return (
                <li key={key} className="transfer-row">
                  <span className="visually-hidden">{transferLabel(from.name, to.name, t.amount)}</span>
                  <span className="transfer-visual" aria-hidden="true">
                    <PersonMark name={from.name} index={fromIndex} size={28} />
                    <span className="transfer-name">{from.name}</span>
                    <TransferArrow />
                    <PersonMark name={to.name} index={toIndex} size={28} />
                    <span className="transfer-name">{to.name}</span>
                  </span>
                  <span aria-hidden="true" className="transfer-amount-cell">
                    <Yen
                      value={t.amount}
                      className={changedKeys.has(key) ? "transfer-amount flash" : "transfer-amount"}
                    />
                  </span>
                </li>
              );
            })}
          </ul>
        );
    }
  }
}
