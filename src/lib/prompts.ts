import type { Jurisdiction, Ruleset, SupportedLanguage, VoiceReportContext } from "./types";

interface BuildAnalysisPromptInput {
  readonly jurisdiction: Jurisdiction;
  readonly permitType: string;
  readonly ruleset: Ruleset;
  readonly contractText: string;
  readonly detectedLanguage: SupportedLanguage;
}

/**
 * Build the system+user prompt pair for /api/analyze.
 *
 * The model is instructed to emit one JSON object per clause it identifies,
 * with strict status values and a `citation.source` that exactly matches
 * the ruleset filename. Server-side `enforceCitation` validates after the
 * fact — but a clear instruction reduces hallucination upfront.
 */
export function buildAnalysisPrompt(input: BuildAnalysisPromptInput): {
  system: string;
  user: string;
} {
  const { jurisdiction, permitType, ruleset, contractText, detectedLanguage } = input;
  const expectedSource = `${jurisdiction}-labor-law.json`;

  const articlesList = ruleset.rules
    .map((r) => `- ${r.article}: ${r.label} — ${r.summary} [tags: ${r.tags.join(", ")}]`)
    .join("\n");

  const system = [
    `You are Clauseguard, a labor-law contract analyzer for ${jurisdiction.toUpperCase()}.`,
    `The user holds a "${permitType}" permit. Their preferred response language is "${detectedLanguage}".`,
    "",
    "TASK",
    "Read the employment contract clause-by-clause. For each clause, output one JSON object with this exact shape:",
    "",
    "{",
    `  "type": "clause",`,
    `  "id": <stable string, kebab-cased from the clause title>,`,
    `  "title": <short label of the clause, in the user's language>,`,
    `  "status": "illegal" | "exploitative" | "compliant" | "permit_conflict" | "unchecked",`,
    `  "originalText": <the verbatim clause text from the contract>,`,
    `  "explanation": <≤2 sentences in the user's language explaining the verdict>,`,
    `  "citation": null | { "article": <string from RULESET below>, "label": <string>, "source": "${expectedSource}" },`,
    `  "action": null | <string — what the user should do next>,`,
    `  "permitConflict": null | { "permitType": <string>, "reason": <string> }`,
    "}",
    "",
    "GROUNDEDNESS RULES (critical — your output is rejected if violated)",
    `- Every flagged clause (illegal/exploitative/permit_conflict) MUST cite an article from the RULESET below.`,
    `- citation.source MUST be exactly "${expectedSource}". Do not invent any other source.`,
    `- citation.article MUST exactly match one of the article identifiers in the RULESET.`,
    `- Clauses you cannot map to a rule MUST be marked "unchecked" with citation: null.`,
    "- Do not invent rules, articles, or sources.",
    "",
    "OUTPUT FORMAT",
    "Stream one JSON object per clause, separated by newlines. After the last clause emit a single summary object:",
    "",
    "{",
    `  "type": "summary",`,
    `  "jurisdiction": "${jurisdiction}",`,
    `  "permitType": "${permitType}",`,
    `  "detectedLanguage": "${detectedLanguage}",`,
    `  "totalClauses": <int>,`,
    `  "illegalCount": <int>,`,
    `  "exploitativeCount": <int>,`,
    `  "permitConflictCount": <int>,`,
    `  "uncheckedCount": <int>,`,
    `  "compliantCount": <int>,`,
    `  "rights": []`,
    "}",
    "",
    "RULESET (the only valid citations)",
    articlesList,
  ].join("\n");

  const user = [
    "CONTRACT TEXT:",
    "---",
    contractText,
    "---",
    `Begin clause-by-clause analysis now. Respond in language "${detectedLanguage}".`,
  ].join("\n");

  return { system, user };
}

interface BuildVoiceIntentPromptInput {
  readonly transcript: string;
  readonly reportContext: VoiceReportContext;
}

export function buildVoiceIntentPrompt(input: BuildVoiceIntentPromptInput): {
  system: string;
  user: string;
} {
  const { transcript, reportContext } = input;

  const system = [
    "You are the voice navigator for Clauseguard. Map the user's transcript to one of the following intents:",
    `- read_flags`,
    `- explain_clause (clauseId required)`,
    `- read_rights`,
    `- navigate_next | navigate_prev`,
    `- navigate_to (clauseId required)`,
    `- repeat`,
    `- what_can_i_do`,
    `- download`,
    `- new_contract`,
    `- switch_jurisdiction (target: "nl" | "se")`,
    `- unknown (when the request is unclear)`,
    "",
    "Respond with one JSON object: { intent: { kind, ...args }, responseText: <plain-language reply, no markdown>, language: <BCP-47 primary tag> }.",
    "Speak in the same language as the user transcribed. Keep responseText under 240 characters.",
  ].join("\n");

  const user = [
    "USER TRANSCRIPT:",
    transcript,
    "",
    "REPORT CONTEXT:",
    JSON.stringify(reportContext),
  ].join("\n");

  return { system, user };
}
