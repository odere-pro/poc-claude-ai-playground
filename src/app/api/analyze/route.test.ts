import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "../../../../tests/mocks/server";
import { mockClaudeStreamChunks } from "../../../../tests/mocks/mock-stream";
import type { ClauseEvent, StreamEvent, SummaryEvent } from "@/lib/types";

vi.mock("@anthropic-ai/sdk", () => {
  return {
    default: class MockAnthropic {
      messages = {
        stream: async () => mockClaudeStreamChunks(),
      };
    },
  };
});

const { POST } = await import("./route");

beforeEach(() => {
  process.env.ANTHROPIC_API_KEY = "test-key";
  process.env.SOLVIMON_API_KEY = "test-solvimon-key";
  vi.spyOn(console, "warn").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

function makeRequest(body: unknown, search = ""): Request {
  const url = `http://localhost/api/analyze${search}`;
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

async function readSseEvents(res: Response): Promise<readonly StreamEvent[]> {
  const text = await res.text();
  const events: StreamEvent[] = [];
  for (const line of text.split("\n\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("data: ")) continue;
    const payload = trimmed.slice(6);
    if (payload === "[DONE]") continue;
    try {
      events.push(JSON.parse(payload) as StreamEvent);
    } catch {
      // ignore malformed
    }
  }
  return events;
}

describe("POST /api/analyze — request validation", () => {
  it("returns 402 when ?force_402=true", async () => {
    const res = await POST(
      makeRequest(
        { contractText: "x", permitType: "gvva", jurisdiction: "nl" },
        "?force_402=true",
      ) as never,
    );
    expect(res.status).toBe(402);
    const body = (await res.json()) as { error: string };
    expect(body.error).toMatch(/limit reached/i);
  });

  it("returns 400 on malformed JSON body", async () => {
    const res = await POST(makeRequest("{ not-valid") as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when contractText is missing", async () => {
    const res = await POST(makeRequest({ permitType: "gvva" }) as never);
    expect(res.status).toBe(400);
  });

  it("returns 400 when contractText exceeds 100KB", async () => {
    const huge = "a".repeat(100_001);
    const res = await POST(
      makeRequest({
        contractText: huge,
        permitType: "gvva",
        jurisdiction: "nl",
      }) as never,
    );
    expect(res.status).toBe(400);
  });

  it("returns 400 when permitType is missing", async () => {
    const res = await POST(makeRequest({ contractText: "x", jurisdiction: "nl" }) as never);
    expect(res.status).toBe(400);
  });
});

describe("POST /api/analyze — successful streaming", () => {
  it("streams 6 clause events + 1 summary + [DONE] and returns SSE content type", async () => {
    const res = await POST(
      makeRequest({
        contractText: "Sample NL contract text for the integration test.",
        permitType: "gvva",
        jurisdiction: "nl",
        detectedLanguage: "nl",
      }) as never,
    );
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("text/event-stream");

    const events = await readSseEvents(res);
    const clauses = events.filter((e): e is ClauseEvent => e.type === "clause");
    const summaries = events.filter((e): e is SummaryEvent => e.type === "summary");
    expect(clauses).toHaveLength(6);
    expect(summaries).toHaveLength(1);
    expect(summaries[0].totalClauses).toBe(6);
    expect(summaries[0].illegalCount).toBe(2);
    expect(summaries[0].uncheckedCount).toBe(2);
  });

  it("re-emits valid citations untouched and downgrades hallucinated ones", async () => {
    const res = await POST(
      makeRequest({
        contractText: "Sample NL contract text for the integration test.",
        permitType: "gvva",
        jurisdiction: "nl",
        detectedLanguage: "nl",
      }) as never,
    );
    const events = await readSseEvents(res);
    const clauses = events.filter((e): e is ClauseEvent => e.type === "clause");
    for (const c of clauses) {
      if (c.citation) {
        expect(c.citation.source).toBe("nl-labor-law.json");
      }
    }
  });
});

describe("POST /api/analyze — Solvimon soft-fail", () => {
  it("proceeds with analysis when entitlement endpoint errors", async () => {
    server.use(
      http.get("https://test.api.solvimon.com/v1/customers/:customerId/entitlements", () =>
        HttpResponse.error(),
      ),
    );
    const res = await POST(
      makeRequest({
        contractText: "Sample contract.",
        permitType: "gvva",
        jurisdiction: "nl",
        detectedLanguage: "nl",
        customerId: "cus_test",
      }) as never,
    );
    expect(res.status).toBe(200);
    const events = await readSseEvents(res);
    expect(events.some((e) => e.type === "summary")).toBe(true);
  });

  it("returns 402 when entitlement says remaining is 0", async () => {
    server.use(
      http.get("https://test.api.solvimon.com/v1/customers/:customerId/entitlements", () =>
        HttpResponse.json({
          entitlements: [{ reference: "analyses_completed", remaining: 0 }],
        }),
      ),
    );
    const res = await POST(
      makeRequest({
        contractText: "Sample contract.",
        permitType: "gvva",
        jurisdiction: "nl",
        detectedLanguage: "nl",
        customerId: "cus_test",
      }) as never,
    );
    expect(res.status).toBe(402);
  });
});
