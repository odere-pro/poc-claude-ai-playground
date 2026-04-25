import type { ClauseStatus } from "@/lib/types";

interface BadgeProps {
  readonly status: ClauseStatus;
  readonly label?: string;
}

const STATUS_LABEL: Record<ClauseStatus, string> = {
  illegal: "Illegal",
  exploitative: "Exploitative",
  compliant: "Compliant",
  unchecked: "Unchecked",
  permit_conflict: "Permit conflict",
};

const STATUS_TOKEN: Record<ClauseStatus, string> = {
  illegal: "var(--color-status-illegal)",
  exploitative: "var(--color-status-exploitative)",
  compliant: "var(--color-status-compliant)",
  unchecked: "var(--color-status-unchecked)",
  permit_conflict: "var(--color-status-permit-conflict)",
};

const STATUS_BG: Record<ClauseStatus, string> = {
  illegal: "var(--color-status-illegal-bg)",
  exploitative: "var(--color-status-exploitative-bg)",
  compliant: "var(--color-status-compliant-bg)",
  unchecked: "var(--color-status-unchecked-bg)",
  permit_conflict: "var(--color-status-permit-conflict-bg)",
};

export function Badge({ status, label }: BadgeProps) {
  const text = label ?? STATUS_LABEL[status];
  return (
    <span
      data-testid="clause-badge"
      data-status={status}
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium tracking-wide uppercase"
      style={{
        color: STATUS_TOKEN[status],
        backgroundColor: STATUS_BG[status],
      }}
    >
      {text}
    </span>
  );
}
