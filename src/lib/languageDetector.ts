import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "./types";

const STORAGE_KEY = "clauseguard_language";

export function detectLanguage(): SupportedLanguage {
  if (typeof window !== "undefined") {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && isSupported(stored)) return stored;
    const browserLang = window.navigator.language.split("-")[0];
    if (isSupported(browserLang)) return browserLang;
  }
  return "en";
}

export function detectFromVoice(bcp47: string): SupportedLanguage {
  const lang = bcp47.split("-")[0];
  return isSupported(lang) ? lang : "en";
}

export function setExplicitLanguage(lang: SupportedLanguage): void {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, lang);
  }
}

function isSupported(lang: string): lang is SupportedLanguage {
  return (SUPPORTED_LANGUAGES as readonly string[]).includes(lang);
}
