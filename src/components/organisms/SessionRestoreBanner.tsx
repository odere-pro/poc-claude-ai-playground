"use client";

import { Button } from "@/components/atoms/Button";
import { useReport, useReportDispatch } from "@/context/ReportContext";

function formatRelative(timestamp: number): string {
  const minutes = Math.max(1, Math.floor((Date.now() - timestamp) / 60_000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function SessionRestoreBanner() {
  const { savedSummary } = useReport();
  const dispatch = useReportDispatch();
  if (!savedSummary) return null;

  return (
    <section
      data-testid="session-restore-banner"
      className="flex flex-wrap items-center justify-between gap-3 rounded-md p-3 text-sm"
      style={{ backgroundColor: "var(--color-bg-inset)" }}
    >
      <span>
        You ran an analysis {formatRelative(savedSummary.timestamp)}. We kept the summary only —
        re-upload your contract to see the full report.
      </span>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          data-testid="re-analyze-button"
          onClick={() => {
            // Real re-analysis requires the user to re-upload the contract,
            // since we never persisted it. This button just dismisses the
            // banner and primes the upload tab.
            dispatch({ type: "CLEAR_SAVED_SUMMARY" });
          }}
        >
          Re-analyze
        </Button>
        <Button variant="text" size="sm" onClick={() => dispatch({ type: "CLEAR_SAVED_SUMMARY" })}>
          Dismiss
        </Button>
      </div>
    </section>
  );
}
