"use client";

import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import type { Action, AppState, ClauseStatus, SavedSummary } from "@/lib/types";

const STORAGE_KEY = "clauseguard_session";
const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export const initialState: AppState = {
  report: null,
  jurisdiction: "nl",
  permitType: "gvva",
  detectedLanguage: "en",
  phase: "upload",
  highlightedClauseId: null,
  expandedClauses: new Set<string>(),
  voiceState: "idle",
  lastSpokenText: "",
  savedSummary: null,
};

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_JURISDICTION":
      return {
        ...state,
        jurisdiction: action.payload,
        permitType: action.payload === "se" ? "arbetstillstand" : "gvva",
      };
    case "SET_PERMIT_TYPE":
      return { ...state, permitType: action.payload };
    case "SET_LANGUAGE":
      return { ...state, detectedLanguage: action.payload };
    case "START_ANALYSIS":
      return {
        ...state,
        phase: "analyzing",
        report: { clauses: [], summary: null },
      };
    case "RECEIVE_CLAUSES_BATCH": {
      if (state.phase !== "analyzing" && state.phase !== "results") {
        return state;
      }
      const existing = state.report?.clauses ?? [];
      const byId = new Map(existing.map((c) => [c.id, c]));
      for (const c of action.payload) byId.set(c.id, c);
      return {
        ...state,
        report: {
          clauses: Array.from(byId.values()),
          summary: state.report?.summary ?? null,
        },
      };
    }
    case "FINALIZE_REPORT":
      if (state.phase !== "analyzing") return state;
      return {
        ...state,
        phase: "results",
        report: state.report
          ? { ...state.report, summary: action.payload }
          : { clauses: [], summary: action.payload },
        detectedLanguage:
          (action.payload.detectedLanguage as AppState["detectedLanguage"]) ??
          state.detectedLanguage,
      };
    case "STREAM_ERROR":
      return { ...state, phase: "incomplete" };
    case "SET_VOICE_STATE":
      return { ...state, voiceState: action.payload };
    case "SET_LAST_SPOKEN":
      return { ...state, lastSpokenText: action.payload };
    case "HIGHLIGHT_CLAUSE":
      return { ...state, highlightedClauseId: action.payload };
    case "TOGGLE_EXPANDER": {
      const next = new Set(state.expandedClauses);
      if (next.has(action.payload)) next.delete(action.payload);
      else next.add(action.payload);
      return { ...state, expandedClauses: next };
    }
    case "LOAD_SAVED_SUMMARY":
      return { ...state, savedSummary: action.payload };
    case "CLEAR_SAVED_SUMMARY":
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(STORAGE_KEY);
      }
      return { ...state, savedSummary: null };
    case "RESET":
      return {
        ...initialState,
        detectedLanguage: state.detectedLanguage,
      };
  }
}

const StateCtx = createContext<AppState | null>(null);
const DispatchCtx = createContext<Dispatch<Action> | null>(null);

export function ReportProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Load any saved summary on mount; expire after 24h.
  useEffect(() => {
    if (typeof window === "undefined") return;
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      return;
    }
    if (!raw) return;

    let saved: SavedSummary;
    try {
      saved = JSON.parse(raw) as SavedSummary;
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }

    if (typeof saved.timestamp !== "number" || Date.now() - saved.timestamp > SESSION_MAX_AGE_MS) {
      window.localStorage.removeItem(STORAGE_KEY);
      return;
    }

    dispatch({ type: "LOAD_SAVED_SUMMARY", payload: saved });
  }, []);

  // Persist summary-only on report finalization. Never store originalText,
  // explanation, or citation — only IDs and statuses, which are enough to
  // hint "you ran this contract before" without retaining its content.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!state.report?.summary) return;

    const summary: SavedSummary = {
      reportSummary: state.report.summary,
      clauseIds: state.report.clauses.map((c) => c.id),
      clauseStatuses: state.report.clauses.map((c) => c.status as ClauseStatus),
      jurisdiction: state.jurisdiction,
      permitType: state.permitType,
      detectedLanguage: state.detectedLanguage,
      timestamp: Date.now(),
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(summary));
    } catch {
      // Storage failure is non-fatal — analysis continues to display.
    }
  }, [state.report?.summary, state]);

  return (
    <StateCtx.Provider value={state}>
      <DispatchCtx.Provider value={dispatch}>{children}</DispatchCtx.Provider>
    </StateCtx.Provider>
  );
}

export function useReport(): AppState {
  const s = useContext(StateCtx);
  if (!s) throw new Error("useReport must be used inside ReportProvider");
  return s;
}

export function useReportDispatch(): Dispatch<Action> {
  const d = useContext(DispatchCtx);
  if (!d) throw new Error("useReportDispatch must be used inside ReportProvider");
  return d;
}
