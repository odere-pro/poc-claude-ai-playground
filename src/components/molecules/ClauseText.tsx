import type { ClauseStatus } from "@/lib/types";

interface ClauseTextProps {
  readonly text: string;
  readonly language: string;
  readonly status?: ClauseStatus;
}

const STATUS_BORDER: Record<ClauseStatus, string> = {
  illegal: "var(--color-status-illegal)",
  exploitative: "var(--color-status-exploitative)",
  compliant: "var(--color-status-compliant)",
  unchecked: "var(--color-status-unchecked)",
  permit_conflict: "var(--color-status-permit-conflict)",
};

export function ClauseText({ text, language, status = "unchecked" }: ClauseTextProps) {
  return (
    <blockquote
      lang={language}
      className="rounded-sm border-l-2 px-3 py-2 text-sm"
      style={{
        fontFamily: "var(--font-mono)",
        borderLeftColor: STATUS_BORDER[status],
        backgroundColor: "var(--color-bg-inset)",
        color: "var(--color-foreground)",
      }}
    >
      {text}
    </blockquote>
  );
}
