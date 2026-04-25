import type { NextRequest } from "next/server";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Stub: transcription is gated behind NEXT_PUBLIC_VOICE_ENABLED (P1).
 * The real Reson8 proxy lands in Phase 6.
 *
 * Rate limit applies even on the stub so the public 503 surface
 * doesn't become a free amplifier vector.
 */
export async function POST(req: NextRequest): Promise<Response> {
  if (!rateLimit(req, "transcribe", { capacity: 30, refillPerSec: 30 / 60 })) {
    return new Response(JSON.stringify({ error: "Too many requests. Slow down." }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (process.env.NEXT_PUBLIC_VOICE_ENABLED !== "true") {
    return new Response(JSON.stringify({ error: "Voice features are not enabled" }), {
      status: 503,
      headers: { "Content-Type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ error: "Transcription is not yet implemented" }), {
    status: 501,
    headers: { "Content-Type": "application/json" },
  });
}
