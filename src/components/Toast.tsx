"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ToastMessage = {
  id: number;
  text: string;
  /** 出しておく時間（ミリ秒）。無ければ3秒 */
  duration?: number;
  /** 知らせに付けるボタン（「元に戻す」） */
  action?: { label: string; onClick: () => void };
};

type Props = {
  message: ToastMessage | null;
  onDone: () => void;
};

const DEFAULT_DURATION_MS = 3000;

const LEAVE_MS = 160;

/** 知らせ（「記録しました」）。乗せている間とフォーカスがある間は消さない */
export function Toast({ message, onDone }: Props) {
  return (
    <div className="toast-region" aria-live="polite">
      {message && (
        <ToastItem
          key={message.id}
          text={message.text}
          action={message.action}
          onDone={onDone}
          duration={message.duration ?? DEFAULT_DURATION_MS}
        />
      )}
    </div>
  );
}

function ToastItem({
  text,
  action,
  onDone,
  duration,
}: {
  text: string;
  action: ToastMessage["action"];
  onDone: () => void;
  duration: number;
}) {
  const [leaving, setLeaving] = useState(false);
  const timer = useRef<number | null>(null);

  const clear = useCallback(() => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const start = useCallback(() => {
    clear();
    timer.current = window.setTimeout(() => {
      setLeaving(true);
      timer.current = window.setTimeout(onDone, LEAVE_MS);
    }, duration);
  }, [clear, duration, onDone]);

  useEffect(() => {
    start();
    return clear;
  }, [start, clear]);

  const hold = () => {
    clear();
    setLeaving(false);
  };

  return (
    <div
      className={leaving ? "toast is-leaving" : "toast"}
      onMouseEnter={hold}
      onMouseLeave={start}
      onFocus={hold}
      onBlur={start}
    >
      <span>{text}</span>
      {action && (
        <button type="button" className="toast-action" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}
