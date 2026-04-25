import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { validateClause } from "./citationValidator";
import nlLaborLaw from "../../data/nl-labor-law.json";
import type { ClauseEvent, Rule } from "./types";

const RULESET = nlLaborLaw.rules as readonly Rule[];

function clause(overrides: Partial<ClauseEvent> = {}): ClauseEvent {
  return {
    type: "clause",
    id: "c1",
    title: "Sample",
    status: "illegal",
    originalText: "...",
    explanation: "...",
    citation: {
      article: "Art. 7:653",
      law: "Burgerlijk Wetboek (BW)",
      description: "Non-compete clauses",
      source: "nl-labor-law.json",
    },
    action: null,
    permitConflict: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("validateClause — presence", () => {
  it("downgrades flagged clause with no citation to unchecked", () => {
    const result = validateClause(clause({ citation: null }), RULESET);
    expect(result.status).toBe("unchecked");
    expect(result.citation).toBeNull();
  });

  it("passes unchecked clause with no citation through unchanged", () => {
    const c = clause({ status: "unchecked", citation: null });
    const result = validateClause(c, RULESET);
    expect(result.status).toBe("unchecked");
    expect(result.citation).toBeNull();
  });
});

describe("validateClause — authenticity (hallucination guard)", () => {
  it("downgrades clause with fabricated article to unchecked", () => {
    const fabricated = clause({
      citation: {
        article: "Art. 7:999",
        law: "BW",
        description: "fake",
        source: "nl-labor-law.json",
      },
    });
    const result = validateClause(fabricated, RULESET);
    expect(result.status).toBe("unchecked");
    expect(result.citation).toBeNull();
    expect(result.originalText).toBe("...");
  });

  it("passes clause with real article", () => {
    const result = validateClause(clause(), RULESET);
    expect(result.status).toBe("illegal");
    expect(result.citation?.article).toBe("Art. 7:653");
  });

  it("downgrades clause with wrong source filename", () => {
    const wrongSource = clause({
      citation: {
        article: "Art. 7:653",
        law: "BW",
        description: "x",
        source: "made-up.json",
      },
    });
    expect(validateClause(wrongSource, RULESET).status).toBe("unchecked");
  });

  it("strips action when downgrading to unchecked", () => {
    const withAction = clause({ action: "Talk to FNV", citation: null });
    const result = validateClause(withAction, RULESET);
    expect(result.action).toBeNull();
  });
});
