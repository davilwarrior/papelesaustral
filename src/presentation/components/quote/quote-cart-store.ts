import { useSyncExternalStore } from "react";

/** Paquetes por código de producto. */
export type QuoteCart = Readonly<Record<string, number>>;

const STORAGE_KEY = "papeles-austral:cotizador:v1";
const EMPTY: QuoteCart = {};
const listeners = new Set<() => void>();
let snapshot: QuoteCart | null = null;

function read(): QuoteCart {
  if (snapshot) return snapshot;
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    snapshot = parsed && typeof parsed === "object" ? parsed : EMPTY;
  } catch {
    snapshot = EMPTY;
  }
  return snapshot!;
}

function write(next: QuoteCart) {
  snapshot = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Modo privado o almacenamiento lleno: el pedido vive solo en memoria.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    snapshot = null;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export const quoteCart = {
  setPacks(code: string, packs: number) {
    const next: Record<string, number> = { ...read() };
    const value = Math.max(0, Math.min(9999, Math.round(packs || 0)));
    if (value > 0) next[code] = value;
    else delete next[code];
    write(next);
  },
  clear() {
    write(EMPTY);
  },
};

/** Pedido guardado en el navegador; vacío durante el render del servidor. */
export function useQuoteCart(): QuoteCart {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}
