"use client";

import { useCallback } from "react";
import { useReport } from "@/context/ReportContext";
import { consumeAnalyzeStream } from "@/lib/streamClient";
import type { AnalyzeRequest } from "@/lib/types";

const FREE_TRIAL_STORAGE_KEY = "clauseguard.freeTrialUsed";

interface AnalyzeOptions {
  readonly onPaymentRequired?: () => void;
}

/**
 * Bridge between the client SSE consumer and the reducer. The hook keeps the
 * pages dumb — page components only call `start(text)` and read state.
 */
export function useAnalyze(options: AnalyzeOptions = {}) {
  const { state, dispatch } = useReport();

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

      dispatch({ type: "START_ANALYSIS" });
      const request: AnalyzeRequest = {
        contractText,
        permitType: state.permitType,
        jurisdiction: state.jurisdiction,
        detectedLanguage: state.detectedLanguage,
      };
      await consumeAnalyzeStream(request, {
        onBatch: (clauses) => dispatch({ type: "RECEIVE_CLAUSES_BATCH", clauses }),
        onSummary: (summary) => {
          dispatch({ type: "FINALIZE_REPORT", summary });
          // Mark the free trial as consumed once analysis completes successfully.
          if (typeof window !== "undefined") {
            window.localStorage.setItem(FREE_TRIAL_STORAGE_KEY, "true");
          }
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
