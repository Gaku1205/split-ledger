"use client";

import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { parseAmount } from "@/lib/amount";
import { perPersonText, toIsoDate } from "@/lib/format";
import type { Member } from "@/lib/types";
import { AlertIcon, CheckIcon } from "./Icons";
import { PersonMark } from "./PersonMark";

export type ExpenseDraft = {
  amount: number;
  memo: string;
  paidBy: string;
  sharedBy: string[];
  date: string;
};

type Props = {
  members: readonly Member[];
  /** 記録する。保存できなければ false */
  onSave: (draft: ExpenseDraft) => boolean;
  onDirtyChange: (dirty: boolean) => void;
  /** 出たときに金額の欄にフォーカスを移す（シートのとき） */
  focusOnMount: boolean;
  /** シートのときは見出しと「閉じる」を出す */
  header?: ReactNode;
};

type Errors = { amount?: string; paidBy?: string; sharedBy?: string };

const PAID_BY_ERROR = "払った人を選んでください。";
const SHARED_BY_ERROR = "誰の分かを1人以上選んでください。";

export function ExpenseForm({ members, onSave, onDirtyChange, focusOnMount, header }: Props) {
  const uid = useId();
  const [initialDate] = useState(() => toIsoDate(new Date()));
  const [amount, setAmount] = useState("");
  const [memo, setMemo] = useState("");
  const [paidBy, setPaidBy] = useState<string | null>(null);
  /** "all" は「全員」（あとで足したメンバーも含む） */
  const [shared, setShared] = useState<string[] | "all">("all");
  const [date, setDate] = useState(initialDate);
  const [errors, setErrors] = useState<Errors>({});
  const [saveFailed, setSaveFailed] = useState(false);

  const amountRef = useRef<HTMLInputElement>(null);
  const paidRef = useRef<HTMLInputElement>(null);
  const sharedRef = useRef<HTMLInputElement>(null);

  const sharedIds = shared === "all" ? members.map((m) => m.id) : members.filter((m) => shared.includes(m.id)).map((m) => m.id);
  const allShared = sharedIds.length === members.length && members.length > 0;
  const dirty = amount !== "" || memo !== "" || paidBy !== null || !allShared || date !== initialDate;

  useEffect(() => {
    onDirtyChange(dirty);
  }, [dirty, onDirtyChange]);

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  useEffect(() => {
    if (focusOnMount) amountRef.current?.focus();
  }, [focusOnMount]);

  function toggleShared(id: string) {
    const next = sharedIds.includes(id) ? sharedIds.filter((s) => s !== id) : [...sharedIds, id];
    setShared(next);
    if (next.length > 0) setErrors((e) => ({ ...e, sharedBy: undefined }));
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const parsed = parseAmount(amount);
    const next: Errors = {};
    if (!parsed.ok) next.amount = parsed.error;
    if (paidBy === null || !members.some((m) => m.id === paidBy)) next.paidBy = PAID_BY_ERROR;
    if (sharedIds.length === 0) next.sharedBy = SHARED_BY_ERROR;
    setErrors(next);
    if (next.amount) return amountRef.current?.focus();
    if (next.paidBy) return paidRef.current?.focus();
    if (next.sharedBy) return sharedRef.current?.focus();
    if (!parsed.ok || paidBy === null) return;
    const ok = onSave({
      amount: parsed.value,
      memo: memo.trim(),
      paidBy,
      sharedBy: sharedIds,
      date: date === "" ? toIsoDate(new Date()) : date,
    });
    setSaveFailed(!ok);
  }

  const ids = {
    amount: `${uid}-amount`,
    amountError: `${uid}-amount-error`,
    memo: `${uid}-memo`,
    paidLabel: `${uid}-paid`,
    paidError: `${uid}-paid-error`,
    sharedLabel: `${uid}-shared`,
    sharedError: `${uid}-shared-error`,
    date: `${uid}-date`,
  };

  return (
    <form className="expense-form" noValidate onSubmit={onSubmit}>
      {header}
      <div className="field">
        <label className="label" htmlFor={ids.amount}>
          金額
        </label>
        <div className="amount-wrap">
          <input
            ref={amountRef}
            id={ids.amount}
            className={errors.amount ? "input input-amount input-error" : "input input-amount"}
            type="text"
            inputMode="numeric"
            name="amount"
            autoComplete="off"
            placeholder="1,200"
            value={amount}
            aria-invalid={errors.amount ? true : undefined}
            aria-describedby={errors.amount ? ids.amountError : undefined}
            onChange={(e) => {
              setAmount(e.target.value);
              if (errors.amount) setErrors((x) => ({ ...x, amount: undefined }));
            }}
          />
          <span className="amount-unit" aria-hidden="true">
            円
          </span>
        </div>
        {errors.amount && <FieldError id={ids.amountError} text={errors.amount} />}
      </div>

      <div className="field">
        <label className="label" htmlFor={ids.memo}>
          何に
        </label>
        <input
          id={ids.memo}
          className="input"
          type="text"
          name="memo"
          autoComplete="off"
          placeholder="スーパー、電気代…"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />
      </div>

      <div
        className="field"
        role="radiogroup"
        aria-labelledby={ids.paidLabel}
        aria-invalid={errors.paidBy ? true : undefined}
        aria-describedby={errors.paidBy ? ids.paidError : undefined}
      >
        <div className="label-row">
          <span className="label" id={ids.paidLabel}>
            払った人
          </span>
        </div>
        <div className="chips">
          {members.map((m, index) => (
            <label key={m.id} className={paidBy === m.id ? "chip chip-paid is-selected" : "chip chip-paid"}>
              <input
                ref={index === 0 ? paidRef : undefined}
                className="chip-input"
                type="radio"
                name="paidBy"
                value={m.id}
                checked={paidBy === m.id}
                onChange={() => {
                  setPaidBy(m.id);
                  setErrors((x) => ({ ...x, paidBy: undefined }));
                }}
              />
              <PersonMark name={m.name} index={index} size={24} />
              <span className="chip-name">{m.name}</span>
              {paidBy === m.id && <CheckIcon />}
            </label>
          ))}
        </div>
        {errors.paidBy && <FieldError id={ids.paidError} text={errors.paidBy} />}
      </div>

      <div
        className="field"
        role="group"
        aria-labelledby={ids.sharedLabel}
        aria-describedby={errors.sharedBy ? ids.sharedError : undefined}
      >
        <div className="label-row">
          <span className="label" id={ids.sharedLabel}>
            誰の分
          </span>
          <button
            type="button"
            className="text-button"
            onClick={() => {
              if (allShared) {
                setShared([]);
              } else {
                setShared("all");
                setErrors((x) => ({ ...x, sharedBy: undefined }));
              }
            }}
          >
            {allShared ? "全員はずす" : "全員"}
          </button>
        </div>
        <div className="chips">
          {members.map((m, index) => {
            const on = sharedIds.includes(m.id);
            return (
              <label key={m.id} className={on ? "chip chip-shared is-selected" : "chip chip-shared"}>
                <input
                  ref={index === 0 ? sharedRef : undefined}
                  className="chip-input"
                  type="checkbox"
                  name="sharedBy"
                  value={m.id}
                  checked={on}
                  aria-invalid={errors.sharedBy ? true : undefined}
                  onChange={() => toggleShared(m.id)}
                />
                <PersonMark name={m.name} index={index} size={24} />
                <span className="chip-name">{m.name}</span>
                {on && <CheckIcon />}
              </label>
            );
          })}
        </div>
        {errors.sharedBy && <FieldError id={ids.sharedError} text={errors.sharedBy} />}
      </div>

      <div className="field">
        <label className="label" htmlFor={ids.date}>
          日付
        </label>
        <input
          id={ids.date}
          className="input input-date"
          type="date"
          name="date"
          autoComplete="off"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
      </div>

      <p className="per-person" aria-live="polite">
        {perPersonText(amount, sharedIds.length)}
      </p>

      {saveFailed && (
        <p className="notice-error" role="alert">
          記録を保存できませんでした。入れた内容はそのままです。もう一度「記録する」を押してください。
        </p>
      )}

      <button type="submit" className="button-primary button-block">
        記録する
      </button>
    </form>
  );
}

function FieldError({ id, text }: { id: string; text: string }) {
  return (
    <p className="field-error" id={id}>
      <AlertIcon />
      <span>{text}</span>
    </p>
  );
}
