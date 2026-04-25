interface CitationBlockProps {
  readonly article: string;
  readonly law: string;
  readonly description: string;
  readonly source: string;
}

export function CitationBlock({ article, law, description, source }: CitationBlockProps) {
  const ariaLabel = `Citation: ${article}, ${law}. ${description}. Source: ${source}.`;
  return (
    <div
      data-testid="citation-block"
      aria-label={ariaLabel}
      className="rounded-md border-l-2 px-3 py-2 text-sm"
      style={{
        fontFamily: "var(--font-mono)",
        borderLeftColor: "var(--color-primary)",
        backgroundColor: "var(--color-bg-inset)",
        color: "var(--color-foreground)",
      }}
    >
      <div className="font-semibold">{article}</div>
      <div className="text-xs" style={{ color: "var(--color-muted-foreground)" }}>
        {law}
      </div>
      <div className="mt-1 text-xs">{description}</div>
    </div>
  );
}
