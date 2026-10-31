"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type ToastMessage = { id: number; text: string };

type Props = {
  message: ToastMessage | null;
  onDone: () => void;
  /** 出しておく時間（ミリ秒） */
  duration?: number;
};

const LEAVE_MS = 160;

/** 知らせ（「記録しました」）。乗せている間とフォーカスがある間は消さない */
export function Toast({ message, onDone, duration = 3000 }: Props) {
  return (
    <div className="toast-region" aria-live="polite">
      {message && <ToastItem key={message.id} text={message.text} onDone={onDone} duration={duration} />}
    </div>
  );
}

function ToastItem({ text, onDone, duration }: { text: string; onDone: () => void; duration: number }) {
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
      {text}
    </div>
  );
}
