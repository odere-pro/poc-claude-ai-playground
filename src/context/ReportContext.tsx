"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import type {
  ClauseEvent,
  Jurisdiction,
  SavedSummary,
  SummaryEvent,
  SupportedLanguage,
} from "@/lib/types";

export type Phase = "upload" | "analyzing" | "results" | "incomplete";

export type VoiceState = "idle" | "listening" | "processing" | "speaking";

export interface AppState {
  readonly report: {
    readonly clauses: readonly ClauseEvent[];
    readonly summary: SummaryEvent | null;
  } | null;
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

const DEFAULT_PERMIT_BY_JURISDICTION: Record<Jurisdiction, string> = {
  nl: "gvva",
  se: "arbetstillstand",
};

export const initialState: AppState = {
  report: null,
  jurisdiction: "nl",
  permitType: DEFAULT_PERMIT_BY_JURISDICTION.nl,
  detectedLanguage: "en",
  phase: "upload",
  highlightedClauseId: null,
  expandedClauses: new Set(),
  voiceState: "idle",
  lastSpokenText: "",
  savedSummary: null,
};

export type Action =
  | { type: "SET_JURISDICTION"; jurisdiction: Jurisdiction }
  | { type: "SET_PERMIT_TYPE"; permitType: string }
  | { type: "SET_LANGUAGE"; language: SupportedLanguage }
  | { type: "START_ANALYSIS" }
  | { type: "RECEIVE_CLAUSES_BATCH"; clauses: readonly ClauseEvent[] }
  | { type: "FINALIZE_REPORT"; summary: SummaryEvent }
  | { type: "STREAM_ERROR" }
  | { type: "SET_VOICE_STATE"; voiceState: VoiceState }
  | { type: "SET_LAST_SPOKEN"; text: string }
  | { type: "HIGHLIGHT_CLAUSE"; id: string | null }
  | { type: "TOGGLE_EXPANDER"; id: string }
  | { type: "LOAD_SAVED_SUMMARY"; saved: SavedSummary }
  | { type: "CLEAR_SAVED_SUMMARY" }
  | { type: "RESET" };

function mergeClauses(
  existing: readonly ClauseEvent[],
  incoming: readonly ClauseEvent[],
): readonly ClauseEvent[] {
  // Idempotent by clause.id — replaces if id already present, otherwise appends.
  const byId = new Map<string, ClauseEvent>();
  for (const c of existing) byId.set(c.id, c);
  for (const c of incoming) byId.set(c.id, c);
  return Array.from(byId.values());
}

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_JURISDICTION":
      if (action.jurisdiction === state.jurisdiction) return state;
      return {
        ...state,
        jurisdiction: action.jurisdiction,
        permitType: DEFAULT_PERMIT_BY_JURISDICTION[action.jurisdiction],
      };

    case "SET_PERMIT_TYPE":
      return { ...state, permitType: action.permitType };

    case "SET_LANGUAGE":
      return { ...state, detectedLanguage: action.language };

    case "START_ANALYSIS":
      // Phase guard: only valid from upload (or from a previous failed run).
      if (state.phase !== "upload" && state.phase !== "incomplete") return state;
      return {
        ...state,
        phase: "analyzing",
        report: { clauses: [], summary: null },
        highlightedClauseId: null,
        expandedClauses: new Set(),
      };

    case "RECEIVE_CLAUSES_BATCH":
      // Phase guard: only valid mid-analysis or post-results (late chunks).
      if (state.phase !== "analyzing" && state.phase !== "results") return state;
      if (action.clauses.length === 0) return state;
      return {
        ...state,
        report: {
          clauses: mergeClauses(state.report?.clauses ?? [], action.clauses),
          summary: state.report?.summary ?? null,
        },
      };

    case "FINALIZE_REPORT": {
      if (state.phase !== "analyzing") return state;
      const saved: SavedSummary = {
        summary: action.summary,
        jurisdiction: state.jurisdiction,
        permitType: state.permitType,
        detectedLanguage: state.detectedLanguage,
        savedAt: Date.now(),
      };
      return {
        ...state,
        phase: "results",
        report: {
          clauses: state.report?.clauses ?? [],
          summary: action.summary,
        },
        savedSummary: saved,
      };
    }

    case "STREAM_ERROR":
      if (state.phase !== "analyzing") return state;
      return { ...state, phase: "incomplete" };

    case "SET_VOICE_STATE":
      return { ...state, voiceState: action.voiceState };

    case "SET_LAST_SPOKEN":
      return { ...state, lastSpokenText: action.text };

    case "HIGHLIGHT_CLAUSE":
      return { ...state, highlightedClauseId: action.id };

    case "TOGGLE_EXPANDER": {
      const next = new Set(state.expandedClauses);
      if (next.has(action.id)) next.delete(action.id);
      else next.add(action.id);
      return { ...state, expandedClauses: next };
    }

    case "LOAD_SAVED_SUMMARY":
      return {
        ...state,
        savedSummary: action.saved,
        jurisdiction: action.saved.jurisdiction,
        permitType: action.saved.permitType,
        detectedLanguage: action.saved.detectedLanguage,
      };

    case "CLEAR_SAVED_SUMMARY":
      return { ...state, savedSummary: null };

    case "RESET":
      return {
        ...initialState,
        // Preserve the user's language preference across resets.
        detectedLanguage: state.detectedLanguage,
      };

    default: {
      const _exhaustive: never = action;
      return state;
    }
  }
}

const STORAGE_KEY = "clauseguard.savedSummary";
const STORAGE_TTL_MS = 24 * 60 * 60 * 1000;

interface ContextValue {
  state: AppState;
  dispatch: Dispatch<Action>;
}

const ReportContext = createContext<ContextValue | null>(null);

export function ReportProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Hydrate savedSummary from localStorage on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as SavedSummary;
      if (Date.now() - parsed.savedAt > STORAGE_TTL_MS) {
        window.localStorage.removeItem(STORAGE_KEY);
        return;
      }
      dispatch({ type: "LOAD_SAVED_SUMMARY", saved: parsed });
    } catch {
      // Corrupted entry — ignore and clear.
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  // Persist savedSummary on change. Summary-only — never raw clause text.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (state.savedSummary === null) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state.savedSummary));
  }, [state.savedSummary]);

  const value = useMemo<ContextValue>(() => ({ state, dispatch }), [state]);
  return <ReportContext.Provider value={value}>{children}</ReportContext.Provider>;
}

export function useReport(): ContextValue {
  const ctx = useContext(ReportContext);
  if (!ctx) throw new Error("useReport must be used inside <ReportProvider>");
  return ctx;
}
