export const runtime = "nodejs";
export const maxDuration = 30;

/**
 * Stub: transcription is gated behind NEXT_PUBLIC_VOICE_ENABLED (P1).
 * The real Reson8 proxy lands in Phase 6.
 */
export async function POST(): Promise<Response> {
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
