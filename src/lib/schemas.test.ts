import { describe, it, expect } from "vitest";
import { ExtractRequestSchema, MatchRequestSchema } from "./schemas";

describe("ExtractRequestSchema", () => {
  it("accepts a single-file payload with no permit", () => {
    const result = ExtractRequestSchema.safeParse({
      files: [
        {
          name: "passport.pdf",
          mimeType: "application/pdf",
          sizeBytes: 1024,
          contentBase64: "JVBERi0=",
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an empty files array", () => {
    const result = ExtractRequestSchema.safeParse({ files: [] });
    expect(result.success).toBe(false);
  });

  it("rejects more than 10 files", () => {
    const file = {
      name: "doc.pdf",
      mimeType: "application/pdf",
      sizeBytes: 1,
      contentBase64: "x",
    };
    const result = ExtractRequestSchema.safeParse({
      files: Array(11).fill(file),
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-positive size", () => {
    const result = ExtractRequestSchema.safeParse({
      files: [
        {
          name: "doc.pdf",
          mimeType: "application/pdf",
          sizeBytes: 0,
          contentBase64: "x",
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});

describe("MatchRequestSchema", () => {
  const validDoc = {
    type: "passport",
    fields: { number: "AB123", expires: "2030-01-01" },
    confidence: 0.95,
  };

  it("accepts a request with one document and a permit type", () => {
    const result = MatchRequestSchema.safeParse({
      documents: [validDoc],
      permitType: "gvva",
    });
    expect(result.success).toBe(true);
  });

  it("rejects when permitType is missing", () => {
    const result = MatchRequestSchema.safeParse({ documents: [validDoc] });
    expect(result.success).toBe(false);
  });

  it("rejects confidence outside [0, 1]", () => {
    const result = MatchRequestSchema.safeParse({
      documents: [{ ...validDoc, confidence: 1.5 }],
      permitType: "gvva",
    });
    expect(result.success).toBe(false);
  });

  it("accepts an optional banks filter list", () => {
    const result = MatchRequestSchema.safeParse({
      documents: [validDoc],
      permitType: "gvva",
      banks: ["ING", "ABN AMRO"],
    });
    expect(result.success).toBe(true);
  });
});
