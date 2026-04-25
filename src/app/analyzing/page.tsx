"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/organisms/AppHeader";
import { AnalysisProgress } from "@/components/organisms/AnalysisProgress";
import { VoiceController } from "@/components/organisms/VoiceController";
import { Button } from "@/components/atoms/Button";
import { consumeAnalyzeStream } from "@/lib/streamClient";
import { useReport, useReportDispatch } from "@/context/ReportContext";

export default function AnalyzingPage() {
  const state = useReport();
  const dispatch = useReportDispatch();
  const router = useRouter();
  const startedRef = useRef(false);

  useEffect(() => {
    // Avoid double-fire under React strict-mode dev re-mounts.
    if (startedRef.current) return;
    if (state.phase !== "analyzing") {
      router.replace("/");
      return;
    }
    if (!state.contractText) {
      router.replace("/");
      return;
    }
    startedRef.current = true;

    void consumeAnalyzeStream(
      {
        contractText: state.contractText,
        permitType: state.permitType,
        jurisdiction: state.jurisdiction,
        detectedLanguage: state.detectedLanguage,
      },
      {
        onBatch: (clauses) => dispatch({ type: "RECEIVE_CLAUSES_BATCH", payload: clauses }),
        onSummary: (summary) => {
          dispatch({ type: "FINALIZE_REPORT", payload: summary });
          router.push("/results");
        },
        onError: () => dispatch({ type: "STREAM_ERROR" }),
      },
    );
  }, [
    state.phase,
    state.contractText,
    state.permitType,
    state.jurisdiction,
    state.detectedLanguage,
    dispatch,
    router,
  ]);

  return (
    <>
      <AppHeader />
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-10">
        {state.phase === "incomplete" ? (
          <section
            data-testid="analysis-incomplete-banner"
            className="flex flex-col gap-3 rounded-md p-4"
            style={{ backgroundColor: "var(--color-status-illegal-bg)" }}
          >
            <p style={{ color: "var(--color-status-illegal)" }}>
              Analysis paused. We received partial results.
            </p>
            <div>
              <Button
                onClick={() => {
                  dispatch({ type: "RESET" });
                  router.push("/");
                }}
              >
                Try again
              </Button>
            </div>
          </section>
        ) : (
          <AnalysisProgress />
        )}
      </main>
      <VoiceController />
    </>
  );
}
