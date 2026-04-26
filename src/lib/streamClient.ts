import { clauseEventSchema, summaryEventSchema } from "./schemas";
import type { AnalyzeRequest, ClauseEvent, StreamEvent, SummaryEvent } from "./types";

interface ConsumeOptions {
  readonly onBatch: (clauses: readonly ClauseEvent[]) => void;
  readonly onSummary: (summary: SummaryEvent) => void;
  readonly onError: (err: Error) => void;
  readonly signal?: AbortSignal;
  /** Override default 100ms batching window. Tests use 0 for determinism. */
  readonly batchIntervalMs?: number;
}

const DEFAULT_BATCH_MS = 100;

/**
 * Open a POST stream against /api/analyze and surface events to the caller.
 *
 * Clause events are coalesced on a configurable interval (default 100ms) so
 * React isn't asked to render every single SSE chunk individually — the
 * reducer is called once per tick with the accumulated batch.
 *
 * On `data: [DONE]` the stream ends gracefully. On any other error the
 * caller's `onError` is invoked once, and any accumulated clauses are flushed
 * first so partial results are not lost.
 */
export async function consumeAnalyzeStream(
  body: AnalyzeRequest,
  options: ConsumeOptions,
): Promise<void> {
  const { onBatch, onSummary, onError, signal, batchIntervalMs = DEFAULT_BATCH_MS } = options;

  let pending: ClauseEvent[] = [];
  const flush = () => {
    if (pending.length === 0) return;
    const batch = pending;
    pending = [];
    onBatch(batch);
  };

  const intervalId = batchIntervalMs > 0 ? setInterval(flush, batchIntervalMs) : null;

  try {
    const res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });

    if (!res.ok) {
      const message = res.status === 402 ? "payment_required" : `http_${res.status}`;
      throw new Error(message);
    }
    if (!res.body) throw new Error("no_body");

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let seenDone = false;

    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // Events are separated by a blank line. Process every complete event.
      let sepIdx: number;
      while ((sepIdx = buffer.indexOf("\n\n")) !== -1) {
        const rawEvent = buffer.slice(0, sepIdx);
        buffer = buffer.slice(sepIdx + 2);
        const parsed = parseSSEEvent(rawEvent);
        if (!parsed) continue;
        if (parsed === "[DONE]") {
          seenDone = true;
          flush();
          if (intervalId !== null) clearInterval(intervalId);
          return;
        }
        if (parsed === "error") {
          throw new Error("upstream_failed");
        }
        if (parsed.type === "clause") pending.push(parsed);
        else if (parsed.type === "summary") {
          flush();
          onSummary(parsed);
        }
      }
    }

    flush();
    // Stream closed without [DONE] — server crashed or was interrupted.
    if (!seenDone) throw new Error("stream_incomplete");
  } catch (err: unknown) {
    flush();
    onError(err instanceof Error ? err : new Error(String(err)));
  } finally {
    if (intervalId !== null) clearInterval(intervalId);
  }
}

function parseSSEEvent(raw: string): StreamEvent | "[DONE]" | "error" | null {
  // Each event may have multiple "data: " lines per the SSE spec.
  const dataLines = raw
    .split("\n")
    .filter((l) => l.startsWith("data: "))
    .map((l) => l.slice(6));
  if (dataLines.length === 0) return null;
  const payload = dataLines.join("\n");
  if (payload === "[DONE]") return "[DONE]";
  let obj: unknown;
  try {
    obj = JSON.parse(payload);
  } catch {
    return null;
  }
  if (typeof obj !== "object" || obj === null) return null;
  const typed = obj as { type?: unknown };
  if (typed.type === "error") return "error";
  // Schema-validate before trusting the wire shape — malformed events from
  // a stale or compromised server are silently dropped instead of corrupting
  // typed state.
  if (typed.type === "clause") {
    const r = clauseEventSchema.safeParse(obj);
    return r.success ? r.data : null;
  }
  const s = summaryEventSchema.safeParse(obj);
  return s.success ? s.data : null;
}

export const __test__ = { parseSSEEvent };
