"use client";

import { useCallback, useRef, useState } from "react";
import type { Member } from "@/lib/types";
import { Dialog } from "./Dialog";
import { ExpenseForm, type ExpenseDraft } from "./ExpenseForm";

export type SheetPhase = "closed" | "open" | "closing";

type Props = {
  phase: SheetPhase;
  members: readonly Member[];
  /** 何度目のフォームか（変えると中身を最初に戻す） */
  formKey: number;
  onSave: (draft: ExpenseDraft) => boolean;
  /** 閉じる（捨てるかの確認は済んでいる） */
  onClose: (discard: boolean) => void;
};

/** スマホ・タブレットの「立て替えを記録」の下からのシート */
export function RecordSheet({ phase, members, formKey, onSave, onClose }: Props) {
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
              key={formKey}
              members={members}
              onSave={onSave}
              onDirtyChange={onDirtyChange}
              focusOnMount
              header={
                <div className="sheet-header">
                  <h2 id="record-sheet-title" className="sheet-title">
                    立て替えを記録
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

function ConfirmDiscard({ open, onKeep, onDiscard }: { open: boolean; onKeep: () => void; onDiscard: () => void }) {
  return (
    <Dialog open={open} onRequestClose={onKeep} className="confirm" labelledBy="confirm-title" role="alertdialog">
      {open && (
        <div className="confirm-body">
          <p id="confirm-title" className="confirm-title">
            入れた内容を捨てますか？
          </p>
          <div className="confirm-actions">
            {/* 開いたら「入力に戻る」にフォーカス */}
            <button type="button" className="button-secondary" autoFocus onClick={onKeep}>
              入力に戻る
            </button>
            <button type="button" className="button-secondary" onClick={onDiscard}>
              捨てる
            </button>
          </div>
        </div>
      )}
    </Dialog>
  );
}
