import { describe, it, expect } from "vitest";
import { initialState, reducer, type AppState } from "./ReportContext";
import type { ClauseEvent, SummaryEvent } from "@/lib/types";

const makeClause = (id: string, status: ClauseEvent["status"] = "compliant"): ClauseEvent => ({
  type: "clause",
  id,
  title: `Clause ${id}`,
  status,
  originalText: "",
  explanation: "",
  citation: null,
  action: null,
  permitConflict: null,
});

const makeSummary = (overrides: Partial<SummaryEvent> = {}): SummaryEvent => ({
  type: "summary",
  jurisdiction: "nl",
  permitType: "gvva",
  detectedLanguage: "en",
  totalClauses: 0,
  illegalCount: 0,
  exploitativeCount: 0,
  permitConflictCount: 0,
  uncheckedCount: 0,
  compliantCount: 0,
  rights: [],
  ...overrides,
});

describe("reducer — jurisdiction & permit", () => {
  it("SET_JURISDICTION resets permit to the new jurisdiction's default", () => {
    const next = reducer(initialState, { type: "SET_JURISDICTION", jurisdiction: "se" });
    expect(next.jurisdiction).toBe("se");
    expect(next.permitType).toBe("arbetstillstand");
  });

  it("SET_JURISDICTION is a no-op when already on that jurisdiction", () => {
    const next = reducer(initialState, { type: "SET_JURISDICTION", jurisdiction: "nl" });
    expect(next).toBe(initialState);
  });

  it("SET_PERMIT_TYPE updates only the permit", () => {
    const next = reducer(initialState, { type: "SET_PERMIT_TYPE", permitType: "kennismigrant" });
    expect(next.permitType).toBe("kennismigrant");
    expect(next.jurisdiction).toBe(initialState.jurisdiction);
  });

  it("SET_LANGUAGE updates language", () => {
    const next = reducer(initialState, { type: "SET_LANGUAGE", language: "uk" });
    expect(next.detectedLanguage).toBe("uk");
  });
});

describe("reducer — analysis lifecycle", () => {
  it("START_ANALYSIS moves upload → analyzing and seeds an empty report", () => {
    const next = reducer(initialState, { type: "START_ANALYSIS" });
    expect(next.phase).toBe("analyzing");
    expect(next.report).toEqual({ clauses: [], summary: null });
  });

  it("START_ANALYSIS is rejected outside the upload/incomplete phases", () => {
    const analyzing: AppState = { ...initialState, phase: "analyzing" };
    const next = reducer(analyzing, { type: "START_ANALYSIS" });
    expect(next).toBe(analyzing);
  });

  it("START_ANALYSIS is allowed from incomplete (retry)", () => {
    const incomplete: AppState = { ...initialState, phase: "incomplete" };
    const next = reducer(incomplete, { type: "START_ANALYSIS" });
    expect(next.phase).toBe("analyzing");
  });

  it("RECEIVE_CLAUSES_BATCH appends clauses while analyzing", () => {
    const s1 = reducer(initialState, { type: "START_ANALYSIS" });
    const s2 = reducer(s1, {
      type: "RECEIVE_CLAUSES_BATCH",
      clauses: [makeClause("a"), makeClause("b")],
    });
    expect(s2.report?.clauses.map((c) => c.id)).toEqual(["a", "b"]);
  });

  it("RECEIVE_CLAUSES_BATCH is idempotent by clause.id", () => {
    const s1 = reducer(initialState, { type: "START_ANALYSIS" });
    const s2 = reducer(s1, { type: "RECEIVE_CLAUSES_BATCH", clauses: [makeClause("a")] });
    const s3 = reducer(s2, {
      type: "RECEIVE_CLAUSES_BATCH",
      clauses: [makeClause("a", "illegal")],
    });
    expect(s3.report?.clauses).toHaveLength(1);
    expect(s3.report?.clauses[0].status).toBe("illegal");
  });

  it("RECEIVE_CLAUSES_BATCH is rejected outside analyzing/results", () => {
    const next = reducer(initialState, {
      type: "RECEIVE_CLAUSES_BATCH",
      clauses: [makeClause("a")],
    });
    expect(next).toBe(initialState);
  });

  it("FINALIZE_REPORT moves analyzing → results and persists savedSummary", () => {
    const s1 = reducer(initialState, { type: "START_ANALYSIS" });
    const summary = makeSummary({ totalClauses: 6, illegalCount: 2 });
    const s2 = reducer(s1, { type: "FINALIZE_REPORT", summary });
    expect(s2.phase).toBe("results");
    expect(s2.report?.summary).toEqual(summary);
    expect(s2.savedSummary?.summary).toEqual(summary);
  });

  it("STREAM_ERROR moves analyzing → incomplete; rejected otherwise", () => {
    const s1 = reducer(initialState, { type: "START_ANALYSIS" });
    const s2 = reducer(s1, { type: "STREAM_ERROR" });
    expect(s2.phase).toBe("incomplete");
    const s3 = reducer(s2, { type: "STREAM_ERROR" });
    expect(s3).toBe(s2);
  });
});

