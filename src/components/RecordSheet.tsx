"use client";

import { useCallback, useId, useRef, useState } from "react";
import type { Expense, Member } from "@/lib/types";
import { Dialog } from "./Dialog";
import { ExpenseForm, type ExpenseDraft } from "./ExpenseForm";

export type SheetPhase = "closed" | "open" | "closing";

type Props = {
  phase: SheetPhase;
  members: readonly Member[];
  /** 何度目のフォームか（変えると中身を最初に戻す） */
  formKey: number;
  /** 直す記録（null なら新しく記録する） */
  expense: Expense | null;
  onDelete: () => boolean;
  onSave: (draft: ExpenseDraft) => boolean;
  /** 閉じる（捨てるかの確認は済んでいる） */
  onClose: (discard: boolean) => void;
};

/** スマホ・タブレットの「立て替えを記録」の下からのシート */
export function RecordSheet({ phase, members, formKey, expense, onDelete, onSave, onClose }: Props) {
  const dirtyRef = useRef(false);
  const [confirming, setConfirming] = useState(false);

  const onDirtyChange = useCallback((dirty: boolean) => {
    dirtyRef.current = dirty;
  }, []);

  const requestClose = useCallback(() => {
    if (phase !== "open") return;
    if (dirtyRef.current) setConfirming(true);
    else onClose(false);
  }, [phase, onClose]);

  const keepEditing = useCallback(() => setConfirming(false), []);

  return (
    <>
      <Dialog
        open={phase !== "closed"}
        onRequestClose={requestClose}
        className={phase === "closing" ? "sheet record-sheet is-closing" : "sheet record-sheet"}
        labelledBy="record-sheet-title"
      >
        {phase !== "closed" && (
          <div className="sheet-body">
            <ExpenseForm
              key={`${formKey}-${expense?.id ?? "new"}`}
              expense={expense ?? undefined}
              onDelete={onDelete}
              members={members}
              onSave={onSave}
              onDirtyChange={onDirtyChange}
              focusOnMount
              header={
                <div className="sheet-header">
                  <h2 id="record-sheet-title" className="sheet-title">
                    {expense ? "記録を直す" : "立て替えを記録"}
                  </h2>
                  <button type="button" className="button-secondary" onClick={requestClose}>
                    閉じる
                  </button>
                </div>
              }
            />
          </div>
        )}
      </Dialog>
      <ConfirmDiscard
        open={confirming}
        onKeep={keepEditing}
        onDiscard={() => {
          setConfirming(false);
          dirtyRef.current = false;
          onClose(true);
        }}
      />
    </>
  );
}

type ConfirmProps = {
  open: boolean;
  title: string;
  /** 元に戻るほうのボタン（開いたらここにフォーカス。Esc も同じ） */
  keepLabel: string;
  confirmLabel: string;
  onKeep: () => void;
  onConfirm: () => void;
};

/** 確かめるダイアログ */
export function ConfirmDialog({ open, title, keepLabel, confirmLabel, onKeep, onConfirm }: ConfirmProps) {
  const titleId = useId();
  return (
    <Dialog open={open} onRequestClose={onKeep} className="confirm" labelledBy={titleId} role="alertdialog">
      {open && (
        <div className="confirm-body">
          <p id={titleId} className="confirm-title">
            {title}
          </p>
          <div className="confirm-actions">
            <button type="button" className="button-secondary" autoFocus onClick={onKeep}>
              {keepLabel}
            </button>
            <button type="button" className="button-secondary" onClick={onConfirm}>
              {confirmLabel}
            </button>
          </div>
        </div>
      )}
    </Dialog>
  );
}

export function ConfirmDiscard({ open, onKeep, onDiscard }: { open: boolean; onKeep: () => void; onDiscard: () => void }) {
  return (
    <ConfirmDialog
      open={open}
      title="入れた内容を捨てますか？"
      keepLabel="入力に戻る"
      confirmLabel="捨てる"
      onKeep={onKeep}
      onConfirm={onDiscard}
    />
  );
}
