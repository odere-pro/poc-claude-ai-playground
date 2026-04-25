import { describe, it, expect } from "vitest";
import { orderClauses } from "./clauseOrdering";
import type { ClauseEvent, ClauseStatus } from "./types";

function clause(id: string, status: ClauseStatus): ClauseEvent {
  return {
    type: "clause",
    id,
    title: id,
    status,
    originalText: "",
    explanation: "",
    citation: null,
    action: null,
    permitConflict: null,
  };
}

describe("orderClauses", () => {
  it("sorts: illegal → permit_conflict → exploitative → unchecked → compliant", () => {
    const input: ClauseEvent[] = [
      clause("1", "compliant"),
      clause("2", "illegal"),
      clause("3", "unchecked"),
      clause("4", "permit_conflict"),
      clause("5", "exploitative"),
    ];
    const ordered = orderClauses(input);
    expect(ordered.map((c) => c.status)).toEqual([
      "illegal",
      "permit_conflict",
      "exploitative",
      "unchecked",
      "compliant",
    ]);
  });

  it("does not mutate input array", () => {
    const input: ClauseEvent[] = [clause("1", "compliant"), clause("2", "illegal")];
    const before = input.map((c) => c.id);
    orderClauses(input);
    expect(input.map((c) => c.id)).toEqual(before);
  });

  it("returns empty array on empty input", () => {
    expect(orderClauses([])).toEqual([]);
  });
});
