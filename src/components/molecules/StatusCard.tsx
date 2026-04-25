import type { ClauseStatus } from "@/lib/types";

interface StatusCardProps {
  readonly status: ClauseStatus;
  readonly count: number;
  readonly label: string;
}

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

export function StatusCard({ status, count, label }: StatusCardProps) {
  return (
    <div
      data-testid="status-card"
      data-status={status}
      className="flex flex-col gap-1 rounded-lg p-4"
      style={{ backgroundColor: STATUS_BG[status] }}
    >
      <span
        className="text-3xl font-semibold"
        style={{
          color: STATUS_TOKEN[status],
          fontFamily: "var(--font-display)",
        }}
      >
        {count}
      </span>
      <span className="text-xs tracking-wide uppercase" style={{ color: STATUS_TOKEN[status] }}>
        {label}
      </span>
    </div>
  );
}
