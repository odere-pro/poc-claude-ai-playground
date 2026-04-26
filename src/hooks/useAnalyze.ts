"use client";

import { useCallback, useRef } from "react";
import { useReport } from "@/context/ReportContext";
import { consumeAnalyzeStream } from "@/lib/streamClient";
import type { AnalyzeRequest, ClauseEvent, SummaryEvent } from "@/lib/types";
import type { Dispatch } from "react";
import type { Action } from "@/context/ReportContext";

const FREE_TRIAL_STORAGE_KEY = "clauseguard.freeTrialUsed";

interface AnalyzeOptions {
  readonly onPaymentRequired?: () => void;
}

async function buildCustomModel(
  clauses: readonly ClauseEvent[],
  summary: SummaryEvent,
  dispatch: Dispatch<Action>,
): Promise<void> {
  dispatch({ type: "SET_MODEL_STATE", modelState: "building" });
  try {
    const phrases = [
      ...clauses.map((c) => c.title).filter(Boolean),
      ...clauses.flatMap((c) => (c.citation ? [c.citation.article, c.citation.label] : [])),
      summary.jurisdiction,
      summary.permitType ?? "",
    ].filter(Boolean);

    const res = await fetch("/api/reson8-model", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contractPhrases: phrases,
        contractName: `${summary.jurisdiction.toUpperCase()} ${summary.permitType ?? "contract"}`,
      }),
    });
    if (!res.ok) {
      dispatch({ type: "SET_MODEL_STATE", modelState: "failed" });
      return;
    }
    const { modelId } = (await res.json()) as { modelId?: string };
    if (modelId) {
      dispatch({ type: "SET_CUSTOM_MODEL_ID", id: modelId });
    } else {
      dispatch({ type: "SET_MODEL_STATE", modelState: "failed" });
    }
  } catch {
    dispatch({ type: "SET_MODEL_STATE", modelState: "failed" });
  }
}

/**
 * Bridge between the client SSE consumer and the reducer. The hook keeps the
 * pages dumb — page components only call `start(text)` and read state.
 */
export function useAnalyze(options: AnalyzeOptions = {}) {
  const { state, dispatch } = useReport();
  // Accumulate clauses locally during a run so onSummary can pass them to the
  // custom model builder without relying on potentially-stale reducer state.
  const clausesAccRef = useRef<ClauseEvent[]>([]);

  const start = useCallback(
    async (contractText: string) => {
      // Client-side free trial gate — avoids a round-trip when the trial is
      // already exhausted. The server still enforces via checkEntitlement.
      if (
        typeof window !== "undefined" &&
        window.localStorage.getItem(FREE_TRIAL_STORAGE_KEY) === "true"
      ) {
        options.onPaymentRequired?.();
        return;
      }

      clausesAccRef.current = [];
      dispatch({ type: "START_ANALYSIS" });
      const request: AnalyzeRequest = {
        contractText,
        permitType: state.permitType,
        jurisdiction: state.jurisdiction,
        detectedLanguage: state.detectedLanguage,
      };
      await consumeAnalyzeStream(request, {
        onBatch: (clauses) => {
          clausesAccRef.current.push(...clauses);
          dispatch({ type: "RECEIVE_CLAUSES_BATCH", clauses });
        },
        onSummary: (summary) => {
          dispatch({ type: "FINALIZE_REPORT", summary });
          // Mark the free trial as consumed once analysis completes successfully.
          if (typeof window !== "undefined") {
            window.localStorage.setItem(FREE_TRIAL_STORAGE_KEY, "true");
          }
          // Build a per-contract Reson8 custom model in the background so STT
          // is biased toward this contract's specific legal vocabulary.
          void buildCustomModel(clausesAccRef.current, summary, dispatch);
        },
        onError: (err) => {
          if (err.message === "payment_required") {
            options.onPaymentRequired?.();
            dispatch({ type: "STREAM_ERROR" });
            return;
          }
          dispatch({ type: "STREAM_ERROR" });
        },
      });
    },
    [dispatch, options, state.detectedLanguage, state.jurisdiction, state.permitType],
  );

  return { start };
}
