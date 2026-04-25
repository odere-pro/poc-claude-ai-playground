// Domain types for Clauseguard. Public type surface — every API and UI module
// imports from here. Keep this file the single source of truth.

export type Jurisdiction = "nl" | "se";

// BCP-47 language tags supported by the analyzer + voice features.
export const SUPPORTED_LANGUAGES = [
  "en",
  "nl",
  "sv",
  "uk",
  "ru",
  "ar",
  "tr",
  "es",
  "pt",
  "pl",
  "de",
  "fr",
] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export type ClauseStatus =
  | "illegal"
  | "exploitative"
  | "compliant"
  | "permit_conflict"
  | "unchecked";

export interface Citation {
  /** Article identifier as written in the source ruleset, e.g. "BW 7:653". */
  readonly article: string;
  /** Short human label, e.g. "Non-compete clause". */
  readonly label: string;
  /** Must be exactly "{jurisdiction}-labor-law.json" — authenticity check. */
  readonly source: string;
}

export interface PermitConflict {
  readonly permitType: string;
  readonly reason: string;
}

export interface RightsItem {
  readonly title: string;
  readonly description: string;
  readonly citation: Citation | null;
  readonly contact?: {
    readonly name: string;
    readonly url?: string;
    readonly phone?: string;
  };
}

// --- Ruleset shapes (data/{jurisdiction}-labor-law.json, etc.) ---

export interface Rule {
  readonly id: string;
  readonly article: string;
  readonly label: string;
  readonly summary: string;
  readonly tags: readonly string[];
}

export interface Permit {
  readonly id: string;
  readonly label: string;
  readonly default?: boolean;
  readonly forbiddenClauseTags: readonly string[];
}

export interface Ruleset {
  readonly jurisdiction: Jurisdiction;
  readonly source: string; // "{jurisdiction}-labor-law.json"
  readonly rules: readonly Rule[];
}

export interface PermitCatalog {
  readonly jurisdiction: Jurisdiction;
  readonly permits: readonly Permit[];
}

export interface RightsSummary {
  readonly jurisdiction: Jurisdiction;
  readonly union: {
    readonly name: string;
    readonly url: string;
    readonly phone?: string;
  };
  readonly rights: readonly RightsItem[];
}

// --- SSE payloads emitted by /api/analyze ---

export interface ClauseEvent {
  readonly type: "clause";
  readonly id: string;
  readonly title: string;
  readonly status: ClauseStatus;
  readonly originalText: string;
  readonly explanation: string;
  readonly citation: Citation | null;
  readonly action: string | null;
  readonly permitConflict: PermitConflict | null;
}

export interface SummaryEvent {
  readonly type: "summary";
  readonly jurisdiction: Jurisdiction;
  readonly permitType: string;
  readonly detectedLanguage: SupportedLanguage;
  readonly totalClauses: number;
  readonly illegalCount: number;
  readonly exploitativeCount: number;
  readonly permitConflictCount: number;
  readonly uncheckedCount: number;
  readonly compliantCount: number;
  readonly rights: readonly RightsItem[];
}

export type StreamEvent = ClauseEvent | SummaryEvent;

// --- API request shapes ---

export interface AnalyzeRequest {
  readonly contractText: string;
  readonly permitType: string;
  readonly jurisdiction: Jurisdiction;
  readonly detectedLanguage: SupportedLanguage;
  readonly customerId?: string;
}

// --- Voice (P1) ---

export interface VoiceReportContext {
  readonly currentClauseId: string | null;
  readonly clauseIds: readonly string[];
  readonly jurisdiction: Jurisdiction;
}

export interface VoiceCommandRequest {
  readonly transcript: string;
  readonly reportContext: VoiceReportContext;
}

export type VoiceIntent =
  | { readonly kind: "read_flags" }
  | { readonly kind: "explain_clause"; readonly clauseId: string }
  | { readonly kind: "read_rights" }
  | { readonly kind: "navigate_next" }
  | { readonly kind: "navigate_prev" }
  | { readonly kind: "navigate_to"; readonly clauseId: string }
  | { readonly kind: "repeat" }
  | { readonly kind: "what_can_i_do" }
  | { readonly kind: "download" }
  | { readonly kind: "new_contract" }
  | { readonly kind: "switch_jurisdiction"; readonly target: Jurisdiction }
  | { readonly kind: "unknown" };

export interface VoiceCommandResponse {
  readonly intent: VoiceIntent;
  readonly responseText: string;
  readonly language: SupportedLanguage;
}

// --- Persistence (localStorage summary-only blob) ---

export interface SavedSummary {
  readonly summary: SummaryEvent;
  readonly jurisdiction: Jurisdiction;
  readonly permitType: string;
  readonly detectedLanguage: SupportedLanguage;
  readonly savedAt: number; // epoch ms
}
