"use client";

import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import {
  MEMBER_LIMIT_TEXT,
  isMemberInExpenses,
  memberInUseMessage,
  validateGroupName,
  validateMemberName,
  validateMemberRename,
} from "@/lib/members";
import { MAX_MEMBERS, type Expense, type Member } from "@/lib/types";
import { AlertIcon } from "./Icons";
import { Dialog } from "./Dialog";
import { PersonMark } from "./PersonMark";
import { ConfirmDialog } from "./RecordSheet";

type Props = {
  open: boolean;
  groupName: string;
  members: readonly Member[];
  expenses: readonly Expense[];
  onClose: () => void;
  /** メンバーを足す。保存できなければ false */
  onAddMember: (name: string) => boolean;
  /** グループ名を変える。保存できなければ false */
  onRenameGroup: (name: string) => boolean;
  /** メンバーの名前を変える。保存できなければ false */
  onRenameMember: (id: string, name: string) => boolean;
  /** メンバーを削除する。保存できなければ false */
  onRemoveMember: (id: string) => boolean;
};

/** メニューのシート（グループ名・メンバーの追加／名前の変更／削除） */
export function MenuSheet({ open, onClose, ...rest }: Props) {
  return (
    <Dialog open={open} onRequestClose={onClose} className="sheet menu-sheet" labelledBy="menu-title">
      {open && <MenuBody onClose={onClose} {...rest} />}
    </Dialog>
  );
}

