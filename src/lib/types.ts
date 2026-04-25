// Single source of truth for Clauseguard shared types.
// UI components, API routes, lib modules, and tests all import from here.

export const SUPPORTED_LANGUAGES = ["nl", "en", "uk", "ar", "pl", "sv"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export type Jurisdiction = "nl" | "se";

export type ClauseStatus =
  | "illegal"
  | "exploitative"
  | "compliant"
  | "permit_conflict"
  | "unchecked";

export interface Citation {
  readonly article: string;
  readonly law: string;
  readonly description: string;
  readonly source: string;
}

export interface PermitConflict {
  readonly permitId: string;
  readonly violation: string;
  readonly condition: string;
}

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

export interface RightItem {
  readonly text: string;
  readonly citation: Citation;
}

export interface SummaryEvent {
  readonly type: "summary";
  readonly jurisdiction: Jurisdiction;
  readonly permitType: string;
  readonly detectedLanguage: string;
  readonly totalClauses: number;
  readonly illegalCount: number;
  readonly exploitativeCount: number;
  readonly permitConflictCount: number;
  readonly uncheckedCount: number;
  readonly rights: readonly RightItem[];
}

export interface ErrorEvent {
  readonly type: "error";
}

export type StreamEvent = ClauseEvent | SummaryEvent | ErrorEvent;

// Ruleset shapes (loaded via dynamic import from data/*.json).

export interface Rule {
  readonly id: string;
  readonly clauseType: string;
  readonly article: string;
  readonly law: string;
  readonly description: string;
  readonly conditions?: readonly string[];
  readonly illegalIf?: readonly string[];
  readonly exploitativeIf?: readonly string[];
  readonly source: string;
}

export interface Ruleset {
  readonly jurisdiction: Jurisdiction;
  readonly source: string;
  readonly rules: readonly Rule[];
}

export interface PermitConditions {
  readonly maxHoursPerWeek: number | null;
  readonly sectorRestrictions: string;
  readonly locationRestrictions: string;
  readonly salaryMinimum: string;
}

export interface Permit {
  readonly id: string;
  readonly name: string;
  readonly authority: string;
  readonly conditions: PermitConditions;
  readonly source: string;
}

export interface PermitCategories {
  readonly jurisdiction: Jurisdiction;
  readonly source: string;
  readonly permits: readonly Permit[];
}

export interface SupportContact {
  readonly name: string;
  readonly url: string;
  readonly description: string;
}

export interface RightsSummary {
  readonly jurisdiction: Jurisdiction;
  readonly language: string;
  readonly rights: readonly RightItem[];
  readonly support: SupportContact;
}

// API request/response shapes.

export interface AnalyzeRequest {
  readonly contractText: string;
  readonly permitType: string;
  readonly jurisdiction: Jurisdiction;
  readonly detectedLanguage: string;
  readonly customerId?: string;
}

export interface TranscribeResponse {
  readonly transcript: string;
  readonly detectedLanguage: string;
}

export interface VoiceClauseRef {
  readonly id: string;
  readonly title: string;
  readonly status: ClauseStatus;
}

export interface VoiceReportContext {
  readonly clauses: readonly VoiceClauseRef[];
  readonly currentIndex: number;
  readonly jurisdiction: Jurisdiction;
  readonly detectedLanguage: string;
  readonly illegalCount: number;
}

export interface VoiceCommandRequest {
  readonly transcript: string;
  readonly reportContext: VoiceReportContext;
}

export type VoiceIntent =
  | { readonly intent: "read_flags" }
  | { readonly intent: "explain_clause"; readonly clauseId: string }
  | { readonly intent: "read_rights" }
  | { readonly intent: "navigate_next" }
  | { readonly intent: "navigate_prev" }
  | { readonly intent: "navigate_to"; readonly topic: string }
  | { readonly intent: "repeat" }
  | { readonly intent: "what_can_i_do" }
  | { readonly intent: "download" }
  | { readonly intent: "new_contract" }
  | {
      readonly intent: "switch_jurisdiction";
      readonly jurisdiction: Jurisdiction;
    }
  | { readonly intent: "unknown" };

export interface VoiceCommandResponse {
  readonly intent: VoiceIntent;
  readonly responseText: string;
  readonly language: string;
}

// Client state (React Context + useReducer).

export type Phase = "upload" | "analyzing" | "results" | "incomplete";
export type VoiceState = "idle" | "listening" | "processing" | "speaking";

export interface Report {
  readonly clauses: readonly ClauseEvent[];
  readonly summary: SummaryEvent | null;
}

export interface SavedSummary {
  readonly reportSummary: SummaryEvent;
  readonly clauseIds: readonly string[];
  readonly clauseStatuses: readonly ClauseStatus[];
  readonly jurisdiction: Jurisdiction;
  readonly permitType: string;
  readonly detectedLanguage: SupportedLanguage;
  readonly timestamp: number;
}

export interface AppState {
  readonly report: Report | null;
  readonly jurisdiction: Jurisdiction;
  readonly permitType: string;
  readonly detectedLanguage: SupportedLanguage;
  readonly phase: Phase;
  readonly highlightedClauseId: string | null;
  readonly expandedClauses: ReadonlySet<string>;
  readonly voiceState: VoiceState;
  readonly lastSpokenText: string;
  readonly savedSummary: SavedSummary | null;
}

export type Action =
  | { type: "SET_JURISDICTION"; payload: Jurisdiction }
  | { type: "SET_PERMIT_TYPE"; payload: string }
  | { type: "SET_LANGUAGE"; payload: SupportedLanguage }
  | { type: "START_ANALYSIS" }
  | { type: "RECEIVE_CLAUSES_BATCH"; payload: readonly ClauseEvent[] }
  | { type: "FINALIZE_REPORT"; payload: SummaryEvent }
  | { type: "STREAM_ERROR" }
  | { type: "SET_VOICE_STATE"; payload: VoiceState }
  | { type: "SET_LAST_SPOKEN"; payload: string }
  | { type: "HIGHLIGHT_CLAUSE"; payload: string | null }
  | { type: "TOGGLE_EXPANDER"; payload: string }
  | { type: "LOAD_SAVED_SUMMARY"; payload: SavedSummary }
  | { type: "CLEAR_SAVED_SUMMARY" }
  | { type: "RESET" };
