"use client";

import { useEffect, useState } from "react";
import { ProgressBar } from "@/components/atoms/ProgressBar";
import { Skeleton } from "@/components/atoms/Skeleton";

const MESSAGES = [
  "Reading your contract …",
  "Comparing each clause to the labor law ruleset …",
  "Cross-checking citations …",
  "Drafting your rights summary …",
];

export function AnalysisProgress() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = window.setInterval(() => {
      setIdx((i) => (i + 1) % MESSAGES.length);
    }, 1800);
    return () => window.clearInterval(t);
  }, []);

  return (
    <section
      data-testid="analysis-progress"
      className="flex flex-col gap-6 rounded-lg p-6"
      style={{
        backgroundColor: "var(--color-card)",
        color: "var(--color-card-foreground)",
      }}
    >
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold" style={{ fontFamily: "var(--font-display)" }}>
          Analyzing your contract
        </h2>
        <p
          aria-live="polite"
          className="text-sm"
          style={{ color: "var(--color-muted-foreground)" }}
        >
          {MESSAGES[idx]}
        </p>
        <ProgressBar animated label="Analysis progress" />
      </div>
      <div className="flex flex-col gap-3">
        <Skeleton shape="card" />
        <Skeleton shape="card" />
        <Skeleton shape="card" />
      </div>
    </section>
  );
}
