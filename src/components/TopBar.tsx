import type { Ref } from "react";
import { LogoIcon, MenuIcon } from "./Icons";

type Props = {
  onMenu: () => void;
  menuButtonRef: Ref<HTMLButtonElement>;
  /** PC では「メニュー」の文字を出す */
  showLabel: boolean;
};

export function TopBar({ onMenu, menuButtonRef, showLabel }: Props) {
  return (
    <div className="topbar">
      <div className="brand">
        <LogoIcon />
        <span className="brand-name" translate="no">
          split-ledger
        </span>
      </div>
      <button
        ref={menuButtonRef}
        type="button"
        className={showLabel ? "menu-button menu-button-labeled" : "menu-button"}
        aria-label={showLabel ? undefined : "メニュー"}
        aria-haspopup="dialog"
        onClick={onMenu}
      >
        <MenuIcon />
        {showLabel && <span>メニュー</span>}
      </button>
    </div>
  );
}
