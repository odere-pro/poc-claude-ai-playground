import { describe, it, expect } from "vitest";
import { reducer, initialState } from "./ReportContext";
import type {
  Action,
  AppState,
  ClauseEvent,
  ClauseStatus,
  SavedSummary,
  SummaryEvent,
} from "@/lib/types";

function clause(id: string, status: ClauseStatus = "illegal"): ClauseEvent {
  return {
    type: "clause",
    id,
    title: `Clause ${id}`,
    status,
    originalText: `text for ${id}`,
    explanation: `explanation for ${id}`,
    citation: null,
    action: null,
    permitConflict: null,
  };
}

function summary(): SummaryEvent {
  return {
    type: "summary",
    jurisdiction: "nl",
    permitType: "gvva",
    detectedLanguage: "en",
    totalClauses: 6,
    illegalCount: 2,
    exploitativeCount: 0,
    permitConflictCount: 0,
    uncheckedCount: 2,
    rights: [],
  };
}

const start: Action = { type: "START_ANALYSIS" };

describe("reducer — phase transitions", () => {
  it("START_ANALYSIS moves upload → analyzing and seeds empty report", () => {
    const next = reducer(initialState, start);
    expect(next.phase).toBe("analyzing");
    expect(next.report).toEqual({ clauses: [], summary: null });
  });

  it("FINALIZE_REPORT moves analyzing → results", () => {
    const s1 = reducer(initialState, start);
    const s2 = reducer(s1, { type: "FINALIZE_REPORT", payload: summary() });
    expect(s2.phase).toBe("results");
    expect(s2.report?.summary).not.toBeNull();
  });

  it("FINALIZE_REPORT is rejected outside analyzing phase", () => {
    const next = reducer(initialState, {
      type: "FINALIZE_REPORT",
      payload: summary(),
    });
    expect(next.phase).toBe("upload");
  });

  it("STREAM_ERROR moves to incomplete", () => {
    const s1 = reducer(initialState, start);
    const s2 = reducer(s1, { type: "STREAM_ERROR" });
    expect(s2.phase).toBe("incomplete");
  });

  it("RESET preserves detected language but wipes everything else", () => {
    const s1: AppState = { ...initialState, detectedLanguage: "uk" };
    const s2 = reducer(s1, start);
    const s3 = reducer(s2, { type: "RESET" });
    expect(s3.phase).toBe("upload");
    expect(s3.report).toBeNull();
    expect(s3.detectedLanguage).toBe("uk");
  });
});

describe("reducer — RECEIVE_CLAUSES_BATCH", () => {
  it("rejects batches in upload phase", () => {
    const next = reducer(initialState, {
      type: "RECEIVE_CLAUSES_BATCH",
      payload: [clause("c1")],
    });
    expect(next.report).toBeNull();
  });

  it("appends clauses in analyzing phase", () => {
    const s1 = reducer(initialState, start);
    const s2 = reducer(s1, {
      type: "RECEIVE_CLAUSES_BATCH",
      payload: [clause("c1"), clause("c2")],
    });
    expect(s2.report?.clauses).toHaveLength(2);
  });

  it("is idempotent by clause id", () => {
    const s1 = reducer(initialState, start);
    const c = clause("c1");
    const s2 = reducer(s1, { type: "RECEIVE_CLAUSES_BATCH", payload: [c] });
    const s3 = reducer(s2, { type: "RECEIVE_CLAUSES_BATCH", payload: [c] });
    expect(s3.report?.clauses).toHaveLength(1);
  });

  it("updates existing clause when batch redelivers it with new fields", () => {
    const s1 = reducer(initialState, start);
    const s2 = reducer(s1, {
      type: "RECEIVE_CLAUSES_BATCH",
      payload: [clause("c1", "unchecked")],
    });
    const s3 = reducer(s2, {
      type: "RECEIVE_CLAUSES_BATCH",
      payload: [clause("c1", "illegal")],
    });
    const updated = s3.report?.clauses.find((c) => c.id === "c1");
    expect(updated?.status).toBe("illegal");
  });
});

describe("reducer — jurisdiction & permit", () => {
  it("SET_JURISDICTION nl → se also resets permit to arbetstillstand", () => {
    const next = reducer(initialState, {
      type: "SET_JURISDICTION",
      payload: "se",
    });
    expect(next.jurisdiction).toBe("se");
    expect(next.permitType).toBe("arbetstillstand");
  });

  it("SET_JURISDICTION se → nl resets permit to gvva", () => {
    const seState: AppState = {
      ...initialState,
      jurisdiction: "se",
      permitType: "arbetstillstand",
    };
    const next = reducer(seState, {
      type: "SET_JURISDICTION",
      payload: "nl",
    });
    expect(next.permitType).toBe("gvva");
  });

  it("SET_PERMIT_TYPE updates permitType only", () => {
    const next = reducer(initialState, {
      type: "SET_PERMIT_TYPE",
      payload: "kennismigrant",
    });
    expect(next.permitType).toBe("kennismigrant");
    expect(next.jurisdiction).toBe("nl");
  });
});

describe("reducer — voice + UI state", () => {
  it("SET_VOICE_STATE updates voice state", () => {
    const next = reducer(initialState, {
      type: "SET_VOICE_STATE",
      payload: "listening",
    });
    expect(next.voiceState).toBe("listening");
  });

  it("HIGHLIGHT_CLAUSE updates highlightedClauseId", () => {
    const next = reducer(initialState, {
      type: "HIGHLIGHT_CLAUSE",
      payload: "c1",
    });
    expect(next.highlightedClauseId).toBe("c1");
  });

  it("TOGGLE_EXPANDER toggles membership in the expanded set", () => {
    const s1 = reducer(initialState, {
      type: "TOGGLE_EXPANDER",
      payload: "c1",
    });
    expect(s1.expandedClauses.has("c1")).toBe(true);
    const s2 = reducer(s1, { type: "TOGGLE_EXPANDER", payload: "c1" });
    expect(s2.expandedClauses.has("c1")).toBe(false);
  });

  it("SET_LAST_SPOKEN stores the most recently spoken text", () => {
    const next = reducer(initialState, {
      type: "SET_LAST_SPOKEN",
      payload: "Reading clause 1.",
    });
    expect(next.lastSpokenText).toBe("Reading clause 1.");
  });
});

describe("reducer — saved summary", () => {
  function saved(): SavedSummary {
    return {
      reportSummary: summary(),
      clauseIds: ["c1"],
      clauseStatuses: ["illegal"],
      jurisdiction: "nl",
      permitType: "gvva",
      detectedLanguage: "uk",
      timestamp: Date.now(),
    };
  }

  it("LOAD_SAVED_SUMMARY does NOT repopulate full report", () => {
    const next = reducer(initialState, {
      type: "LOAD_SAVED_SUMMARY",
      payload: saved(),
    });
    expect(next.savedSummary).not.toBeNull();
    expect(next.report).toBeNull();
  });

  it("CLEAR_SAVED_SUMMARY drops the savedSummary reference", () => {
    const s1 = reducer(initialState, {
      type: "LOAD_SAVED_SUMMARY",
      payload: saved(),
    });
    const s2 = reducer(s1, { type: "CLEAR_SAVED_SUMMARY" });
    expect(s2.savedSummary).toBeNull();
  });
});
