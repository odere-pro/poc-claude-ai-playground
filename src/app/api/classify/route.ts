import "server-only";

import { type NextRequest } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { pipelineRequestSchema } from "@/lib/schemas";
import { classifyContract } from "@/lib/contractClassifier";

export const runtime = "nodejs";
export const maxDuration = 30;

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** POST /api/classify — { text, jurisdiction? } → { typeId, confidence, jurisdiction } */
export async function POST(req: NextRequest): Promise<Response> {
  if (!rateLimit(req, "classify", { capacity: 10, refillPerSec: 10 / 60 })) {
    return jsonError(429, "Too many requests. Slow down.");
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return jsonError(503, "Analysis service not configured");
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError(400, "Expected JSON body");
  }

  const parsed = pipelineRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, parsed.error.issues[0]?.message ?? "Invalid request");
  }

  const { text, jurisdiction } = parsed.data;

  try {
    const result = await classifyContract(text, jurisdiction);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return jsonError(502, "Classification failed");
  }
}
