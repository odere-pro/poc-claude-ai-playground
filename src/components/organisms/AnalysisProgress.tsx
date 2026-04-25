"use client";

import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/atoms/Skeleton";
import { useReport } from "@/context/ReportContext";

export function AnalysisProgress() {
  const { state } = useReport();
  const count = state.report?.clauses.length ?? 0;
  return (
    <div
      data-testid="analysis-progress"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="flex flex-col gap-4"
    >
      <div className="flex items-baseline justify-between">
        <h2 className="font-semibold" style={{ fontSize: "var(--text-summary-headline)" }}>
          Analyzing your contract…
        </h2>
        <span className="text-muted-foreground text-sm">
          {count} clause{count === 1 ? "" : "s"} so far
        </span>
      </div>
      <Progress value={Math.min(95, count * 10 + 10)} />
      <div className="flex flex-col gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    </div>
  );
}
