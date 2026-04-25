import type { AnalyzeRequest, ClauseEvent, StreamEvent, SummaryEvent } from "./types";

interface StreamHandlers {
  readonly onBatch: (clauses: readonly ClauseEvent[]) => void;
  readonly onSummary: (summary: SummaryEvent) => void;
  readonly onError: () => void;
}

const BATCH_INTERVAL_MS = 100;

export async function consumeAnalyzeStream(
  body: AnalyzeRequest,
  { onBatch, onSummary, onError }: StreamHandlers,
): Promise<void> {
  let res: Response;
  try {
    res = await fetch("/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    onError();
    return;
  }

  if (!res.ok || !res.body) {
    onError();
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let batch: ClauseEvent[] = [];
  let flushTimer: ReturnType<typeof setTimeout> | null = null;

  const flush = (): void => {
    if (batch.length > 0) {
      onBatch(batch);
      batch = [];
    }
    flushTimer = null;
  };

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let idx: number;
      while ((idx = buffer.indexOf("\n\n")) !== -1) {
        const frame = buffer.slice(0, idx).trim();
        buffer = buffer.slice(idx + 2);
        if (!frame.startsWith("data: ")) continue;

        const payload = frame.slice(6);
        if (payload === "[DONE]") {
          flush();
          return;
        }

        let evt: StreamEvent;
        try {
          evt = JSON.parse(payload) as StreamEvent;
        } catch {
          continue;
        }

        if (evt.type === "clause") {
          batch.push(evt);
          if (!flushTimer) flushTimer = setTimeout(flush, BATCH_INTERVAL_MS);
        } else if (evt.type === "summary") {
          flush();
          onSummary(evt);
        } else if (evt.type === "error") {
          onError();
          return;
        }
      }
    }
  } catch {
    onError();
  } finally {
    if (flushTimer) clearTimeout(flushTimer);
    flush();
  }
}
