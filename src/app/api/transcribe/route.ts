import "server-only";

import type { NextRequest } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { MAX_AUDIO_BYTES, transcribeContextSchema, type TranscribeContext } from "@/lib/schemas";

export const runtime = "nodejs";
export const maxDuration = 30;

// Confirm these constants against Reson8 API docs if the endpoint or field
// names ever change — they are the only coupling points to Reson8's contract.
const RESON8_BASE_URL = "https://api.reson8.io/v1";
const DEFAULT_MODEL = "reson8-1";

// Reson8 may return the transcript under "text" or "transcript" depending on
// the model version. We try both rather than hard-coding one field name.
function extractTranscript(raw: unknown): string {
  const r = raw as Record<string, unknown>;
  if (typeof r.text === "string") return r.text;
  if (typeof r.transcript === "string") return r.transcript;
  return "";
}

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: NextRequest): Promise<Response> {
  if (!rateLimit(req, "transcribe", { capacity: 30, refillPerSec: 30 / 60 })) {
    return jsonError(429, "Too many requests. Slow down.");
  }

  if (process.env.NEXT_PUBLIC_VOICE_ENABLED !== "true") {
    return jsonError(503, "Voice features are not enabled");
  }

  const apiKey = process.env.RESON8_API_KEY;
  if (!apiKey) {
    return jsonError(503, "Transcription service not configured");
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return jsonError(400, "Expected multipart/form-data");
  }

  const audio = form.get("audio");
  if (!(audio instanceof File)) {
    return jsonError(400, "Missing 'audio' field");
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return jsonError(413, "Audio file too large (max 10 MB)");
  }
  if (!audio.type.startsWith("audio/") && audio.type !== "video/webm") {
    return jsonError(400, "Unsupported audio format");
  }

  // Parse context — soft-fail to safe defaults so a missing/malformed context
  // never blocks transcription. The model still gets a usable language hint.
  let ctx: TranscribeContext = {
    jurisdiction: "nl",
    permitType: "",
    detectedLanguage: "en",
    vocabulary: [],
    prompt: "",
  };
  const rawCtx = form.get("context");
  if (typeof rawCtx === "string") {
    try {
      const parsed = transcribeContextSchema.safeParse(JSON.parse(rawCtx));
      if (parsed.success) ctx = parsed.data;
    } catch {
      // Use defaults — not a fatal error.
    }
  }

  // Build Reson8 request
  const reson8Form = new FormData();
  reson8Form.set("audio", audio);
  reson8Form.set("model", process.env.RESON8_MODEL_ID ?? DEFAULT_MODEL);
  reson8Form.set("language", ctx.detectedLanguage);
  if (ctx.vocabulary.length > 0) {
    reson8Form.set("vocabulary", JSON.stringify(ctx.vocabulary));
  }
  if (ctx.prompt) {
    reson8Form.set("prompt", ctx.prompt);
  }

  const started = performance.now();

  let reson8Res: Response;
  try {
    reson8Res = await fetch(`${RESON8_BASE_URL}/transcribe`, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: reson8Form,
    });
  } catch {
    return jsonError(502, "Transcription service unreachable");
  }

  if (!reson8Res.ok) {
    const msg =
      reson8Res.status === 401
        ? "Invalid transcription API key"
        : `Transcription service returned ${reson8Res.status}`;
    return jsonError(502, msg);
  }

  let raw: unknown;
  try {
    raw = await reson8Res.json();
  } catch {
    return jsonError(502, "Transcription service returned invalid JSON");
  }

  const transcript = extractTranscript(raw);
  const durationMs = Math.round(performance.now() - started);

  return new Response(JSON.stringify({ transcript, durationMs }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
