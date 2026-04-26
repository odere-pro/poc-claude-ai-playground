/**
 * One-shot script: OCR every filled contract PDF and write ground-truth text files.
 *
 * Usage (from repo root):
 *   node --env-file .env.local scripts/ocr-fixtures.mjs
 *
 * Output: data/contract-types/ground-truth/{typeId}.txt
 * When multiple PDFs map to the same type they are concatenated with a separator.
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

const MISTRAL_OCR_URL = "https://api.mistral.ai/v1/ocr";
const FILLED_DIR = join(ROOT, "data", "fixtures", "filled");
const OUT_DIR = join(ROOT, "data", "contract-types", "ground-truth");
const INDEX_PATH = join(ROOT, "data", "contract-types", "index.json");

const apiKey = process.env.MISTRAL_API_KEY;
if (!apiKey) {
  console.error("MISTRAL_API_KEY is not set. Run with: node --env-file .env.local scripts/ocr-fixtures.mjs");
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });

const index = JSON.parse(readFileSync(INDEX_PATH, "utf-8"));

async function ocrPdf(filePath) {
  const bytes = readFileSync(filePath);
  const base64 = bytes.toString("base64");
  const dataUrl = `data:application/pdf;base64,${base64}`;

  const res = await fetch(MISTRAL_OCR_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "mistral-ocr-latest",
      document: { type: "document_url", document_url: dataUrl },
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Mistral ${res.status}: ${body.slice(0, 200)}`);
  }

  const data = await res.json();
  const pages = data.pages ?? [];
  return pages
    .map((p) => (p.markdown ?? "").trim())
    .filter(Boolean)
    .join("\n\n");
}

let total = 0;
let failed = 0;

for (const entry of index) {
  const texts = [];

  for (const filename of entry.files) {
    const pdfPath = join(FILLED_DIR, filename);
    process.stdout.write(`  OCR: ${filename} → `);
    try {
      const text = await ocrPdf(pdfPath);
      texts.push(`=== Source: ${filename} ===\n\n${text}`);
      console.log(`${text.length} chars`);
      total++;
    } catch (err) {
      console.log(`FAILED (${err.message})`);
      failed++;
    }
  }

  if (texts.length > 0) {
    const outPath = join(OUT_DIR, `${entry.id}.txt`);
    writeFileSync(outPath, texts.join("\n\n---\n\n"), "utf-8");
    console.log(`✓ Wrote ${entry.id}.txt (${entry.files.length} source file(s))\n`);
  } else {
    console.warn(`⚠ No text produced for ${entry.id} — skipping\n`);
  }
}

console.log(`\nDone. ${total} PDFs succeeded, ${failed} failed.`);
console.log(`Ground-truth files written to: data/contract-types/ground-truth/`);
