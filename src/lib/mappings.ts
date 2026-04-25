import type { ClauseStatus, Jurisdiction, SupportedLanguage } from "./types";

const PERMIT_DEFAULTS: Record<Jurisdiction, string> = {
  nl: "gvva",
  se: "arbetstillstand",
};

export function defaultPermitFor(jurisdiction: Jurisdiction): string {
  return PERMIT_DEFAULTS[jurisdiction];
}

/**
 * Map our domain status to the variant prop the shadcn/ui Badge primitive
 * accepts. Keeps domain ↔ UI mapping in one spot so atoms stay dumb.
 */
export function toBadgeVariant(
  status: ClauseStatus,
): "default" | "destructive" | "secondary" | "outline" {
  switch (status) {
    case "illegal":
      return "destructive";
    case "exploitative":
    case "permit_conflict":
      return "default";
    case "compliant":
      return "secondary";
    case "unchecked":
      return "outline";
  }
}

/**
 * Coerce a SupportedLanguage to a BCP-47 tag the browser SpeechSynthesis
 * API recognizes. Most synthesizers want a region — pick a sensible one.
 */
export function toTtsLang(lang: SupportedLanguage): string {
  const map: Record<SupportedLanguage, string> = {
    en: "en-US",
    nl: "nl-NL",
    sv: "sv-SE",
    uk: "uk-UA",
    ru: "ru-RU",
    ar: "ar-SA",
    tr: "tr-TR",
    es: "es-ES",
    pt: "pt-PT",
    pl: "pl-PL",
    de: "de-DE",
    fr: "fr-FR",
  };
  return map[lang];
}
