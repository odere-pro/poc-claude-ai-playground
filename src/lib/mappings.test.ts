import { describe, it, expect } from "vitest";
import { defaultPermitFor, toBadgeVariant, toTtsLang } from "./mappings";

describe("defaultPermitFor", () => {
  it("returns gvva for NL", () => {
    expect(defaultPermitFor("nl")).toBe("gvva");
  });
  it("returns arbetstillstand for SE", () => {
    expect(defaultPermitFor("se")).toBe("arbetstillstand");
  });
});

describe("toBadgeVariant", () => {
  it("maps illegal → destructive", () => {
    expect(toBadgeVariant("illegal")).toBe("destructive");
  });
  it("maps compliant → secondary", () => {
    expect(toBadgeVariant("compliant")).toBe("secondary");
  });
  it("maps unchecked → outline", () => {
    expect(toBadgeVariant("unchecked")).toBe("outline");
  });
});

describe("toTtsLang", () => {
  it("expands primary tag to BCP-47 with region", () => {
    expect(toTtsLang("uk")).toBe("uk-UA");
    expect(toTtsLang("en")).toBe("en-US");
    expect(toTtsLang("sv")).toBe("sv-SE");
  });
});
