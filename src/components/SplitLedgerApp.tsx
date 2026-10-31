"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { computeBalances } from "@/lib/balances";
import { removeExpense, removedMessage, replaceExpense, restoreExpense, type RemovedExpense } from "@/lib/expenses";
import { summaryText } from "@/lib/format";
import { newId, saveLedger, useIsDesktop, useLedger } from "@/lib/ledgerStore";
import { settle } from "@/lib/settle";
import { MAX_MEMBERS, type Ledger } from "@/lib/types";
import { BalancePanel } from "./BalancePanel";
import { ExpenseForm, type ExpenseDraft } from "./ExpenseForm";
import { ExpenseListPanel } from "./ExpenseListPanel";
import { MenuSheet } from "./MenuSheet";
import { ConfirmDiscard, RecordSheet, type SheetPhase } from "./RecordSheet";
import { SettlementPanel, transferKey, type SettlementState } from "./SettlementPanel";
import { Toast, type ToastMessage } from "./Toast";
import { TopBar } from "./TopBar";

const SHEET_CLOSE_MS = 160;
const HIGHLIGHT_MS = 1600;
/** 「元に戻す」を出しておく時間 */
const UNDO_MS = 8000;

type Highlight = { expenseId: string | null; transferKeys: ReadonlySet<string> };
const NO_HIGHLIGHT: Highlight = { expenseId: null, transferKeys: new Set() };

