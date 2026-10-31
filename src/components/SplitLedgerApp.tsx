"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { computeBalances } from "@/lib/balances";
import { summaryText } from "@/lib/format";
import { newId, saveLedger, useIsDesktop, useLedger } from "@/lib/ledgerStore";
import { settle } from "@/lib/settle";
import { MAX_MEMBERS, type Ledger } from "@/lib/types";
import { BalancePanel } from "./BalancePanel";
import { ExpenseForm, type ExpenseDraft } from "./ExpenseForm";
import { ExpenseListPanel } from "./ExpenseListPanel";
import { MenuSheet } from "./MenuSheet";
import { RecordSheet, type SheetPhase } from "./RecordSheet";
import { SettlementPanel, transferKey, type SettlementState } from "./SettlementPanel";
import { Toast, type ToastMessage } from "./Toast";
import { TopBar } from "./TopBar";

const SHEET_CLOSE_MS = 160;
const HIGHLIGHT_MS = 1600;

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
  function openSheet() {
    if (closeTimer.current !== null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
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
      recordButtonRef.current?.focus();
    }, SHEET_CLOSE_MS);
  }, []);

  const saveExpense = useCallback(
    (draft: ExpenseDraft): boolean => {
      if (!ledger) return false;
      const expense = { id: newId("e"), ...draft, createdAt: Date.now() };
      const next: Ledger = { ...ledger, expenses: [...ledger.expenses, expense] };
      const before = new Map(transfers.map((t) => [transferKey(t), t.amount]));
      if (!saveLedger(next)) return false;
      const after = settle(computeBalances(next.members, next.expenses));
      const changed = new Set(after.filter((t) => before.get(transferKey(t)) !== t.amount).map(transferKey));
      setHighlight({ expenseId: expense.id, transferKeys: changed });
      if (highlightTimer.current !== null) window.clearTimeout(highlightTimer.current);
      highlightTimer.current = window.setTimeout(() => setHighlight(NO_HIGHLIGHT), HIGHLIGHT_MS);
      setFormKey((k) => k + 1);
      showToast("記録しました");
      return true;
    },
    [ledger, transfers, showToast],
  );

  const saveFromSheet = useCallback(
    (draft: ExpenseDraft): boolean => {
      const ok = saveExpense(draft);
      if (ok) closeSheet(false);
      return ok;
    },
    [saveExpense, closeSheet],
  );

  // PC のフォームは閉じないので、入力の途中の確認はフォームの中の beforeunload だけ
  const ignoreDirty = useCallback(() => {}, []);

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
            />
          </div>

          {isDesktop && ledger !== null && canRecord && (
            <aside className="form-col">
              <section className="block form-block" aria-labelledby="record-panel-title">
                <ExpenseForm
                  key={formKey}
                  members={members}
                  onSave={saveExpense}
                  onDirtyChange={ignoreDirty}
                  focusOnMount={false}
                  header={
                    <h2 id="record-panel-title" className="block-title form-title">
                      立て替えを記録
                    </h2>
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
              onClick={openSheet}
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
          onSave={saveFromSheet}
          onClose={closeSheet}
        />
      )}
      <MenuSheet open={menuOpen} members={members} onClose={closeMenu} onAddMember={addMember} />
      <Toast message={toast} onDone={hideToast} />
    </div>
  );
}
