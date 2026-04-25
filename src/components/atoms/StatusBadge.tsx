import { Badge as ShadcnBadge } from "@/components/ui/badge";
import { toBadgeVariant } from "@/lib/mappings";
import type { ClauseStatus } from "@/lib/types";

const DEFAULT_LABELS: Record<ClauseStatus, string> = {
  illegal: "ILLEGAL",
  exploitative: "EXPLOITATIVE",
  permit_conflict: "PERMIT CONFLICT",
  compliant: "COMPLIANT",
  unchecked: "UNCHECKED",
};

interface StatusBadgeProps {
  readonly status: ClauseStatus;
  readonly label?: string;
}

export function StatusBadge({ status, label }: StatusBadgeProps) {
  return (
    <ShadcnBadge
      data-testid="clause-badge"
      data-status={status}
      variant={toBadgeVariant(status)}
      style={{
        backgroundColor: `var(--color-status-${status}-bg)`,
        color: `var(--color-status-${status})`,
        borderColor: "transparent",
      }}
    >
      {label ?? DEFAULT_LABELS[status]}
    </ShadcnBadge>
  );
}
