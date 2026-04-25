// Client-side contract extraction. PDF parser is lazy-loaded so it does
// not bloat the initial bundle.

const PDF_TYPE = "application/pdf";
const MAX_TEXT_BYTES = 100_000;

export async function extractContractText(file: File): Promise<string> {
  if (file.type === PDF_TYPE) {
    return extractFromPdf(file);
  }
  // Plain text fallback (TXT fixtures + manual paste-as-file flows).
  const text = await file.text();
  return clamp(text);
}

async function extractFromPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  // Disable the worker so we can run in test/SSR environments without
  // shipping a separate worker bundle. Performance hit is acceptable for
  // the document sizes we accept (≤ 10MB).
  pdfjs.GlobalWorkerOptions.workerSrc = "";

  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({
    data: new Uint8Array(buf),
    isEvalSupported: false,
  }).promise;

  const parts: string[] = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const page = await doc.getPage(p);
    const content = await page.getTextContent();
    const lineText = content.items
      .map((it) => ("str" in it ? it.str : ""))
      .filter(Boolean)
      .join(" ");
    parts.push(lineText);
  }
  return clamp(parts.join("\n\n"));
}

function clamp(text: string): string {
  if (text.length <= MAX_TEXT_BYTES) return text;
  return text.slice(0, MAX_TEXT_BYTES);
}
