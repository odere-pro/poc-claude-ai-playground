"use client";

import { useCallback } from "react";
import { useReport } from "@/context/ReportContext";
import { consumeAnalyzeStream } from "@/lib/streamClient";
import type { AnalyzeRequest } from "@/lib/types";

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
      dispatch({ type: "START_ANALYSIS" });
      const request: AnalyzeRequest = {
        contractText,
        permitType: state.permitType,
        jurisdiction: state.jurisdiction,
        detectedLanguage: state.detectedLanguage,
      };
      await consumeAnalyzeStream(request, {
        onBatch: (clauses) => dispatch({ type: "RECEIVE_CLAUSES_BATCH", clauses }),
        onSummary: (summary) => dispatch({ type: "FINALIZE_REPORT", summary }),
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
