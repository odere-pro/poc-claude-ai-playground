"use client";

import { CitationBlock } from "@/components/molecules/CitationBlock";
import { useReport } from "@/context/ReportContext";

export function RightsSummary() {
  const { report, detectedLanguage } = useReport();
  const rights = report?.summary?.rights ?? [];
  if (rights.length === 0) return null;

  return (
    <section
      data-testid="rights-summary"
      className="flex flex-col gap-4 rounded-lg p-6"
      style={{ backgroundColor: "var(--color-card)" }}
    >
      <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
        Your rights
      </h2>
      <ul className="flex flex-col gap-3">
        {rights.map((r, i) => (
          <li key={i} className="flex flex-col gap-2">
            <p lang={detectedLanguage}>{r.text}</p>
            <CitationBlock {...r.citation} />
          </li>
        ))}
      </ul>
    </section>
  );
}
