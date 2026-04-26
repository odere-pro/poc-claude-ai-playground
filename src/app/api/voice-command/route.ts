import "server-only";

import type { NextRequest } from "next/server";
import { getAnthropic, MODEL } from "@/lib/anthropic";
import { buildVoiceIntentPrompt } from "@/lib/prompts";
import { rateLimit } from "@/lib/rateLimit";
import { voiceCommandRequestSchema } from "@/lib/schemas";
import type { VoiceCommandResponse, VoiceIntent } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

const UNKNOWN_INTENT: VoiceIntent = { kind: "unknown" };

function parseIntent(raw: string): VoiceCommandResponse {
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { intent: UNKNOWN_INTENT, responseText: "", language: "en" };
  }
  try {
    const obj = JSON.parse(jsonMatch[0]) as {
      intent?: unknown;
      responseText?: unknown;
      language?: unknown;
    };
    return {
      intent: (obj.intent as VoiceIntent) ?? UNKNOWN_INTENT,
      responseText: typeof obj.responseText === "string" ? obj.responseText : "",
      language: typeof obj.language === "string" ? (obj.language as "en") : "en",
    };
  } catch {
    return { intent: UNKNOWN_INTENT, responseText: "", language: "en" };
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  if (!rateLimit(req, "voice-command", { capacity: 30, refillPerSec: 30 / 60 })) {
    return jsonError(429, "Too many requests. Slow down.");
  }

  if (process.env.NEXT_PUBLIC_VOICE_ENABLED !== "true") {
    return jsonError(503, "Voice features are not enabled");
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

  const parsed = voiceCommandRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, parsed.error.issues[0]?.message ?? "Invalid request");
  }

  const prompt = buildVoiceIntentPrompt({
    transcript: parsed.data.transcript,
    reportContext: parsed.data.reportContext,
  });

  let raw: string;
  try {
    const msg = await getAnthropic().messages.create({
      model: MODEL,
      max_tokens: 512,
      system: prompt.system,
      messages: [{ role: "user", content: prompt.user }],
    });
    raw = msg.content
      .filter((b) => b.type === "text")
      .map((b) => (b as { type: "text"; text: string }).text)
      .join("");
  } catch {
    return jsonError(502, "Intent classification failed");
  }

  const response = parseIntent(raw);
  return new Response(JSON.stringify(response), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
