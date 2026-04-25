"use client";

import { useMemo } from "react";
import { ClauseCard } from "./ClauseCard";
import { orderClauses } from "@/lib/clauseOrdering";
import { useReport } from "@/context/ReportContext";

export function ClauseList() {
  const { report, detectedLanguage, highlightedClauseId } = useReport();
  const ordered = useMemo(() => orderClauses(report?.clauses ?? []), [report?.clauses]);

  if (ordered.length === 0) {
    return null;
  }

  return (
    <section className="flex flex-col gap-3">
      {ordered.map((c) => (
        <ClauseCard
          key={c.id}
          clause={c}
          language={detectedLanguage}
          highlighted={c.id === highlightedClauseId}
        />
      ))}
    </section>
  );
}
