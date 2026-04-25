import type { BankRules, DocumentType, PermitType } from "./types";

export type Citation = {
  bank: string;
  permitType?: PermitType;
  documentType?: DocumentType;
};

export type CitationFailure = "unknown_bank" | "permit_not_accepted" | "document_not_required";

export type CitationResult = { valid: true } | { valid: false; reason: CitationFailure };

function collectKnownDocuments(rules: BankRules): ReadonlySet<DocumentType> {
  const known = new Set<DocumentType>([
    ...rules.required_documents.always,
    ...rules.required_documents.employment,
  ]);
  for (const docs of Object.values(rules.required_documents.conditional)) {
    for (const doc of docs) known.add(doc);
  }
  return known;
}

export function validateCitation(citation: Citation, rules: BankRules): CitationResult {
  if (citation.bank.toLowerCase() !== rules.bank.toLowerCase()) {
    return { valid: false, reason: "unknown_bank" };
  }

  if (citation.permitType !== undefined && !rules.accepted_permits.includes(citation.permitType)) {
    return { valid: false, reason: "permit_not_accepted" };
  }

  if (citation.documentType !== undefined) {
    const known = collectKnownDocuments(rules);
    if (!known.has(citation.documentType)) {
      return { valid: false, reason: "document_not_required" };
    }
  }

  return { valid: true };
}
