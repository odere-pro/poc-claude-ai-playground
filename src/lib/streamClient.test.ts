import { describe, it, expect, vi } from "vitest";
import { consumeAnalyzeStream, __test__ } from "./streamClient";
import type { AnalyzeRequest, ClauseEvent, SummaryEvent } from "./types";

const { parseSSEEvent } = __test__;

describe("parseSSEEvent", () => {
  it("parses a clause event", () => {
    const raw = `data: {"type":"clause","id":"c1","title":"x","status":"compliant","originalText":"","explanation":"","citation":null,"action":null,"permitConflict":null}`;
    const result = parseSSEEvent(raw);
    expect(result).toMatchObject({ type: "clause", id: "c1" });
  });

  it("parses a [DONE] terminator", () => {
    expect(parseSSEEvent("data: [DONE]")).toBe("[DONE]");
  });

  it("returns null for malformed JSON", () => {
    expect(parseSSEEvent("data: {bad")).toBeNull();
  });

  it("returns null for unknown event types", () => {
    expect(parseSSEEvent('data: {"type":"foo"}')).toBeNull();
  });

  it("ignores non-data lines (comments, retry, etc)", () => {
    expect(parseSSEEvent(": ping")).toBeNull();
  });
});

describe("consumeAnalyzeStream", () => {
  const baseRequest: AnalyzeRequest = {
    contractText: "x",
    permitType: "gvva",
    jurisdiction: "nl",
    detectedLanguage: "en",
  };

  const makeStreamResponse = (chunks: string[], status = 200): Response => {
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const encoder = new TextEncoder();
        for (const c of chunks) controller.enqueue(encoder.encode(c));
        controller.close();
      },
    });
    return new Response(stream, { status });
  };

  it("emits batches of clauses then a summary then completes on [DONE]", async () => {
    const clause = (id: string): ClauseEvent => ({
      type: "clause",
      id,
      title: id,
      status: "compliant",
      originalText: "",
      explanation: "",
      citation: null,
      action: null,
      permitConflict: null,
    });
    const summary: SummaryEvent = {
      type: "summary",
      jurisdiction: "nl",
      permitType: "gvva",
      detectedLanguage: "en",
      totalClauses: 2,
      illegalCount: 0,
      exploitativeCount: 0,
      permitConflictCount: 0,
      uncheckedCount: 0,
      compliantCount: 2,
      rights: [],
    };
    const body = [
      `data: ${JSON.stringify(clause("a"))}\n\n`,
      `data: ${JSON.stringify(clause("b"))}\n\n`,
      `data: ${JSON.stringify(summary)}\n\n`,
      `data: [DONE]\n\n`,
    ];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(makeStreamResponse(body)));

    const onBatch = vi.fn();
    const onSummary = vi.fn();
    const onError = vi.fn();

    await consumeAnalyzeStream(baseRequest, {
      onBatch,
      onSummary,
      onError,
      batchIntervalMs: 0, // synchronous: flush only on summary + done
    });

    expect(onError).not.toHaveBeenCalled();
    // With batchIntervalMs=0 we flush only on summary + final flush — both
    // clauses arrive together before the summary.
    const allBatched = onBatch.mock.calls.flatMap((args) => args[0] as ClauseEvent[]);
    expect(allBatched.map((c) => c.id)).toEqual(["a", "b"]);
    expect(onSummary).toHaveBeenCalledWith(summary);
  });

  it("calls onError on a 402 response with payment_required message", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 402 })));
    const onBatch = vi.fn();
    const onSummary = vi.fn();
    const onError = vi.fn();
    await consumeAnalyzeStream(baseRequest, { onBatch, onSummary, onError });
    expect(onError).toHaveBeenCalledOnce();
    expect(onError.mock.calls[0][0].message).toBe("payment_required");
  });

  it("calls onError when fetch itself rejects", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network drop")));

    const onBatch = vi.fn();
    const onSummary = vi.fn();
    const onError = vi.fn();
    await consumeAnalyzeStream(baseRequest, {
      onBatch,
      onSummary,
      onError,
      batchIntervalMs: 0,
    });

    expect(onError).toHaveBeenCalledOnce();
    expect(onError.mock.calls[0][0].message).toBe("network drop");
  });
});
