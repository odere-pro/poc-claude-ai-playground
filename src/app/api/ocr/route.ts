import "server-only";

import { NextRequest } from "next/server";
import { rateLimit } from "@/lib/rateLimit";
import { MAX_UPLOAD_BYTES, validateUpload, type UploadValidationFailure } from "@/lib/uploadValidation";

export const runtime = "nodejs";
export const maxDuration = 60;

const MISTRAL_OCR_URL = "https://api.mistral.ai/v1/ocr";

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function statusForFailure(reason: UploadValidationFailure): number {
  return reason === "too_large" ? 413 : 400;
}

function messageForFailure(reason: UploadValidationFailure): string {
  switch (reason) {
    case "empty":          return "Empty file";
    case "too_large":      return "File too large";
    case "mime_not_allowed": return "Unsupported file type";
    case "magic_mismatch": return "File contents do not match declared type";
  }
}

export async function POST(req: NextRequest): Promise<Response> {
  if (!rateLimit(req, "ocr", { capacity: 5, refillPerSec: 5 / 60 })) {
    return jsonError(429, "Too many requests. Slow down.");
  }

  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    return jsonError(503, "OCR service not configured");
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return jsonError(400, "Expected multipart/form-data");
  }

  const candidate = form.get("file");
  if (!(candidate instanceof File)) {
    return jsonError(400, "Missing 'file' field");
  }

  if (candidate.type !== "application/pdf") {
    return jsonError(400, "OCR currently supports PDF only");
  }

  if (candidate.size > MAX_UPLOAD_BYTES) {
    return jsonError(413, "File too large");
  }

  const bytes = new Uint8Array(await candidate.arrayBuffer());

  const validation = validateUpload({
    declaredMime: candidate.type,
    sizeBytes: candidate.size,
    head: bytes.slice(0, 16),
  });
  if (!validation.ok) {
    return jsonError(statusForFailure(validation.reason), messageForFailure(validation.reason));
  }

  const started = performance.now();

  // Mistral OCR accepts a data-URL with the PDF encoded as base64.
  const base64 = Buffer.from(bytes).toString("base64");
  const dataUrl = `data:application/pdf;base64,${base64}`;

  let mistralRes: Response;
  try {
    mistralRes = await fetch(MISTRAL_OCR_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistral-ocr-latest",
        document: { type: "document_url", document_url: dataUrl },
      }),
    });
  } catch {
    return jsonError(502, "OCR service unreachable");
  }

  if (!mistralRes.ok) {
    const body = await mistralRes.text().catch(() => "");
    const msg = mistralRes.status === 401 ? "Invalid OCR API key" : `OCR service returned ${mistralRes.status}`;
    console.error("Mistral OCR error:", mistralRes.status, body);
    return jsonError(502, msg);
  }

  let raw: unknown;
  try {
    raw = await mistralRes.json();
  } catch {
    return jsonError(502, "OCR service returned invalid JSON");
  }

  // Mistral response: { pages: [{ index, markdown, ... }], ... }
  const pages = (raw as { pages?: { markdown?: string }[] }).pages ?? [];
  const text = pages
    .map((p) => (p.markdown ?? "").trim())
    .filter(Boolean)
    .join("\n\n");

  if (!text) {
    return jsonError(422, "No text extracted from PDF");
  }

  const durationMs = Math.round(performance.now() - started);

  return new Response(
    JSON.stringify({ text, pages: pages.length, durationMs }),
    { status: 200, headers: { "Content-Type": "application/json" } },
  );
}
