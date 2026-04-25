import { NextRequest } from "next/server";
import { getAnthropic, MODEL } from "@/lib/anthropic";
import { enforceCitation } from "@/lib/citationValidator";
import { buildAnalysisPrompt } from "@/lib/prompts";
import { analyzeRequestSchema } from "@/lib/schemas";
import { checkEntitlement, reportUsage } from "@/lib/solvimon";
import type { ClauseEvent, Jurisdiction, Ruleset, StreamEvent, SummaryEvent } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

const ENCODER = new TextEncoder();

function sse(event: object): Uint8Array {
  return ENCODER.encode(`data: ${JSON.stringify(event)}\n\n`);
}

function done(): Uint8Array {
  return ENCODER.encode("data: [DONE]\n\n");
}

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

async function loadRuleset(jurisdiction: Jurisdiction): Promise<Ruleset> {
  // Explicit per-jurisdiction imports — Turbopack rejects fully-dynamic
  // template paths. Each branch is still lazy: only the requested ruleset
  // is loaded into memory, so a single deploy still serves both.
  switch (jurisdiction) {
    case "nl": {
      const mod = (await import("@/../data/nl-labor-law.json")) as { default: Ruleset };
      return mod.default;
    }
    case "se": {
      const mod = (await import("@/../data/se-labor-law.json")) as { default: Ruleset };
      return mod.default;
    }
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  const url = new URL(req.url);

  // Demo step 11 — short-circuit pricing gate without invoking anything.
  // Gated to non-production environments so a public URL with `?force_402=true`
  // can't be used to defeat billing on a real deployment.
  if (process.env.NODE_ENV !== "production" && url.searchParams.get("force_402") === "true") {
    return jsonError(402, "Analysis limit reached. Upgrade your plan.");
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Invalid JSON body");
  }

  const parsed = analyzeRequestSchema.safeParse(body);
  if (!parsed.success) {
    const tooLarge = parsed.error.issues.some((i) => i.message.includes("100KB"));
    return jsonError(tooLarge ? 413 : 400, tooLarge ? "Contract too large" : "Invalid request");
  }
  const { contractText, permitType, jurisdiction, detectedLanguage, customerId } = parsed.data;

  // Soft-fail entitlement check. Only an explicit deny blocks the user.
  const entitlement = await checkEntitlement(customerId);
  if (!entitlement.allowed) {
    return new Response(
      JSON.stringify({
        error: "Analysis limit reached. Upgrade your plan.",
        checkoutUrl: entitlement.checkoutUrl,
      }),
      { status: 402, headers: { "Content-Type": "application/json" } },
    );
  }

  let ruleset: Ruleset;
  try {
    ruleset = await loadRuleset(jurisdiction);
  } catch {
    return jsonError(500, "Ruleset unavailable");
  }

  const prompt = buildAnalysisPrompt({
    jurisdiction,
    permitType,
    ruleset,
    contractText,
    detectedLanguage,
  });

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const counts = {
        illegal: 0,
        exploitative: 0,
        permit_conflict: 0,
        unchecked: 0,
        compliant: 0,
        total: 0,
      };
      let buffered = "";
      let summaryEmitted = false;

      const emitClause = (raw: unknown): void => {
        const candidate = raw as Partial<ClauseEvent> & { type?: string };
        if (candidate?.type !== "clause" || typeof candidate.id !== "string") return;
        const validated = enforceCitation(candidate as ClauseEvent, ruleset);
        counts.total += 1;
        counts[validated.status] += 1;
        controller.enqueue(sse(validated));
      };

      const emitSummary = (raw: unknown): void => {
        const candidate = raw as Partial<SummaryEvent> & { type?: string };
        if (candidate?.type !== "summary") return;
        // Recompute counts from validated clauses — model counts may be stale
        // if any clause was downgraded server-side.
        const summary: SummaryEvent = {
          type: "summary",
          jurisdiction,
          permitType,
          detectedLanguage,
          totalClauses: counts.total,
          illegalCount: counts.illegal,
          exploitativeCount: counts.exploitative,
          permitConflictCount: counts.permit_conflict,
          uncheckedCount: counts.unchecked,
          compliantCount: counts.compliant,
          rights: candidate.rights ?? [],
        };
        controller.enqueue(sse(summary));
        summaryEmitted = true;
      };

      const drainBuffer = (): void => {
        // Model emits one JSON object per "line", but a single token may split
        // mid-object. Drain greedily on top-level brace balance.
        let depth = 0;
        let start = -1;
        let inString = false;
        let escape = false;
        for (let i = 0; i < buffered.length; i++) {
          const ch = buffered[i];
          if (escape) {
            escape = false;
            continue;
          }
          if (ch === "\\") {
            escape = true;
            continue;
          }
          if (ch === '"') {
            inString = !inString;
            continue;
          }
          if (inString) continue;
          if (ch === "{") {
            if (depth === 0) start = i;
            depth += 1;
          } else if (ch === "}") {
            depth -= 1;
            if (depth === 0 && start !== -1) {
              const slice = buffered.slice(start, i + 1);
              try {
                const obj = JSON.parse(slice) as { type?: string };
                if (obj.type === "clause") emitClause(obj);
                else if (obj.type === "summary") emitSummary(obj);
              } catch {
                // Truncated — wait for more.
              }
              buffered = buffered.slice(i + 1);
              i = -1;
              start = -1;
              depth = 0;
            }
          }
        }
      };

      try {
        const upstream = await getAnthropic().messages.stream({
          model: MODEL,
          max_tokens: 4096,
          system: prompt.system,
          messages: [{ role: "user", content: prompt.user }],
        });

        for await (const event of upstream) {
          if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
            buffered += event.delta.text;
            drainBuffer();
          }
        }
        // One last drain in case the model didn't terminate cleanly.
        drainBuffer();

        if (!summaryEmitted) {
          // Synthesize a summary so the client always knows the run ended.
          const summary: SummaryEvent = {
            type: "summary",
            jurisdiction,
            permitType,
            detectedLanguage,
            totalClauses: counts.total,
            illegalCount: counts.illegal,
            exploitativeCount: counts.exploitative,
            permitConflictCount: counts.permit_conflict,
            uncheckedCount: counts.unchecked,
            compliantCount: counts.compliant,
            rights: [],
          };
          controller.enqueue(sse(summary));
        }
        controller.enqueue(done());
        controller.close();

        // Best-effort usage report.
        void reportUsage(customerId);
      } catch {
        // Don't echo the upstream error — could leak prompt or model details.
        controller.enqueue(ENCODER.encode(`event: error\ndata: {"error":"upstream_failed"}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

// Re-export helpers used by integration tests so they can poke individual
// pieces without booting Next.js.
export type { StreamEvent };
