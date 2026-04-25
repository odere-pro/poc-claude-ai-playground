import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import type { NextRequest } from "next/server";
import { buildVoiceIntentPrompt } from "@/lib/prompts";
import type { VoiceCommandRequest, VoiceCommandResponse } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 512;

export async function POST(req: NextRequest): Promise<Response> {
  if (process.env.NEXT_PUBLIC_VOICE_ENABLED !== "true") {
    return Response.json({ error: "Voice commands unavailable." }, { status: 503 });
  }

  let body: VoiceCommandRequest;
  try {
    body = (await req.json()) as VoiceCommandRequest;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (
    typeof body.transcript !== "string" ||
    body.transcript.length === 0 ||
    !body.reportContext ||
    typeof body.reportContext !== "object"
  ) {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  try {
    const client = new Anthropic();
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: buildVoiceIntentPrompt(body.reportContext),
      messages: [{ role: "user", content: body.transcript }],
    });

    const block = msg.content[0];
    if (!block || block.type !== "text") {
      throw new Error("Empty model response");
    }

    const parsed = JSON.parse(block.text) as VoiceCommandResponse;
    return Response.json(parsed);
  } catch (err) {
    console.error(
      "Voice intent classification failed:",
      err instanceof Error ? err.message : "unknown",
    );
    return Response.json({ error: "Voice command unavailable." }, { status: 502 });
  }
}
