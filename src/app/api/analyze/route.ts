import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { NextRequest } from "next/server";
import { checkEntitlement, reportUsage } from "@/lib/solvimon";
import { buildAnalysisPrompt } from "@/lib/prompts";
import { validateClause } from "@/lib/citationValidator";
import { rateLimit } from "@/lib/rateLimit";
import { rulesetSchema, permitCategoriesSchema } from "@/lib/schemas";
import type {
  AnalyzeRequest,
  ClauseEvent,
  Jurisdiction,
  Permit,
  PermitCategories,
  Rule,
  Ruleset,
  StreamEvent,
  SummaryEvent,
} from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_CONTRACT_LENGTH = 100_000;
const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 4096;

interface AnalyzeBody {
  contractText?: unknown;
  permitType?: unknown;
  jurisdiction?: unknown;
  detectedLanguage?: unknown;
  customerId?: unknown;
}

function jsonError(message: string, status: number): Response {
  return Response.json({ error: message }, { status });
}

function parseBody(raw: AnalyzeBody): AnalyzeRequest | null {
  if (typeof raw.contractText !== "string") return null;
  if (raw.contractText.length === 0) return null;
  if (raw.contractText.length > MAX_CONTRACT_LENGTH) return null;
  if (typeof raw.permitType !== "string" || raw.permitType.length === 0) {
    return null;
  }
  const jurisdiction: Jurisdiction = raw.jurisdiction === "se" ? "se" : "nl";
  const detectedLanguage =
    typeof raw.detectedLanguage === "string" && raw.detectedLanguage.length > 0
      ? raw.detectedLanguage
      : "en";
  const customerId =
    typeof raw.customerId === "string" && raw.customerId.length > 0 ? raw.customerId : undefined;
  return {
    contractText: raw.contractText,
    permitType: raw.permitType,
    jurisdiction,
    detectedLanguage,
    customerId,
  };
}

async function loadRuleset(jurisdiction: Jurisdiction): Promise<Ruleset> {
  const mod =
    jurisdiction === "se"
      ? await import("@/../data/se-labor-law.json")
      : await import("@/../data/nl-labor-law.json");
  return rulesetSchema.parse(mod.default);
}

async function loadPermits(jurisdiction: Jurisdiction): Promise<PermitCategories> {
  const mod =
    jurisdiction === "se"
      ? await import("@/../data/se-permit-categories.json")
      : await import("@/../data/nl-permit-categories.json");
  return permitCategoriesSchema.parse(mod.default);
}

function pickPermit(permits: PermitCategories, permitType: string): Permit {
  const match = permits.permits.find((p) => p.id === permitType);
  return match ?? permits.permits[0];
}

export async function POST(req: NextRequest): Promise<Response> {
  if (!rateLimit(req, "analyze", { capacity: 10, refillPerSec: 10 / 60 })) {
    return jsonError("Too many requests. Slow down.", 429);
  }

  const url = new URL(req.url);
  if (url.searchParams.get("force_402") === "true") {
    return jsonError("Analysis limit reached. Upgrade your plan.", 402);
  }

  let raw: AnalyzeBody;
  try {
    raw = (await req.json()) as AnalyzeBody;
  } catch {
    return jsonError("Invalid request body.", 400);
  }

  const body = parseBody(raw);
  if (!body) return jsonError("Invalid request body.", 400);

  if (body.customerId) {
    try {
      const allowed = await checkEntitlement(body.customerId);
      if (!allowed) {
        return jsonError("Analysis limit reached. Upgrade your plan.", 402);
      }
    } catch (err) {
      console.warn(
        "Solvimon entitlement check failed; allowing analysis:",
        err instanceof Error ? err.message : "unknown",
      );
    }
  }

  const ruleset = await loadRuleset(body.jurisdiction);
  const permits = await loadPermits(body.jurisdiction);
  const permit = pickPermit(permits, body.permitType);

  const systemPrompt = buildAnalysisPrompt({
    ruleset: ruleset.rules,
    permit,
    jurisdiction: body.jurisdiction,
    detectedLanguage: body.detectedLanguage,
  });

  return new Response(
    buildSseStream({
      systemPrompt,
      contractText: body.contractText,
      ruleset: ruleset.rules,
      customerId: body.customerId,
    }),
    {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    },
  );
}

interface BuildSseInput {
  readonly systemPrompt: string;
  readonly contractText: string;
  readonly ruleset: readonly Rule[];
  readonly customerId?: string;
}

function buildSseStream({
  systemPrompt,
  contractText,
  ruleset,
  customerId,
}: BuildSseInput): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (evt: StreamEvent | string): void => {
        const payload = typeof evt === "string" ? evt : JSON.stringify(evt);
        controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
      };

      try {
        const client = new Anthropic();
        const claudeStream = await client.messages.stream({
          model: MODEL,
          max_tokens: MAX_TOKENS,
          system: systemPrompt,
          messages: [{ role: "user", content: contractText }],
        });

        let buffer = "";
        for await (const chunk of claudeStream) {
          if (chunk.type !== "content_block_delta") continue;
          if (chunk.delta.type !== "text_delta") continue;
          buffer += chunk.delta.text;

          let newlineIdx: number;
          while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
            const line = buffer.slice(0, newlineIdx).trim();
            buffer = buffer.slice(newlineIdx + 1);
            if (!line.startsWith("data: ")) continue;

            const payload = line.slice(6).trim();
            if (payload === "[DONE]") continue;

            let evt: ClauseEvent | SummaryEvent;
            try {
              evt = JSON.parse(payload) as ClauseEvent | SummaryEvent;
            } catch (e) {
              console.warn(
                "Skipping malformed model event:",
                e instanceof Error ? e.message : "unknown",
              );
              continue;
            }

            if (evt.type === "clause") {
              send(validateClause(evt, ruleset));
            } else if (evt.type === "summary") {
              send(evt);
            }
          }
        }

        send("[DONE]");
        controller.close();

        if (customerId) {
          reportUsage(customerId).catch((err) =>
            console.warn(
              "Solvimon usage report failed:",
              err instanceof Error ? err.message : "unknown",
            ),
          );
        }
      } catch (err) {
        console.error("Analysis stream error:", err instanceof Error ? err.message : "unknown");
        send({ type: "error" });
        controller.close();
      }
    },
  });
}
