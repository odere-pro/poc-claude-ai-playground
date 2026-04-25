"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ClauseList } from "@/components/organisms/ClauseList";
import { PricingGate } from "@/components/organisms/PricingGate";
import { SummaryBanner } from "@/components/organisms/SummaryBanner";
import { useReport } from "@/context/ReportContext";

export default function ResultsPage() {
  const { state, dispatch } = useReport();

  // No analysis attempted and no saved blob → bounce to upload.
  if (state.phase !== "results" && state.phase !== "incomplete" && !state.savedSummary) {
    return <PricingGate />;
  }

  const isIncomplete = state.phase === "incomplete";

  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-12">
      {isIncomplete && (
        <div
          data-testid="incomplete-banner"
          className="rounded-md p-3 text-sm"
          style={{
            background: "var(--color-status-exploitative-bg)",
            color: "var(--color-status-exploitative)",
          }}
        >
          The analysis stopped early — partial results below. Try again to get a full report.
        </div>
      )}
      <SummaryBanner />
      <ClauseList />
      <div className="flex justify-end">
        <Button
          variant="outline"
          onClick={() => dispatch({ type: "RESET" })}
          render={<Link href="/" />}
        >
          Analyze another contract
        </Button>
      </div>
    </section>
  );
}
