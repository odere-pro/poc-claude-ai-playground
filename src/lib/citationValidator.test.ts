import { describe, it, expect } from "vitest";
import type { BankRules } from "./types";
import { validateCitation } from "./citationValidator";

const rules: BankRules = {
  bank: "ING",
  accepted_permits: ["gvva", "kennismigrant"],
  required_documents: {
    always: ["passport", "bsn"],
    employment: ["employment_contract"],
    conditional: { renting: ["rental_contract"] },
  },
  online_application: true,
};

describe("validateCitation", () => {
  it("accepts a citation that names the bank, an accepted permit, and a known document", () => {
    const result = validateCitation(
      { bank: "ING", permitType: "gvva", documentType: "passport" },
      rules,
    );
    expect(result).toEqual({ valid: true });
  });

  it("accepts citations with only a bank match (no specific claims)", () => {
    expect(validateCitation({ bank: "ING" }, rules)).toEqual({ valid: true });
  });

  it("accepts a conditional document type", () => {
    const result = validateCitation({ bank: "ING", documentType: "rental_contract" }, rules);
    expect(result.valid).toBe(true);
  });

  it("rejects when the bank name does not match the loaded ruleset", () => {
    const result = validateCitation(
      { bank: "DeutscheBank Netherlands", documentType: "passport" },
      rules,
    );
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe("unknown_bank");
  });

  it("rejects an unsupported permit", () => {
    const result = validateCitation({ bank: "ING", permitType: "tourist_visa" }, rules);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe("permit_not_accepted");
  });

  it("rejects an unknown document type", () => {
    const result = validateCitation({ bank: "ING", documentType: "schengen_receipt" }, rules);
    expect(result.valid).toBe(false);
    if (!result.valid) expect(result.reason).toBe("document_not_required");
  });

  it("matches the bank name case-insensitively", () => {
    expect(validateCitation({ bank: "ing", documentType: "passport" }, rules).valid).toBe(true);
  });
});
