import "server-only";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const RESON8_URL = "https://api.reson8.dev/v1/speech-to-text";
const DEFAULT_LANGUAGE = "nl-NL";

export async function POST(req: NextRequest): Promise<Response> {
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
