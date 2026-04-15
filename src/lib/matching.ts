import type { BankRules, ExtractedDocument, MatchResult } from "./types";

export function matchBank(
  rules: BankRules,
  docs: ExtractedDocument[],
  opts: { permit?: string; employed?: boolean; nonEu?: boolean } = {},
): MatchResult {
  const have = new Set(docs.map((d) => d.type));
  const required = [
    ...rules.required_documents.always,
    ...(opts.employed ? rules.required_documents.employment : []),
    ...(opts.nonEu ? (rules.required_documents.conditional["non_eu"] ?? []) : []),
  ];
  const missing = required.filter((r) => !have.has(r));
  const warnings: string[] = [];
  if (
    opts.permit &&
    rules.accepted_permits.length &&
    !rules.accepted_permits.includes(opts.permit)
  ) {
    warnings.push(`Permit "${opts.permit}" not accepted by ${rules.bank}`);
  }
  return {
    bank: rules.bank,
    ready: missing.length === 0 && warnings.length === 0,
    missing_documents: missing,
    warnings,
  };
}
