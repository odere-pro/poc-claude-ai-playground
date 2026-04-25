import type { ClauseEvent, Rule } from "./types";

// Three-layer groundedness, layer 2: every clause emitted to the client
// must point at an article that exists in the loaded ruleset. If it
// doesn't (model hallucinated, or wrong source filename), downgrade to
// `unchecked` and strip the citation. The originalText is preserved so
// the user still sees what was in their contract.

export function validateClause(clause: ClauseEvent, ruleset: readonly Rule[]): ClauseEvent {
  if (clause.status === "unchecked") {
    return { ...clause, citation: null };
  }
  if (!clause.citation) {
    return downgrade(clause, "missing citation");
  }
  const articleExists = ruleset.some((r) => r.article === clause.citation!.article);
  if (!articleExists) {
    return downgrade(clause, `article ${clause.citation.article} not in ruleset`);
  }
  const expectedSource = ruleset[0]?.source;
  if (expectedSource && clause.citation.source !== expectedSource) {
    return downgrade(
      clause,
      `invalid source ${clause.citation.source} (expected ${expectedSource})`,
    );
  }
  return clause;
}

function downgrade(clause: ClauseEvent, reason: string): ClauseEvent {
  console.warn(`Citation validation failed: ${reason}. Downgrading clause ${clause.id}.`);
  return {
    ...clause,
    status: "unchecked",
    citation: null,
    action: null,
  };
}