function MenuBody({
  groupName,
  members,
  expenses,
  onClose,
  onAddMember,
  onRenameGroup,
  onRenameMember,
  onRemoveMember,
}: Omit<Props, "open">) {
  const uid = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const groupInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saveFailed, setSaveFailed] = useState(false);
  const full = members.length >= MAX_MEMBERS;

  const [group, setGroup] = useState(groupName);
  const [groupError, setGroupError] = useState<string | null>(null);
  const [groupSaveFailed, setGroupSaveFailed] = useState(false);

  /** 名前を直している行 */
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState("");
  const [renameError, setRenameError] = useState<string | null>(null);
  const [renameSaveFailed, setRenameSaveFailed] = useState(false);
  /** 削除できない理由を出している行 */
  const [blocked, setBlocked] = useState<{ id: string; text: string } | null>(null);
  /** 削除の確認を出している行 */
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [removeFailed, setRemoveFailed] = useState(false);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  function focusRowButton(id: string, kind: "rename" | "remove") {
    window.requestAnimationFrame(() => {
      listRef.current?.querySelector<HTMLElement>(`[data-${kind}="${CSS.escape(id)}"]`)?.focus();
    });
  }

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

  function onGroupSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const result = validateGroupName(group, groupName);
    if (!result.ok) {
      setGroupError(result.error);
      setGroupSaveFailed(false);
      groupInputRef.current?.focus();
      return;
    }
    setGroupError(null);
    if (!result.changed) {
      // 今と同じ名前：何も起きない（欄の前後の空白だけ整える）
      setGroup(result.name);
      setGroupSaveFailed(false);
      return;
    }
    const ok = onRenameGroup(result.name);
    setGroupSaveFailed(!ok);
    if (ok) setGroup(result.name);
    groupInputRef.current?.focus();
  }

  function startRename(m: Member) {
    setRenamingId(m.id);
    setRenameText(m.name);
    setRenameError(null);
    setRenameSaveFailed(false);
    setBlocked(null);
    setRemoveFailed(false);
  }

  function cancelRename() {
    const id = renamingId;
    setRenamingId(null);
    setRenameError(null);
    setRenameSaveFailed(false);
    if (id) focusRowButton(id, "rename");
  }

  function onRenameSubmit(e: FormEvent<HTMLFormElement>, id: string) {
    e.preventDefault();
    const result = validateMemberRename(renameText, members, id);
    if (!result.ok) {
      setRenameError(result.error);
      setRenameSaveFailed(false);
      return;
    }
    if (!result.changed) {
      // 変更なし：保存せずに閉じる
      cancelRename();
      return;
    }
    if (!onRenameMember(id, result.name)) {
      setRenameError(null);
      setRenameSaveFailed(true);
      return;
    }
    cancelRename();
  }

  function requestRemove(m: Member) {
    setRemoveFailed(false);
    if (isMemberInExpenses(expenses, m.id)) {
      setBlocked({ id: m.id, text: memberInUseMessage(m.name) });
      return;
    }
    setBlocked(null);
    setConfirmId(m.id);
  }

  function keepMember() {
    const id = confirmId;
    setConfirmId(null);
    if (id) focusRowButton(id, "remove");
  }

  function removeConfirmed() {
    const id = confirmId;
    if (!id) return;
    setConfirmId(null);
    if (onRemoveMember(id)) {
      setRemoveFailed(false);
      window.requestAnimationFrame(() => closeRef.current?.focus());
    } else {
      setRemoveFailed(true);
      focusRowButton(id, "remove");
    }
  }

  const errorId = `${uid}-error`;
  const limitId = `${uid}-limit`;
  const groupErrorId = `${uid}-group-error`;
  const confirmMember = confirmId === null ? null : (members.find((m) => m.id === confirmId) ?? null);

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

      <section className="menu-section" aria-labelledby={`${uid}-group`}>
        <div className="menu-heading">
          <h3 id={`${uid}-group`} className="menu-title">
            グループ
          </h3>
        </div>
        <form className="member-form" noValidate onSubmit={onGroupSubmit}>
          <label className="label" htmlFor={`${uid}-group-name`}>
            グループ名
          </label>
          <div className="member-form-row">
            <input
              ref={groupInputRef}
              id={`${uid}-group-name`}
              className={groupError ? "input input-error" : "input"}
              type="text"
              name="groupName"
              autoComplete="off"
              enterKeyHint="done"
              value={group}
              aria-invalid={groupError ? true : undefined}
              aria-describedby={groupError ? groupErrorId : undefined}
              onChange={(e) => {
                setGroup(e.target.value);
                if (groupError) setGroupError(null);
              }}
            />
            <button type="submit" className="button-secondary button-add">
              変える
            </button>
          </div>
          {groupError && (
            <p className="field-error" id={groupErrorId}>
              <AlertIcon />
              <span>{groupError}</span>
            </p>
          )}
          {groupSaveFailed && (
            <p className="notice-error" role="alert">
              グループ名を保存できませんでした。入れた名前はそのままです。もう一度「変える」を押してください。
            </p>
          )}
        </form>
      </section>

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
          <ul className="member-list" ref={listRef}>
            {members.map((m, index) =>
              renamingId === m.id ? (
                <li key={m.id} className="member-item">
                  <form className="member-edit" noValidate onSubmit={(e) => onRenameSubmit(e, m.id)}>
                    <div className="member-edit-row">
                      <PersonMark name={m.name} index={index} size={28} />
                      <input
                        className={renameError ? "input input-error" : "input"}
                        type="text"
                        name="renameMember"
                        aria-label={`${m.name}の新しい名前`}
                        autoComplete="off"
                        enterKeyHint="done"
                        autoFocus
                        value={renameText}
                        aria-invalid={renameError ? true : undefined}
                        aria-describedby={renameError ? `${uid}-rename-error` : undefined}
                        onChange={(e) => {
                          setRenameText(e.target.value);
                          if (renameError) setRenameError(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") {
                            // Esc はメニューを閉じず、この行の編集だけをやめる
                            e.preventDefault();
                            e.stopPropagation();
                            cancelRename();
                          }
                        }}
                      />
                    </div>
                    {renameError && (
                      <p className="field-error" id={`${uid}-rename-error`}>
                        <AlertIcon />
                        <span>{renameError}</span>
                      </p>
                    )}
                    {renameSaveFailed && (
                      <p className="notice-error" role="alert">
                        メンバーを保存できませんでした。入れた名前はそのままです。もう一度「保存」を押してください。
                      </p>
                    )}
                    <div className="member-edit-actions">
                      <button type="submit" className="button-secondary">
                        保存
                      </button>
                      <button type="button" className="button-secondary" onClick={cancelRename}>
                        やめる
                      </button>
                    </div>
                  </form>
                </li>
              ) : (
                <li key={m.id} className="member-item">
                  <div className="member-row">
                    <PersonMark name={m.name} index={index} size={28} />
                    <span className="member-name">{m.name}</span>
                    <button
                      type="button"
                      className="text-button member-action"
                      data-rename={m.id}
                      aria-label={`${m.name}の名前を変える`}
                      onClick={() => startRename(m)}
                    >
                      名前を変える
                    </button>
                    <button
                      type="button"
                      className="text-button member-action"
                      data-remove={m.id}
                      aria-label={`${m.name}を削除`}
                      onClick={() => requestRemove(m)}
                    >
                      削除
                    </button>
                  </div>
                  {blocked?.id === m.id && (
                    <p className="field-note member-note" role="status">
                      {blocked.text}
                    </p>
                  )}
                </li>
              ),
            )}
          </ul>
        )}
        {removeFailed && (
          <p className="notice-error member-remove-failed" role="alert">
            メンバーを削除できませんでした。もう一度「削除」を押してください。
          </p>
        )}
      </section>

      <ConfirmDialog
        open={confirmMember !== null}
        title={`${confirmMember?.name ?? ""}さんを削除しますか？`}
        keepLabel="やめる"
        confirmLabel="削除する"
        onKeep={keepMember}
        onConfirm={removeConfirmed}
      />
    </div>
  );
}
