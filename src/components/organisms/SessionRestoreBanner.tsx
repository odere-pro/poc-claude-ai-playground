"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useReport } from "@/context/ReportContext";

/**
 * Shown on the upload page when a previous-session summary was hydrated
 * from localStorage. Non-destructive — user picks "view" or "discard".
 */
export function SessionRestoreBanner() {
  const { state, dispatch } = useReport();
  if (!state.savedSummary) return null;
  if (state.phase === "results") return null;

  return (
    <aside
      data-testid="session-restore"
      aria-label="Restored session"
      className="border-border bg-muted/40 flex items-center justify-between rounded-xl border p-3 text-sm"
    >
      <span>You have a previous analysis saved on this device.</span>
      {/* Primary action ("View summary") in DOM first so it receives focus
          before the destructive "Discard". Visual order is preserved with
          flex-row-reverse. */}
      <div className="flex flex-row-reverse gap-2">
        <Button size="sm" render={<Link href="/results" />}>
          View summary
        </Button>
        <Button size="sm" variant="ghost" onClick={() => dispatch({ type: "CLEAR_SAVED_SUMMARY" })}>
          Discard
        </Button>
      </div>
    </aside>
  );
}
