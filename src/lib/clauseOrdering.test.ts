import { describe, it, expect } from "vitest";
import { orderClauses } from "./clauseOrdering";
import type { ClauseEvent, ClauseStatus } from "./types";

const make = (id: string, status: ClauseStatus): ClauseEvent => ({
  type: "clause",
  id,
  title: id,
  status,
  originalText: "",
  explanation: "",
  citation: null,
  action: null,
  permitConflict: null,
});

describe("orderClauses", () => {
  it("sorts illegal → permit_conflict → exploitative → unchecked → compliant", () => {
    const input = [
      make("a", "compliant"),
      make("b", "unchecked"),
      make("c", "illegal"),
      make("d", "permit_conflict"),
      make("e", "exploitative"),
    ];
    const out = orderClauses(input).map((c) => c.id);
    expect(out).toEqual(["c", "d", "e", "b", "a"]);
  });

  it("is stable within a status group", () => {
    const input = [
      make("first", "compliant"),
      make("second", "compliant"),
      make("third", "compliant"),
    ];
    expect(orderClauses(input).map((c) => c.id)).toEqual(["first", "second", "third"]);
  });

  it("returns a new array (does not mutate input)", () => {
    const input = [make("a", "compliant"), make("b", "illegal")];
    const out = orderClauses(input);
    expect(input.map((c) => c.id)).toEqual(["a", "b"]);
    expect(out.map((c) => c.id)).toEqual(["b", "a"]);
  });

  it("handles empty input", () => {
    expect(orderClauses([])).toEqual([]);
  });
});
