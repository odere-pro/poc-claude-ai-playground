import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "./types";

const STORAGE_KEY = "clauseguard.lang";
const DEFAULT_LANGUAGE: SupportedLanguage = "en";

function isSupported(lang: string): lang is SupportedLanguage {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(lang);
}

/**
 * Reduce a BCP-47 tag to its primary subtag and check support.
 * "uk-UA" → "uk", "fr-CA" → "fr", "zh-Hans-CN" → "zh".
 */
export function normalizeLanguage(tag: string | null | undefined): SupportedLanguage | null {
  if (!tag) return null;
  const primary = tag.toLowerCase().split(/[-_]/)[0];
  return isSupported(primary) ? primary : null;
}

/**
 * Detection cascade for the *initial* language:
 *   1. Explicitly persisted choice in localStorage
 *   2. `navigator.language`
 *   3. fallback "en"
 *
 * Voice transcripts override via `detectFromVoice` — the BCP-47 tag returned
 * by the STT provider takes precedence over the cascade once the user speaks.
 */
export function detectLanguage(): SupportedLanguage {
  if (typeof window === "undefined") return DEFAULT_LANGUAGE;

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const fromStorage = normalizeLanguage(stored);
    if (fromStorage) return fromStorage;
  } catch {
    // Storage unavailable — fall through to navigator.
  }

  const fromNav = normalizeLanguage(window.navigator.language);
  if (fromNav) return fromNav;

  return DEFAULT_LANGUAGE;
}

export function detectFromVoice(bcp47: string): SupportedLanguage {
  return normalizeLanguage(bcp47) ?? DEFAULT_LANGUAGE;
}

export function setExplicitLanguage(lang: SupportedLanguage): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // Storage unavailable — no-op (the explicit choice will be lost on reload).
  }
}

export { SUPPORTED_LANGUAGES };
