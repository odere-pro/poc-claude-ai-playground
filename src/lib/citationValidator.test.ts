import { describe, it, expect } from "vitest";
import { enforceCitation, validateClause } from "./citationValidator";
import type { ClauseEvent, Ruleset } from "./types";

const ruleset: Ruleset = {
  jurisdiction: "nl",
  source: "nl-labor-law.json",
  rules: [
    { id: "r1", article: "BW 7:653", label: "Non-compete", summary: "...", tags: [] },
    { id: "r2", article: "BW 7:652", label: "Trial period", summary: "...", tags: [] },
  ],
};

const baseClause = (overrides: Partial<ClauseEvent> = {}): ClauseEvent => ({
  type: "clause",
  id: "c1",
  title: "Non-compete",
  status: "illegal",
  originalText: "",
  explanation: "",
  citation: { article: "BW 7:653", label: "Non-compete", source: "nl-labor-law.json" },
  action: null,
  permitConflict: null,
  ...overrides,
});

describe("validateClause", () => {
  it("accepts a flagged clause with a real citation in the matching ruleset", () => {
    expect(validateClause(baseClause(), ruleset)).toEqual({ ok: true });
  });

  it("flags a missing citation on a non-unchecked clause", () => {
    const clause = baseClause({ citation: null });
    expect(validateClause(clause, ruleset)).toEqual({ ok: false, reason: "missing_citation" });
  });

  it("flags a citation with the wrong source filename", () => {
    const clause = baseClause({
      citation: { article: "BW 7:653", label: "x", source: "se-labor-law.json" },
    });
    expect(validateClause(clause, ruleset)).toEqual({ ok: false, reason: "wrong_source" });
  });

  it("flags a hallucinated article not present in the ruleset", () => {
    const clause = baseClause({
      citation: { article: "BW 9:999", label: "Fake", source: "nl-labor-law.json" },
    });
    expect(validateClause(clause, ruleset)).toEqual({ ok: false, reason: "unknown_article" });
  });

  it("passes unchecked clauses without inspecting citation", () => {
    const clause = baseClause({ status: "unchecked", citation: null });
    expect(validateClause(clause, ruleset)).toEqual({ ok: true });
  });

  it("passes compliant clauses without inspecting citation", () => {
    const clause = baseClause({ status: "compliant", citation: null });
    expect(validateClause(clause, ruleset)).toEqual({ ok: true });
  });
});

describe("enforceCitation", () => {
  it("returns the clause unchanged when valid", () => {
    const clause = baseClause();
    expect(enforceCitation(clause, ruleset)).toBe(clause);
  });

  it("downgrades to unchecked and strips the bad citation when invalid", () => {
    const clause = baseClause({
      citation: { article: "BW 9:999", label: "Fake", source: "nl-labor-law.json" },
    });
    const out = enforceCitation(clause, ruleset);
    expect(out.status).toBe("unchecked");
    expect(out.citation).toBeNull();
    expect(out.id).toBe(clause.id);
    expect(out.originalText).toBe(clause.originalText);
  });

  it("preserves clause identity (id, originalText) when downgrading", () => {
    const clause = baseClause({ citation: null, originalText: "raw text here" });
    const out = enforceCitation(clause, ruleset);
    expect(out.originalText).toBe("raw text here");
  });
});