export function SplitLedgerApp() {
  const ledger = useLedger();
  const isDesktop = useIsDesktop();

  const [menuOpen, setMenuOpen] = useState(false);
  const [sheet, setSheet] = useState<SheetPhase>("closed");
  const [formKey, setFormKey] = useState(0);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [highlight, setHighlight] = useState<Highlight>(NO_HIGHLIGHT);
  /** 直している記録（null なら新しく記録する） */
  const [editingId, setEditingId] = useState<string | null>(null);
  /** PC で、入力の途中のフォームを捨てるかの確認を出している */
  const [confirming, setConfirming] = useState(false);

  /** 直す・閉じるときにフォーカスを戻す行 */
  const editReturnRef = useRef<HTMLButtonElement | null>(null);
  /** PC のフォームが入力の途中か */
  const dirtyRef = useRef(false);
  /** 確認で「捨てる」を選んだあとにすること */
  const pendingRef = useRef<(() => void) | null>(null);
  /** 「元に戻す」が押された時点の最新の帳簿 */
  const ledgerRef = useRef<Ledger | null>(null);
  useEffect(() => {
    ledgerRef.current = ledger;
  }, [ledger]);

  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const recordButtonRef = useRef<HTMLButtonElement>(null);
  const addMemberPanelRef = useRef<HTMLButtonElement>(null);
  /** メニューを閉じたときにフォーカスを戻す所 */
  const menuReturnRef = useRef<HTMLButtonElement | null>(null);
  const closeTimer = useRef<number | null>(null);
  const highlightTimer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
      if (highlightTimer.current !== null) window.clearTimeout(highlightTimer.current);
    },
    [],
  );

  const members = useMemo(() => ledger?.members ?? [], [ledger]);
  const expenses = useMemo(() => ledger?.expenses ?? [], [ledger]);
  const balances = useMemo(() => computeBalances(members, expenses), [members, expenses]);
  const transfers = useMemo(() => settle(balances), [balances]);
  const canRecord = members.length >= 2;
  const editing = useMemo(
    () => (editingId === null ? null : (expenses.find((e) => e.id === editingId) ?? null)),
    [editingId, expenses],
  );

  const settlementState: SettlementState =
    ledger === null
      ? { kind: "loading" }
      : !canRecord
        ? { kind: "fewMembers" }
        : expenses.length === 0
          ? { kind: "noExpenses" }
          : transfers.length === 0
            ? { kind: "allZero" }
            : { kind: "transfers", transfers };

  const showToast = useCallback((text: string) => {
    setToast((t) => ({ id: (t?.id ?? 0) + 1, text }));
  }, []);
  const hideToast = useCallback(() => setToast(null), []);

  // --- メニュー ---
  function openMenu(returnTo: HTMLButtonElement | null) {
    menuReturnRef.current = returnTo;
    setMenuOpen(true);
  }
  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    const target = menuReturnRef.current;
    // ボタンが「メンバーを足す」から「立て替えを記録」に変わっていても戻せるよう、描き直した後に
    window.requestAnimationFrame(() => {
      if (target && target.isConnected) target.focus();
      else menuButtonRef.current?.focus();
    });
  }, []);

  const addMember = useCallback(
    (name: string): boolean => {
      if (!ledger || ledger.members.length >= MAX_MEMBERS) return false;
      return saveLedger({ ...ledger, members: [...ledger.members, { id: newId("m"), name }] });
    },
    [ledger],
  );

  // --- 記録のシート ---
  /** 新しく記録するときは fresh（直していた記録を外す）。直すときは false */
  function openSheet(fresh = true) {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
    if (fresh) {
      editReturnRef.current = null;
      setEditingId(null);
    }
    setSheet("open");
  }
  const closeSheet = useCallback((discard: boolean) => {
    if (discard) setFormKey((k) => k + 1);
    setSheet("closing");
    if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => {
      closeTimer.current = null;
      setSheet((s) => (s === "closing" ? "closed" : s));
      setEditingId(null);
      // 直していたなら、その行へ。行が無くなっていれば「立て替えを記録」へ
      const target = editReturnRef.current;
      editReturnRef.current = null;
      if (target && target.isConnected) target.focus();
      else recordButtonRef.current?.focus();
    }, SHEET_CLOSE_MS);
  }, []);

  /** 帳簿を書き込み、変わった記録の行と返す組の金額に目印を付ける。書けなければ false */
  const commit = useCallback(
    (next: Ledger, expenseId: string): boolean => {
      const before = new Map(transfers.map((t) => [transferKey(t), t.amount]));
      if (!saveLedger(next)) return false;
      const after = settle(computeBalances(next.members, next.expenses));
      const changed = new Set(after.filter((t) => before.get(transferKey(t)) !== t.amount).map(transferKey));
      setHighlight({ expenseId, transferKeys: changed });
      if (highlightTimer.current !== null) window.clearTimeout(highlightTimer.current);
      highlightTimer.current = window.setTimeout(() => setHighlight(NO_HIGHLIGHT), HIGHLIGHT_MS);
      return true;
    },
    [transfers],
  );

  const saveExpense = useCallback(
    (draft: ExpenseDraft): boolean => {
      if (!ledger) return false;
      const expense = { id: newId("e"), ...draft, createdAt: Date.now() };
      const next: Ledger = { ...ledger, expenses: [...ledger.expenses, expense] };
      if (!commit(next, expense.id)) return false;
      setFormKey((k) => k + 1);
      showToast("記録しました");
      return true;
    },
    [ledger, commit, showToast],
  );

  // --- 記録を直す・消す・元に戻す ---
  /** PC で、直す形のフォームを閉じて「立て替えを記録」に戻す */
  const endDesktopEdit = useCallback(() => {
    const target = editReturnRef.current;
    editReturnRef.current = null;
    dirtyRef.current = false;
    setEditingId(null);
    setFormKey((k) => k + 1);
    window.requestAnimationFrame(() => {
      if (target && target.isConnected) target.focus();
    });
  }, []);

  /** 直す形のフォームを閉じる（スマホはシート、PC は右の列） */
  const endEdit = useCallback(() => {
    if (isDesktop) endDesktopEdit();
    else closeSheet(false);
  }, [isDesktop, endDesktopEdit, closeSheet]);

  const beginEdit = useCallback((id: string, button: HTMLButtonElement | null) => {
    editReturnRef.current = button;
    dirtyRef.current = false;
    setEditingId(id);
    setFormKey((k) => k + 1);
  }, []);

  function openEdit(id: string, button: HTMLButtonElement) {
    if (!expenses.some((e) => e.id === id)) return;
    if (isDesktop) {
      // 入力の途中なら、捨てるかを確かめてから切り替える
      if (dirtyRef.current) {
        pendingRef.current = () => beginEdit(id, button);
        setConfirming(true);
      } else {
        beginEdit(id, button);
      }
      return;
    }
    beginEdit(id, button);
    openSheet(false);
  }

  const saveEdit = useCallback(
    (draft: ExpenseDraft): boolean => {
      if (!ledger || editingId === null) return false;
      const nextExpenses = replaceExpense(ledger.expenses, editingId, draft);
      if (nextExpenses === null) {
        // 存在しない記録は、何も変えずにフォームを閉じる
        endEdit();
        return true;
      }
      if (!commit({ ...ledger, expenses: nextExpenses }, editingId)) return false;
      showToast("変更を保存しました");
      endEdit();
      return true;
    },
    [ledger, editingId, commit, showToast, endEdit],
  );

  const undoRemove = useCallback(
    (removed: RemovedExpense) => {
      const current = ledgerRef.current;
      if (!current) return;
      const next: Ledger = { ...current, expenses: restoreExpense(current.expenses, removed) };
      if (commit(next, removed.expense.id)) setToast(null);
    },
    [commit],
  );

  const deleteEditing = useCallback((): boolean => {
    if (!ledger || editingId === null) return false;
    const result = removeExpense(ledger.expenses, editingId);
    if (result === null) {
      endEdit();
      return true;
    }
    if (!saveLedger({ ...ledger, expenses: result.expenses })) return false;
    setToast((t) => ({
      id: (t?.id ?? 0) + 1,
      text: removedMessage(result.removed.expense.memo),
      duration: UNDO_MS,
      action: { label: "元に戻す", onClick: () => undoRemove(result.removed) },
    }));
    endEdit();
    return true;
  }, [ledger, editingId, endEdit, undoRemove]);

  const saveFromSheet = useCallback(
    (draft: ExpenseDraft): boolean => {
      if (editingId !== null) return saveEdit(draft);
      const ok = saveExpense(draft);
      if (ok) closeSheet(false);
      return ok;
    },
    [editingId, saveEdit, saveExpense, closeSheet],
  );

  const onDesktopDirty = useCallback((dirty: boolean) => {
    dirtyRef.current = dirty;
  }, []);

  function closeDesktopEdit() {
    if (dirtyRef.current) {
      pendingRef.current = endDesktopEdit;
      setConfirming(true);
    } else {
      endDesktopEdit();
    }
  }

  return (
    <div className="app">
      <div className="page">
        <TopBar onMenu={() => openMenu(menuButtonRef.current)} menuButtonRef={menuButtonRef} showLabel={isDesktop} />

        <header className="intro">
          {ledger === null ? (
            <>
              <h1 className="group-name">
                <span className="skel skel-title" aria-hidden="true" />
                <span className="visually-hidden">読み込み中…</span>
              </h1>
              <p className="summary">
                <span className="skel skel-summary" aria-hidden="true" />
              </p>
            </>
          ) : (
            <>
              <h1 className="group-name">{ledger.groupName}</h1>
              <p className="summary">{summaryText(members.length, expenses)}</p>
            </>
          )}
        </header>

        <div className={isDesktop && canRecord ? "columns" : "columns columns-single"}>
          <div className="main-col">
            <SettlementPanel
              state={settlementState}
              members={members}
              changedKeys={highlight.transferKeys}
              onAddMember={() => openMenu(addMemberPanelRef.current)}
              addMemberRef={addMemberPanelRef}
            />
            <BalancePanel members={ledger === null ? null : members} balances={balances} />
            <ExpenseListPanel
              members={ledger === null ? null : members}
              expenses={expenses}
              highlightId={highlight.expenseId}
              onSelect={openEdit}
            />
          </div>

          {isDesktop && ledger !== null && canRecord && (
            <aside className="form-col">
              <section className="block form-block" aria-labelledby="record-panel-title">
                <ExpenseForm
                  key={`${formKey}-${editing?.id ?? "new"}`}
                  members={members}
                  expense={editing ?? undefined}
                  onSave={editing ? saveEdit : saveExpense}
                  onDelete={deleteEditing}
                  onDirtyChange={onDesktopDirty}
                  focusOnMount={false}
                  header={
                    editing ? (
                      <div className="sheet-header">
                        <h2 id="record-panel-title" className="block-title form-title">
                          記録を直す
                        </h2>
                        <button type="button" className="button-secondary" onClick={closeDesktopEdit}>
                          閉じる
                        </button>
                      </div>
                    ) : (
                      <h2 id="record-panel-title" className="block-title form-title">
                        立て替えを記録
                      </h2>
                    )
                  }
                />
              </section>
            </aside>
          )}
        </div>
      </div>

      <div className="action-bar">
        <div className="action-bar-inner">
          {ledger !== null && !canRecord ? (
            <button
              type="button"
              className="button-primary button-block"
              onClick={(e) => openMenu(e.currentTarget)}
            >
              メンバーを足す
            </button>
          ) : (
            <button
              ref={recordButtonRef}
              type="button"
              className="button-primary button-block"
              aria-haspopup="dialog"
              disabled={ledger === null}
              onClick={() => openSheet()}
            >
              立て替えを記録
            </button>
          )}
        </div>
      </div>

      {!isDesktop && (
        <RecordSheet
          phase={canRecord ? sheet : "closed"}
          members={members}
          formKey={formKey}
          expense={editing}
          onDelete={deleteEditing}
          onSave={saveFromSheet}
          onClose={closeSheet}
        />
      )}
      <MenuSheet open={menuOpen} members={members} onClose={closeMenu} onAddMember={addMember} />
      <ConfirmDiscard
        open={isDesktop && confirming}
        onKeep={() => {
          pendingRef.current = null;
          setConfirming(false);
        }}
        onDiscard={() => {
          const action = pendingRef.current;
          pendingRef.current = null;
          setConfirming(false);
          action?.();
        }}
      />
      <Toast message={toast} onDone={hideToast} />
    </div>
  );
}
