"use client";

import * as React from "react";

export type Lang = "EN" | "ES" | "FR" | "PT";

export const LANG_NAMES: Record<Lang, string> = {
  EN: "English",
  ES: "Spanish",
  FR: "French",
  PT: "Portuguese",
};

/** The target language picked in the hero, shared with later homepage sections. */
let current: Lang = "EN";
const listeners = new Set<() => void>();

export function setHeroLanguage(lang: Lang) {
  current = lang;
  listeners.forEach((listener) => listener());
}

export function useHeroLanguage() {
  return React.useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => current,
    () => "EN" as Lang,
  );
}
