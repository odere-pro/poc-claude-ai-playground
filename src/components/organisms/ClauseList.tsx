"use client";

import { ClauseCard } from "./ClauseCard";
import { useReport } from "@/context/ReportContext";
import { orderClauses } from "@/lib/clauseOrdering";

export function ClauseList() {
  const { state, dispatch } = useReport();
  const clauses = state.report?.clauses ?? [];
  const ordered = orderClauses(clauses);

  if (ordered.length === 0) {
    return (
      <p data-testid="clause-list-empty" className="text-muted-foreground text-sm">
        No clauses yet.
      </p>
    );
  }

  return (
    <ul
      data-testid="clause-list"
      role="list"
      aria-live="polite"
      aria-busy={state.phase === "analyzing"}
      className="flex list-none flex-col"
    >
      {ordered.map((clause) => (
        <li key={clause.id} role="listitem">
          <ClauseCard
            clause={clause}
            highlighted={state.highlightedClauseId === clause.id}
            expanded={state.expandedClauses.has(clause.id)}
            onToggleExpand={() => dispatch({ type: "TOGGLE_EXPANDER", id: clause.id })}
          />
        </li>
      ))}
    </ul>
  );
}
