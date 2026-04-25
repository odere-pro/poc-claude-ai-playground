import type { ClauseEvent, Ruleset } from "./types";

export type CitationFailure = "missing_citation" | "wrong_source" | "unknown_article";

export type ValidationResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly reason: CitationFailure };

/**
 * Validate a clause's citation against the loaded ruleset.
 *
 * Two checks per the groundedness rules:
 *   1. Authenticity: `citation.source` must equal `{jurisdiction}-labor-law.json`.
 *      The model can't fabricate a different ruleset name.
 *   2. Presence: `citation.article` must match `Rule.article` of an entry in
 *      the ruleset. Hallucinated articles fail this check.
 *
 * `unchecked` clauses don't carry citations and pass through unchecked.
 * Flagged clauses (illegal/exploitative/permit_conflict) without a citation
 * fail with `missing_citation` — the route handler downgrades them to
 * `unchecked` before emitting.
 */
export function validateClause(clause: ClauseEvent, ruleset: Ruleset): ValidationResult {
  if (clause.status === "unchecked" || clause.status === "compliant") {
    return { ok: true };
  }

  const citation = clause.citation;
  if (!citation) return { ok: false, reason: "missing_citation" };

  const expectedSource = `${ruleset.jurisdiction}-labor-law.json`;
  if (citation.source !== expectedSource) return { ok: false, reason: "wrong_source" };

  const articleExists = ruleset.rules.some((r) => r.article === citation.article);
  if (!articleExists) return { ok: false, reason: "unknown_article" };

  return { ok: true };
}

/**
 * Apply validation to a clause; if invalid, return a downgraded
 * `unchecked` copy that strips the bad citation. Used by the
 * /api/analyze route before emitting events to the client.
 */
export function enforceCitation(clause: ClauseEvent, ruleset: Ruleset): ClauseEvent {
  const result = validateClause(clause, ruleset);
  if (result.ok) return clause;
  return {
    ...clause,
    status: "unchecked",
    citation: null,
    action: null,
    permitConflict: null,
  };
}
