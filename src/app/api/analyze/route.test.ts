import { describe, expect, it } from "vitest";
import { POST } from "./route";

const url = "http://localhost:3000/api/analyze";

const validBody = {
  contractText: "Sample clause.",
  permitType: "gvva",
  jurisdiction: "nl",
  detectedLanguage: "en",
};

const makeRequest = (body: unknown, query = ""): Request =>
  new Request(`${url}${query}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });

describe("POST /api/analyze", () => {
  it("returns 402 immediately when force_402=true (no upstream call)", async () => {
    const res = await POST(makeRequest(validBody, "?force_402=true") as never);
    expect(res.status).toBe(402);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/limit/i);
  });

  it("returns 400 for malformed JSON", async () => {
    const res = await POST(makeRequest("{not json", "") as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid request shape", async () => {
    const res = await POST(makeRequest({ ...validBody, jurisdiction: "fr" }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 for missing required fields", async () => {
    const res = await POST(makeRequest({ contractText: "x" }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 413 for contract text > 500KB", async () => {
    const tooBig = "x".repeat(500 * 1024 + 1);
    const res = await POST(makeRequest({ ...validBody, contractText: tooBig }) as never);
    expect(res.status).toBe(413);
  });

  it("does NOT echo the input back in error responses", async () => {
    const secretText = "VERY-SENSITIVE-CONTRACT-PII-1234567890";
    const res = await POST(
      makeRequest({ ...validBody, contractText: secretText, jurisdiction: "fr" }) as never,
    );
    const body = await res.text();
    expect(body).not.toContain(secretText);
  });
});
