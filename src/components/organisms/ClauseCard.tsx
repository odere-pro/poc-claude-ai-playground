"use client";

import { Badge } from "@/components/atoms/Badge";
import { CitationBlock } from "@/components/molecules/CitationBlock";
import { ClauseText } from "@/components/molecules/ClauseText";
import { ExpanderSection } from "@/components/molecules/ExpanderSection";
import type { ClauseEvent } from "@/lib/types";

interface ClauseCardProps {
  readonly clause: ClauseEvent;
  readonly language: string;
  readonly highlighted?: boolean;
}

export function ClauseCard({ clause, language, highlighted }: ClauseCardProps) {
  return (
    <article
      data-testid="clause-card"
      data-status={clause.status}
      className="rounded-lg border p-4 transition-shadow"
      style={{
        backgroundColor: "var(--color-card)",
        color: "var(--color-card-foreground)",
        borderColor: highlighted ? "var(--color-primary)" : "var(--color-border)",
        boxShadow: highlighted ? "0 0 0 2px var(--color-border-focus)" : undefined,
      }}
    >
      <header className="mb-3 flex items-center justify-between gap-2">
        <h3 className="text-base font-semibold" style={{ fontFamily: "var(--font-display)" }}>
          {clause.title}
        </h3>
        <Badge status={clause.status} />
      </header>

      <ClauseText text={clause.originalText} language={language} status={clause.status} />

      <p data-testid="clause-explanation" className="mt-3 text-sm" lang={language}>
        {clause.explanation}
      </p>

      {clause.citation ? (
        <div className="mt-3">
          <CitationBlock {...clause.citation} />
        </div>
      ) : null}

      {clause.action ? (
        <div className="mt-3">
          <ExpanderSection label="What you can do">
            <p lang={language}>{clause.action}</p>
          </ExpanderSection>
        </div>
      ) : null}

      {clause.status === "unchecked" ? (
        <p className="mt-3 text-xs italic" style={{ color: "var(--color-muted-foreground)" }}>
          The current ruleset doesn&apos;t cover this clause type, so we can&apos;t evaluate it.
        </p>
      ) : null}
    </article>
  );
}
