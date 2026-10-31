import { useSyncExternalStore } from "react";
import { STORAGE_KEY, parseLedger, serializeLedger } from "./storage";
import { emptyLedger, type Ledger } from "./types";

let cache: Ledger | null = null;
const listeners = new Set<() => void>();

function readFromStorage(): Ledger {
  try {
    return parseLedger(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    // localStorage が使えないときは空として扱う
    return emptyLedger();
  }
}

function notify() {
  for (const l of listeners) l();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== null && e.key !== STORAGE_KEY) return;
    cache = readFromStorage();
    notify();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot(): Ledger {
  if (cache === null) cache = readFromStorage();
  return cache;
}

function getServerSnapshot(): Ledger | null {
  return null;
}

/** 保存された帳簿。読み込む前（サーバーと最初の描画）は null */
export function useLedger(): Ledger | null {
  return useSyncExternalStore<Ledger | null>(subscribe, getSnapshot, getServerSnapshot);
}

/** 帳簿を書き込む。localStorage に書けなければ false（画面の値も変えない） */
export function saveLedger(next: Ledger): boolean {
  try {
    window.localStorage.setItem(STORAGE_KEY, serializeLedger(next));
  } catch {
    return false;
  }
  cache = next;
  notify();
  return true;
}

/** メンバーや記録のid */
export function newId(prefix: string): string {
  const c = globalThis.crypto;
  const body =
    c && typeof c.randomUUID === "function"
      ? c.randomUUID()
      : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}_${body}`;
}

function subscribeMedia(query: string) {
  return (listener: () => void) => {
    const mql = window.matchMedia(query);
    mql.addEventListener("change", listener);
    return () => mql.removeEventListener("change", listener);
  };
}

const DESKTOP_QUERY = "(min-width: 1024px)";
const subscribeDesktop = subscribeMedia(DESKTOP_QUERY);

/** PC（1024px 以上）の幅か。サーバーでは false */
export function useIsDesktop(): boolean {
  return useSyncExternalStore(
    subscribeDesktop,
    () => window.matchMedia(DESKTOP_QUERY).matches,
    () => false,
  );
}
