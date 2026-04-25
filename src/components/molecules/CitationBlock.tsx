import type { Citation } from "@/lib/types";

interface CitationBlockProps {
  readonly citation: Citation;
}

/**
 * Renders the legal citation for a flagged clause. Required inside every
 * ClauseCard where status !== 'unchecked' — CI grep verifies presence.
 */
export function CitationBlock({ citation }: CitationBlockProps) {
  return (
    <div
      data-testid="citation-block"
      data-article={citation.article}
      data-source={citation.source}
      className="border-border bg-muted/40 rounded-md border-l-4 px-3 py-2 text-sm"
      style={{ borderLeftColor: "var(--color-status-illegal)" }}
    >
      <div className="font-mono text-xs tracking-tight opacity-80">{citation.article}</div>
      <div className="mt-1">{citation.label}</div>
    </div>
  );
}
