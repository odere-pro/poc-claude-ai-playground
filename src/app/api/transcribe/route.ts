import "server-only";
import type { NextRequest } from "next/server";
import { rateLimit } from "@/lib/rateLimit";

export const runtime = "nodejs";
export const maxDuration = 30;

const RESON8_URL = "https://api.reson8.dev/v1/speech-to-text";
const DEFAULT_LANGUAGE = "nl-NL";
const MAX_AUDIO_BYTES = 10 * 1024 * 1024;

export async function POST(req: NextRequest): Promise<Response> {
  if (!rateLimit(req, "transcribe", { capacity: 30, refillPerSec: 30 / 60 })) {
    return Response.json({ error: "Too many requests. Slow down." }, { status: 429 });
  }

  if (process.env.NEXT_PUBLIC_VOICE_ENABLED !== "true") {
    return Response.json({ error: "Voice transcription unavailable." }, { status: 503 });
  }

  const apiKey = process.env.RESON8_API_KEY;
  const modelId = process.env.RESON8_MODEL_ID;
  if (!apiKey || !modelId) {
    return Response.json({ error: "Voice transcription unavailable." }, { status: 503 });
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return Response.json({ error: "Missing audio." }, { status: 400 });
  }

  const audio = form.get("audio");
  if (!(audio instanceof Blob) || audio.size === 0) {
    return Response.json({ error: "Missing audio." }, { status: 400 });
  }
  if (audio.size > MAX_AUDIO_BYTES) {
    return Response.json({ error: "Audio file too large." }, { status: 413 });
  }

  const upstream = new FormData();
  upstream.append("audio", audio, "recording.webm");
  upstream.append("model_id", modelId);

  try {
    const res = await fetch(RESON8_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: upstream,
    });
    if (!res.ok) {
      throw new Error(`Reson8 ${res.status}`);
    }
    const data = (await res.json()) as {
      transcript?: string;
      language?: string;
    };
    return Response.json({
      transcript: data.transcript ?? "",
      detectedLanguage: data.language ?? DEFAULT_LANGUAGE,
    });
  } catch (err) {
    console.error("Reson8 transcription failed:", err instanceof Error ? err.message : "unknown");
    return Response.json({ error: "Voice transcription unavailable." }, { status: 503 });
  }
}
