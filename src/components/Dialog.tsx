"use client";

import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";

type Props = {
  open: boolean;
  /** Esc と幕を押したとき */
  onRequestClose: () => void;
  className: string;
  labelledBy: string;
  role?: "dialog" | "alertdialog";
  children: ReactNode;
};

/**
 * ネイティブの <dialog> を showModal で開く。
 * Esc（cancel）と幕を押したときは閉じずに onRequestClose を呼ぶ（閉じるかは呼んだ側が決める）。
 */
export function Dialog({ open, onRequestClose, className, labelledBy, role, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const openRef = useRef(open);
  useEffect(() => {
    openRef.current = open;
  }, [open]);

  // cancel が止められないブラウザ（Chrome 120以降）では Esc で勝手に閉じる。
  // 呼んだ側がまだ開いているつもりなら開き直す（閉じるかは呼んだ側が決める）
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const onClose = () => {
      if (openRef.current && !dialog.open) dialog.showModal();
    };
    dialog.addEventListener("close", onClose);
    return () => dialog.removeEventListener("close", onClose);
  }, []);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const onCancel = (e: Event) => {
      e.preventDefault();
      onRequestClose();
    };
    dialog.addEventListener("cancel", onCancel);
    return () => dialog.removeEventListener("cancel", onCancel);
  }, [onRequestClose]);

  function onClick(e: MouseEvent<HTMLDialogElement>) {
    // 中身は内側の要素が受けるので、<dialog> 自身が押されたのは幕の所
    if (e.target === e.currentTarget) onRequestClose();
  }

  // 幕を押したとき。キーでは Esc（cancel）で同じことができる
  return (
    <dialog ref={ref} className={className} aria-labelledby={labelledBy} role={role} onClick={onClick}>
      {children}
    </dialog>
  );
}
