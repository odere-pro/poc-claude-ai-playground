"use client";

import { useReport } from "@/context/ReportContext";

export function SummaryBanner() {
  const { state } = useReport();
  const summary = state.report?.summary;
  if (!summary) return null;

  const flagged = summary.illegalCount + summary.exploitativeCount + summary.permitConflictCount;
  return (
    <section
      data-testid="summary-banner"
      role="status"
      aria-live="polite"
      className="border-border rounded-2xl border p-6"
      style={{
        background:
          flagged > 0 ? "var(--color-status-illegal-bg)" : "var(--color-status-compliant-bg)",
        color: flagged > 0 ? "var(--color-status-illegal)" : "var(--color-status-compliant)",
      }}
    >
      <h2 className="font-semibold" style={{ fontSize: "var(--text-summary-headline)" }}>
        {flagged > 0
          ? `${flagged} clause${flagged === 1 ? "" : "s"} need your attention`
          : "Looks compliant — review before signing"}
      </h2>
      <dl className="mt-4 grid grid-cols-2 gap-2 text-sm md:grid-cols-5">
        <Stat label="Illegal" value={summary.illegalCount} />
        <Stat label="Permit conflicts" value={summary.permitConflictCount} />
        <Stat label="Exploitative" value={summary.exploitativeCount} />
        <Stat label="Unchecked" value={summary.uncheckedCount} />
        <Stat label="Compliant" value={summary.compliantCount} />
      </dl>
    </section>
  );
}

function Stat({ label, value }: { readonly label: string; readonly value: number }) {
  return (
    <div className="flex flex-col">
      <dt className="text-xs opacity-80">{label}</dt>
      <dd className="text-xl font-semibold">{value}</dd>
    </div>
  );
}
