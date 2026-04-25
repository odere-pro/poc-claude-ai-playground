"use client";

import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/atoms/StatusBadge";
import { CitationBlock } from "@/components/molecules/CitationBlock";
import type { ClauseEvent } from "@/lib/types";

interface ClauseCardProps {
  readonly clause: ClauseEvent;
  readonly highlighted?: boolean;
  readonly expanded?: boolean;
  readonly onToggleExpand?: () => void;
}

export function ClauseCard({ clause, highlighted, expanded, onToggleExpand }: ClauseCardProps) {
  const flagged = clause.status !== "unchecked" && clause.status !== "compliant";
  return (
    <Card
      data-testid="clause-card"
      data-clause-id={clause.id}
      data-status={clause.status}
      data-highlighted={highlighted ? "true" : undefined}
      style={{
        borderLeft: `4px solid var(--color-status-${clause.status})`,
        marginBottom: "var(--space-clause)",
      }}
    >
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="flex flex-col gap-2">
          <h3
            className="font-semibold tracking-tight"
            style={{ fontSize: "var(--text-clause-title)" }}
          >
            {clause.title}
          </h3>
          <StatusBadge status={clause.status} />
        </div>
        {onToggleExpand && (
          <button
            type="button"
            data-testid="clause-toggle"
            onClick={onToggleExpand}
            className="text-muted-foreground hover:text-foreground text-xs underline-offset-2 hover:underline"
          >
            {expanded ? "Collapse" : "Expand"}
          </button>
        )}
      </div>

      {expanded && (
        <div className="flex flex-col gap-3 px-4 pb-4">
          {clause.explanation && (
            <p className="leading-relaxed" style={{ fontSize: "var(--text-clause-body)" }}>
              {clause.explanation}
            </p>
          )}
          {/* CitationBlock — required when flagged. CI grep enforces this. */}
          {flagged && clause.citation && <CitationBlock citation={clause.citation} />}
          {clause.action && (
            <p className="text-sm">
              <span className="font-medium">What to do: </span>
              {clause.action}
            </p>
          )}
          {clause.permitConflict && (
            <p
              className="rounded-md p-2 text-sm"
              style={{
                background: "var(--color-status-permit_conflict-bg)",
                color: "var(--color-status-permit_conflict)",
              }}
            >
              <strong>Permit conflict ({clause.permitConflict.permitType}):</strong>{" "}
              {clause.permitConflict.reason}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
