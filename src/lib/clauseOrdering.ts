import type { ClauseEvent, ClauseStatus } from "./types";

const STATUS_PRIORITY: Record<ClauseStatus, number> = {
  illegal: 0,
  permit_conflict: 1,
  exploitative: 2,
  unchecked: 3,
  compliant: 4,
};

/**
 * Stable sort by status priority.
 *
 * Sort order matches the spec's "users see what's actionable first" rule:
 * illegal → permit_conflict → exploitative → unchecked → compliant.
 * Within a status group, original SSE arrival order is preserved.
 */
export function orderClauses(clauses: readonly ClauseEvent[]): readonly ClauseEvent[] {
  return clauses
    .map((clause, index) => ({ clause, index }))
    .sort((a, b) => {
      const da = STATUS_PRIORITY[a.clause.status];
      const db = STATUS_PRIORITY[b.clause.status];
      if (da !== db) return da - db;
      return a.index - b.index;
    })
    .map(({ clause }) => clause);
}