describe("reducer — UI state", () => {
  it("HIGHLIGHT_CLAUSE sets and clears the highlighted id", () => {
    const a = reducer(initialState, { type: "HIGHLIGHT_CLAUSE", id: "x" });
    expect(a.highlightedClauseId).toBe("x");
    const b = reducer(a, { type: "HIGHLIGHT_CLAUSE", id: null });
    expect(b.highlightedClauseId).toBe(null);
  });

  it("TOGGLE_EXPANDER toggles a clause id in the expanded set", () => {
    const a = reducer(initialState, { type: "TOGGLE_EXPANDER", id: "c1" });
    expect(a.expandedClauses.has("c1")).toBe(true);
    const b = reducer(a, { type: "TOGGLE_EXPANDER", id: "c1" });
    expect(b.expandedClauses.has("c1")).toBe(false);
  });

  it("SET_VOICE_STATE updates voice state", () => {
    const next = reducer(initialState, { type: "SET_VOICE_STATE", voiceState: "listening" });
    expect(next.voiceState).toBe("listening");
  });

  it("SET_LAST_SPOKEN stores the last spoken text", () => {
    const next = reducer(initialState, { type: "SET_LAST_SPOKEN", text: "hello" });
    expect(next.lastSpokenText).toBe("hello");
  });
});

describe("reducer — persistence", () => {
  it("LOAD_SAVED_SUMMARY restores jurisdiction/permit/language from saved blob", () => {
    const next = reducer(initialState, {
      type: "LOAD_SAVED_SUMMARY",
      saved: {
        summary: makeSummary({ jurisdiction: "se", permitType: "arbetstillstand" }),
        jurisdiction: "se",
        permitType: "arbetstillstand",
        detectedLanguage: "sv",
        savedAt: Date.now(),
      },
    });
    expect(next.jurisdiction).toBe("se");
    expect(next.permitType).toBe("arbetstillstand");
    expect(next.detectedLanguage).toBe("sv");
  });

  it("CLEAR_SAVED_SUMMARY removes the saved blob", () => {
    const seeded: AppState = {
      ...initialState,
      savedSummary: {
        summary: makeSummary(),
        jurisdiction: "nl",
        permitType: "gvva",
        detectedLanguage: "en",
        savedAt: Date.now(),
      },
    };
    const next = reducer(seeded, { type: "CLEAR_SAVED_SUMMARY" });
    expect(next.savedSummary).toBeNull();
  });

  it("RESET returns to initial state but preserves detectedLanguage", () => {
    const seeded: AppState = {
      ...initialState,
      detectedLanguage: "uk",
      phase: "results",
      report: { clauses: [makeClause("a")], summary: makeSummary() },
    };
    const next = reducer(seeded, { type: "RESET" });
    expect(next.phase).toBe("upload");
    expect(next.report).toBeNull();
    expect(next.detectedLanguage).toBe("uk");
  });
});
