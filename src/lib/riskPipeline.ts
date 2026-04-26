import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { readFile } from "fs/promises";
import path from "path";
import { classifyContract } from "./contractClassifier";
import { loadRulesForType } from "./ruleLoader";
import { clauseEventSchema, summaryEventSchema } from "./schemas";
import type { ClauseEvent, Jurisdiction, LoadedRuleSet, SummaryEvent } from "./types";

const client = new Anthropic();

// Module-level cache — loaded once per process.
let riskExamplesCache: string | null = null;

async function loadRiskExamples(): Promise<string> {
  if (riskExamplesCache) return riskExamplesCache;

  const base = path.join(process.cwd(), "data", "risk-examples");
  const [red, amber, green] = await Promise.all([
    readFile(path.join(base, "red.md"), "utf-8"),
    readFile(path.join(base, "amber.md"), "utf-8"),
    readFile(path.join(base, "green.md"), "utf-8"),
  ]);

  riskExamplesCache = [
    `### RED examples → these clauses get status: "illegal"`,
    red,
    `### AMBER examples → these clauses get status: "exploitative"`,
    amber,
    `### GREEN examples → these clauses get status: "compliant"`,
    green,
  ].join("\n\n");

  return riskExamplesCache;
}

function buildSystemPrompt(ruleSet: LoadedRuleSet, riskExamples: string): string {
  const rulesJson = JSON.stringify(
    ruleSet.applicableRules.map((r) => ({
      id: r.id,
      article: r.article,
      label: r.label,
      category: r.category,
      summary: r.summary,
    })),
    null,
    2,
  );

  const mandatoryJson = JSON.stringify(
    ruleSet.mandatoryClauses.map((c) => ({ id: c.id, description: c.description })),
    null,
    2,
  );

  const redFlagsJson = JSON.stringify(
    ruleSet.redFlags.map((f) => ({
      id: f.id,
      riskLevel: f.riskLevel,
      category: f.category,
      heading: f.heading,
      plain_english: f.plain_english,
    })),
    null,
    2,
  );

  return `You are a Dutch labour law compliance analyst for Clauseguard. You analyze employment contracts clause by clause and emit machine-readable JSON events.

## Output format

Emit EXACTLY ONE JSON object per line. No markdown. No prose outside JSON. ONLY JSON lines.

For each clause analyzed, emit a ClauseEvent:
{"type":"clause","id":"<kebab-case-slug>","title":"<clause title>","status":"<illegal|exploitative|compliant|permit_conflict>","originalText":"<verbatim text from the contract, max 300 chars>","explanation":"<plain English for the worker — what this clause means and why it matters>","citation":{"article":"<law article>","label":"<rule label>","source":"nl-labor-law.json"},"action":"<concrete next step for the worker, or null if compliant>","permitConflict":null,"riskMappings":[{"risk":"<red|amber|green>","path":"<source>/<ruleId>","category":"<category>"}]}

riskMappings rules:
- Include one entry per rule or red-flag that applies to this clause. A clause can violate multiple rules.
- risk: "red" for illegal violations, "amber" for exploitative/grey-zone, "green" for compliant clauses.
- path: combine the rule source file and rule id, e.g. "nl-labor-law.json/nl-working-hours" or "red-flag-clauses.json/unpaid_overtime".
- category: use the category field from the matching rule, e.g. "wages", "working-hours", "contract-terms", "migrant-rights", "termination", "leave-and-benefits", "relocation", "complaint-rights", "housing", "employment-classification".
- For compliant clauses, emit one green entry with the matching rule path.
- For missing mandatory clauses, use path "contract-types/${ruleSet.contractType}.json/mandatory_clauses/<id>" and category "contract-terms".

After ALL clauses, emit exactly ONE SummaryEvent:
{"type":"summary","jurisdiction":"nl","permitType":"${ruleSet.contractType}","detectedLanguage":"<BCP-47 inferred from contract language>","totalClauses":<n>,"illegalCount":<n>,"exploitativeCount":<n>,"permitConflictCount":<n>,"uncheckedCount":<n>,"compliantCount":<n>,"rights":[]}

## Calibration examples — how to classify clauses

Use these real-world Dutch labour law examples to calibrate your status assignments. Match what you see in the contract to the closest pattern.

${riskExamples}

## Applicable rules for this contract type: ${ruleSet.contractTypeTitle}

${rulesJson}

## Red-flag clause patterns to watch for

${redFlagsJson}

## Mandatory clauses that MUST be present in this contract type

${mandatoryJson}

## Instructions

1. Read the entire contract carefully.
2. For each significant clause (salary, hours, trial period, non-compete, notice, leave, dismissal, etc.), emit one ClauseEvent.
3. If a MANDATORY clause from the list above is completely absent from the contract, emit a ClauseEvent with:
   - id: "missing-<mandatory-clause-id>"
   - status: "illegal"
   - originalText: ""
   - explanation: "This mandatory clause is absent from the contract. Dutch law requires it."
   - citation: the most relevant rule from the applicable rules list, or null
4. Set "citation" to the matching rule when flagging illegal/exploitative clauses. Use null for compliant clauses unless helpful.
5. Set "action" to a concrete instruction for the worker (e.g., "Ask employer to remove this clause", "Contact FNV at fnv.nl") for non-compliant clauses. Set to null for compliant clauses.
6. "status" meanings:
   - "illegal": violates a specific Dutch law — void and reportable
   - "exploitative": legal but unfair or misleading
   - "compliant": appears to comply with applicable law
   - "permit_conflict": conflicts with the worker's visa/permit type
7. Emit the SummaryEvent last with accurate counts matching the ClauseEvents you emitted.
8. Infer detectedLanguage from the contract language (nl=Dutch, en=English, etc.).`;
}

