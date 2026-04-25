import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "./route";

const url = "http://localhost:3000/api/ocr";

const PDF_HEADER = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]);

function makePdfFile(name = "contract.pdf", size = 2048): File {
  const padding = new Uint8Array(size - PDF_HEADER.length);
  return new File([PDF_HEADER, padding], name, { type: "application/pdf" });
}

// Each test gets a fresh "client IP" so the module-level rate-limit bucket
// (capacity: 5/min) doesn't carry tokens between cases.
let ipCounter = 0;
function makeRequest(form: FormData): Request {
  ipCounter += 1;
  return new Request(url, {
    method: "POST",
    body: form,
    headers: { "x-real-ip": `10.0.0.${ipCounter}` },
  });
}

const ORIGINAL_FETCH = globalThis.fetch;
const ORIGINAL_KEY = process.env.MISTRAL_API_KEY;

function mistralOk(pages: { markdown: string }[]): Response {
  return new Response(JSON.stringify({ pages }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

beforeEach(() => {
  process.env.MISTRAL_API_KEY = "test-mistral-key";
});

afterEach(() => {
  globalThis.fetch = ORIGINAL_FETCH;
  process.env.MISTRAL_API_KEY = ORIGINAL_KEY;
  vi.restoreAllMocks();
});

describe("POST /api/ocr", () => {
  it("forwards a valid PDF to Mistral and returns extracted text", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      mistralOk([
        { markdown: "Article 1. Contract clauses follow…" },
        { markdown: "Article 2. More clauses." },
      ]),
    );

    const fd = new FormData();
    fd.append("file", makePdfFile());
    const res = await POST(makeRequest(fd) as never);

    expect(res.status).toBe(200);
    const body = (await res.json()) as Record<string, unknown>;
    expect(body.text).toBe(
      "Article 1. Contract clauses follow…\n\nArticle 2. More clauses.",
    );
    expect(body.pages).toBe(2);
    expect(typeof body.durationMs).toBe("number");

    const fetchMock = globalThis.fetch as ReturnType<typeof vi.fn>;
    const [calledUrl, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toBe("https://api.mistral.ai/v1/ocr");
    expect((init.headers as Record<string, string>)["Authorization"]).toBe(
      "Bearer test-mistral-key",
    );
  });

  it("returns 400 when the file field is missing", async () => {
    const fd = new FormData();
    const res = await POST(makeRequest(fd) as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 for non-PDF MIME types", async () => {
    const fd = new FormData();
    fd.append(
      "file",
      new File([new Uint8Array([0xff, 0xd8, 0xff])], "photo.jpg", { type: "image/jpeg" }),
    );
    const res = await POST(makeRequest(fd) as never);
    expect(res.status).toBe(400);
  });

  it("returns 413 for files over MAX_UPLOAD_BYTES", async () => {
    const fd = new FormData();
    fd.append("file", makePdfFile("huge.pdf", 11 * 1024 * 1024));
    const res = await POST(makeRequest(fd) as never);
    expect(res.status).toBe(413);
  });

  it("returns 400 for renamed binaries (magic-byte mismatch)", async () => {
    const fd = new FormData();
    fd.append(
      "file",
      new File([new Uint8Array([0xde, 0xad, 0xbe, 0xef])], "fake.pdf", {
        type: "application/pdf",
      }),
    );
    const res = await POST(makeRequest(fd) as never);
    expect(res.status).toBe(400);
  });

  it("returns 503 when MISTRAL_API_KEY is unset", async () => {
    delete process.env.MISTRAL_API_KEY;
    const fd = new FormData();
    fd.append("file", makePdfFile());
    const res = await POST(makeRequest(fd) as never);
    expect(res.status).toBe(503);
  });

  it("returns 502 when the Mistral fetch throws", async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error("ECONNREFUSED"));
    const fd = new FormData();
    fd.append("file", makePdfFile());
    const res = await POST(makeRequest(fd) as never);
    expect(res.status).toBe(502);
  });

  it("returns 502 when Mistral returns non-2xx", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ message: "Unauthorized" }), { status: 401 }),
    );
    const fd = new FormData();
    fd.append("file", makePdfFile());
    const res = await POST(makeRequest(fd) as never);
    expect(res.status).toBe(502);
  });

  it("returns 502 when Mistral returns non-JSON", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response("<!doctype html><html>oops</html>", { status: 200 }),
    );
    const fd = new FormData();
    fd.append("file", makePdfFile());
    const res = await POST(makeRequest(fd) as never);
    expect(res.status).toBe(502);
  });

  it("returns 422 when Mistral returns pages with no extractable text", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(mistralOk([{ markdown: "" }]));
    const fd = new FormData();
    fd.append("file", makePdfFile());
    const res = await POST(makeRequest(fd) as never);
    expect(res.status).toBe(422);
  });

  it("returns 422 when Mistral returns empty pages array", async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(mistralOk([]));
    const fd = new FormData();
    fd.append("file", makePdfFile());
    const res = await POST(makeRequest(fd) as never);
    expect(res.status).toBe(422);
  });
});
