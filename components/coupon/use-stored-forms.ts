"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import { FORM_LENGTH } from "@/lib/stryktips/model";
import type { FormResult, TeamForm } from "@/lib/stryktips/types";

/** Form per match number */
export type StoredForms = Record<number, TeamForm>;

const CHANGE_EVENT = "stryktips:form-change";
const RESULTS = new Set<string>(["", "V", "O", "F"]);

function storageKey(round: number) {
  return `stryktips:form:${round}`;
}

// Storage can be unavailable (private mode, blocked site data); the form then only lives in memory
function read(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch {
    // Ignored, see read()
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function isResults(value: unknown): value is FormResult[] {
  return Array.isArray(value) && value.length === FORM_LENGTH && value.every((r) => RESULTS.has(r));
}

/** Drops anything that isn't a valid form, e.g. from an older version of the app */
function parse(raw: string | null): StoredForms {
  if (!raw) return {};
  try {
    const entries = Object.entries(JSON.parse(raw) as Record<string, Partial<TeamForm> | null>);
    return Object.fromEntries(
      entries.filter((entry): entry is [string, TeamForm] => isResults(entry[1]?.home) && isResults(entry[1]?.away)),
    );
  } catch {
    return {};
  }
}

function subscribe(onChange: () => void) {
  window.addEventListener(CHANGE_EVENT, onChange);
  // Other tabs
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/** The filled-in form for a round, saved in this browser */
export function useStoredForms(round: number) {
  const key = storageKey(round);
  // The raw string is a stable snapshot; the server has no storage and renders empty forms
  const raw = useSyncExternalStore(
    subscribe,
    () => read(key),
    () => null,
  );
  const forms = useMemo(() => parse(raw), [raw]);

  const update = useCallback(
    (change: (forms: StoredForms) => StoredForms) => {
      const next = change(parse(read(key)));
      write(key, Object.keys(next).length ? JSON.stringify(next) : null);
    },
    [key],
  );

  return [forms, update] as const;
}
