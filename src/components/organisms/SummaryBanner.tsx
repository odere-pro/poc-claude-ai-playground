"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/atoms/Button";
import { StatusCard } from "@/components/molecules/StatusCard";
import { useReport, useReportDispatch } from "@/context/ReportContext";

export function SummaryBanner() {
  const { report } = useReport();
  const dispatch = useReportDispatch();
  const router = useRouter();
  const summary = report?.summary;
  if (!summary) return null;

  const onNew = () => {
    dispatch({ type: "RESET" });
    router.push("/");
  };

  return (
    <section
      data-testid="summary-banner"
      role="status"
      className="flex flex-col gap-4 rounded-lg p-6"
      style={{ backgroundColor: "var(--color-card)" }}
    >
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
          Your report
        </h2>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={onNew}>
            New contract
          </Button>
        </div>
      </header>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatusCard status="illegal" count={summary.illegalCount} label="Illegal" />
        <StatusCard status="exploitative" count={summary.exploitativeCount} label="Exploitative" />
        <StatusCard
          status="permit_conflict"
          count={summary.permitConflictCount}
          label="Permit conflict"
        />
        <StatusCard status="unchecked" count={summary.uncheckedCount} label="Unchecked" />
      </div>
    </section>
  );
}