export type PipelineEvent = ClauseEvent | SummaryEvent;

export async function runRiskPipeline(
  text: string,
  jurisdiction?: Jurisdiction,
  typeId?: string,
): Promise<ReadableStream<Uint8Array>> {
  const classifyResult = typeId
    ? { typeId, confidence: 1, jurisdiction: jurisdiction ?? "nl" }
    : await classifyContract(text, jurisdiction);

  const resolvedJurisdiction = classifyResult.jurisdiction;
  const [ruleSet, riskExamples] = await Promise.all([
    loadRulesForType(classifyResult.typeId, resolvedJurisdiction),
    loadRiskExamples(),
  ]);

  const systemPrompt = buildSystemPrompt(ruleSet, riskExamples);
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let buffer = "";

      function tryFlushLines() {
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const obj: unknown = JSON.parse(trimmed);
            const clause = clauseEventSchema.safeParse(obj);
            const summary = clause.success ? null : summaryEventSchema.safeParse(obj);
            const validated = clause.success
              ? clause.data
              : summary?.success
                ? summary.data
                : null;
            if (validated) {
              controller.enqueue(encoder.encode(JSON.stringify(validated) + "\n"));
            }
          } catch {
            // skip malformed lines
          }
        }
      }

      try {
        const anthropicStream = client.messages.stream({
          model: "claude-sonnet-4-6",
          max_tokens: 8192,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: `Analyze this contract:\n\n${text}`,
            },
          ],
        });

        for await (const event of anthropicStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            buffer += event.delta.text;
            tryFlushLines();
          }
        }

        // Flush any remaining content in buffer
        if (buffer.trim()) {
          const trimmed = buffer.trim();
          try {
            const obj: unknown = JSON.parse(trimmed);
            const clause = clauseEventSchema.safeParse(obj);
            const summary = clause.success ? null : summaryEventSchema.safeParse(obj);
            const validated = clause.success
              ? clause.data
              : summary?.success
                ? summary.data
                : null;
            if (validated) {
              controller.enqueue(encoder.encode(JSON.stringify(validated) + "\n"));
            }
          } catch {
            // ignore final malformed fragment
          }
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "Analysis failed";
        controller.enqueue(
          encoder.encode(JSON.stringify({ error: message }) + "\n"),
        );
      } finally {
        controller.close();
      }
    },
  });

  return stream;
}
