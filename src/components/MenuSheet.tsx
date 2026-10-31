"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { MEMBER_LIMIT_TEXT, validateMemberName } from "@/lib/members";
import { MAX_MEMBERS, type Member } from "@/lib/types";
import { AlertIcon } from "./Icons";
import { Dialog } from "./Dialog";
import { PersonMark } from "./PersonMark";

type Props = {
  open: boolean;
  members: readonly Member[];
  onClose: () => void;
  /** メンバーを足す。保存できなければ false */
  onAddMember: (name: string) => boolean;
};

/** メニューのシート（メンバーを足す） */
export function MenuSheet({ open, members, onClose, onAddMember }: Props) {
  return (
    <Dialog open={open} onRequestClose={onClose} className="sheet menu-sheet" labelledBy="menu-title">
      {open && <MenuBody members={members} onClose={onClose} onAddMember={onAddMember} />}
    </Dialog>
  );
}

function MenuBody({ members, onClose, onAddMember }: Omit<Props, "open">) {
  const uid = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const full = members.length >= MAX_MEMBERS;

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const result = validateMemberName(name, members);
    if (!result.ok) {
      setError(result.error);
      inputRef.current?.focus();
      return;
    }
    setError(null);
    const ok = onAddMember(result.name);
    setSaveFailed(!ok);
    if (ok) setName("");
    inputRef.current?.focus();
  }

  const errorId = `${uid}-error`;
  const limitId = `${uid}-limit`;

  return (
    <div className="sheet-body menu-body">
      <div className="sheet-header">
        <h2 id="menu-title" className="sheet-title">
          メニュー
        </h2>
        <button ref={closeRef} type="button" className="button-secondary" onClick={onClose}>
          閉じる
        </button>
      </div>

      <section className="menu-section" aria-labelledby={`${uid}-members`}>
        <div className="menu-heading">
          <h3 id={`${uid}-members`} className="menu-title">
            メンバー
          </h3>
          <span className="menu-count">
            {members.length}人／{MAX_MEMBERS}人まで
          </span>
        </div>

        <form className="member-form" noValidate onSubmit={onSubmit}>
          <label className="label" htmlFor={`${uid}-name`}>
            名前
          </label>
          <div className="member-form-row">
            <input
              ref={inputRef}
              id={`${uid}-name`}
              className={error ? "input input-error" : "input"}
              type="text"
              name="memberName"
              autoComplete="off"
              enterKeyHint="done"
              value={name}
              disabled={full}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? errorId : full ? limitId : undefined}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError(null);
              }}
            />
            <button type="submit" className="button-secondary button-add" disabled={full}>
              足す
            </button>
          </div>
          {error && (
            <p className="field-error" id={errorId}>
              <AlertIcon />
              <span>{error}</span>
            </p>
          )}
          {full && (
            <p className="field-note" id={limitId}>
              {MEMBER_LIMIT_TEXT}
            </p>
          )}
          {saveFailed && (
            <p className="notice-error" role="alert">
              メンバーを保存できませんでした。入れた名前はそのままです。もう一度「足す」を押してください。
            </p>
          )}
        </form>

        {members.length === 0 ? (
          <p className="empty">まだメンバーがいません。</p>
        ) : (
          <ul className="member-list">
            {members.map((m, index) => (
              <li key={m.id} className="member-row">
                <PersonMark name={m.name} index={index} size={28} />
                <span className="member-name">{m.name}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
