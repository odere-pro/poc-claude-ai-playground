import type { ClauseEvent, ClauseStatus } from "./types";

const ORDER: Record<ClauseStatus, number> = {
  illegal: 0,
  permit_conflict: 1,
  exploitative: 2,
  unchecked: 3,
  compliant: 4,
};

export function orderClauses(clauses: readonly ClauseEvent[]): ClauseEvent[] {
  return [...clauses].sort((a, b) => ORDER[a.status] - ORDER[b.status]);
}
