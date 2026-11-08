"use client";

import { useSyncExternalStore } from "react";

/**
 * Estado do modo foco (Pomodoro) no navegador. O tempo em si continua sendo uma
 * Sessão de trabalho comum no banco; aqui fica só a contagem regressiva e a fase.
 * Persistido em localStorage para sobreviver a recarregar a página.
 */
export type FocusState = {
  phase: "focus" | "break";
  taskId: string;
  taskTitle: string;
  minutes: number;
  breakMinutes: number;
  startedAt: number;
  endsAt: number;
  minimized?: boolean;
};

const KEY = "remind.focus.v1"; // gitleaks:allow (chave de localStorage, não é segredo)
const EVENT = "remind:focus";

export const FOCUS_PRESETS = [
  { minutes: 25, breakMinutes: 5, label: "25 min" },
  { minutes: 50, breakMinutes: 10, label: "50 min" }
] as const;

function read(): FocusState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FocusState;
    if (!parsed || typeof parsed.endsAt !== "number" || typeof parsed.taskId !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

let cache: FocusState | null = null;
let cacheRaw: string | null | undefined;

function snapshot() {
  if (typeof window === "undefined") return null;
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(KEY);
  } catch {
    raw = null;
  }
  if (raw !== cacheRaw) {
    cacheRaw = raw;
    cache = read();
  }
  return cache;
}

export function setFocusState(next: FocusState | null) {
  try {
    if (next) window.localStorage.setItem(KEY, JSON.stringify(next));
    else window.localStorage.removeItem(KEY);
  } catch {
    // Sem storage (aba privada): o foco ainda funciona até recarregar.
    cacheRaw = undefined;
    cache = next;
  }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(callback: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === KEY) callback();
  };
  window.addEventListener(EVENT, callback);
  window.addEventListener("storage", onStorage);
  return () => {
    window.removeEventListener(EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}

export function useFocusState() {
  return useSyncExternalStore(subscribe, snapshot, () => null);
}

export function formatCountdown(ms: number) {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}
