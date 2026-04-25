import { describe, it, expect } from "vitest";
import {
  analyzeRequestSchema,
  clauseEventSchema,
  summaryEventSchema,
  voiceCommandRequestSchema,
  MAX_CONTRACT_BYTES,
} from "./schemas";

describe("analyzeRequestSchema", () => {
  const valid = {
    contractText: "Sample clause.",
    permitType: "gvva",
    jurisdiction: "nl",
    detectedLanguage: "en",
  };

  it("accepts a valid request", () => {
    expect(analyzeRequestSchema.parse(valid)).toMatchObject(valid);
  });

  it("rejects empty contractText", () => {
    expect(() => analyzeRequestSchema.parse({ ...valid, contractText: "" })).toThrow();
  });

  it("rejects contractText > 100KB", () => {
    const bigText = "x".repeat(MAX_CONTRACT_BYTES + 1);
    expect(() => analyzeRequestSchema.parse({ ...valid, contractText: bigText })).toThrow();
  });

  it("rejects unknown jurisdiction", () => {
    expect(() => analyzeRequestSchema.parse({ ...valid, jurisdiction: "fr" })).toThrow();
  });

  it("rejects unknown language", () => {
    expect(() => analyzeRequestSchema.parse({ ...valid, detectedLanguage: "xx" })).toThrow();
  });

  it("accepts optional customerId", () => {
    const withCustomer = { ...valid, customerId: "cus_123" };
    expect(analyzeRequestSchema.parse(withCustomer)).toMatchObject(withCustomer);
  });
});

describe("clauseEventSchema", () => {
  it("accepts a valid clause event", () => {
    const event = {
      type: "clause",
      id: "c1",
      title: "Non-compete",
      status: "illegal",
      originalText: "...",
      explanation: "...",
      citation: { article: "BW 7:653", label: "Non-compete", source: "nl-labor-law.json" },
      action: null,
      permitConflict: null,
    };
    expect(clauseEventSchema.parse(event)).toMatchObject(event);
  });

  it("requires nullable fields to be present (not undefined)", () => {
    expect(() =>
      clauseEventSchema.parse({
        type: "clause",
        id: "c1",
        title: "x",
        status: "compliant",
        originalText: "",
        explanation: "",
        citation: null,
        action: null,
        // permitConflict missing
      }),
    ).toThrow();
  });
});

describe("summaryEventSchema", () => {
  it("accepts a valid summary", () => {
    const summary = {
      type: "summary",
      jurisdiction: "nl",
      permitType: "gvva",
      detectedLanguage: "en",
      totalClauses: 6,
      illegalCount: 2,
      exploitativeCount: 0,
      permitConflictCount: 0,
      uncheckedCount: 2,
      compliantCount: 2,
      rights: [],
    };
    expect(summaryEventSchema.parse(summary)).toMatchObject(summary);
  });
});

describe("voiceCommandRequestSchema", () => {
  it("accepts a valid voice command", () => {
    const cmd = {
      transcript: "next clause",
      reportContext: { currentClauseId: "c1", clauseIds: ["c1", "c2"], jurisdiction: "nl" },
    };
    expect(voiceCommandRequestSchema.parse(cmd)).toMatchObject(cmd);
  });

  it("rejects transcripts over 2000 chars", () => {
    expect(() =>
      voiceCommandRequestSchema.parse({
        transcript: "x".repeat(2001),
        reportContext: { currentClauseId: null, clauseIds: [], jurisdiction: "nl" },
      }),
    ).toThrow();
  });
});
