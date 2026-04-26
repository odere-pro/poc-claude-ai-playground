"use client";

import { Button } from "@/components/ui/button";
import { useReport } from "@/context/ReportContext";
import { useVoice } from "@/hooks/useVoice";

export function VoiceController() {
  const { state, dispatch } = useReport();
  const { startListening, stopAndProcess, cancel } = useVoice();

  if (process.env.NEXT_PUBLIC_VOICE_ENABLED !== "true") return null;

  const { voiceState, modelState, lastSpokenText } = state;
  const isListening = voiceState === "listening";
  const isProcessing = voiceState === "processing";
  const isSpeaking = voiceState === "speaking";

  const handleClick = () => {
    if (isSpeaking) {
      dispatch({ type: "SET_VOICE_STATE", voiceState: "idle" });
      return;
    }
    if (voiceState === "idle") void startListening();
    else if (isListening) void stopAndProcess();
    else cancel();
  };

  const label = isListening
    ? "Stop"
    : isProcessing
      ? "Processing…"
      : isSpeaking
        ? "Dismiss"
        : "🎙 Ask";

  const modelBadge =
    modelState === "building"
      ? "⏳ preparing model…"
      : modelState === "ready"
        ? "✓ model ready"
        : null;

  return (
    <div
      data-testid="voice-controller"
      className="fixed right-6 bottom-6 z-20 flex max-w-sm flex-col items-end gap-2"
    >
      {isSpeaking && lastSpokenText && (
        <div className="rounded-lg border border-gray-200 bg-white p-4 text-sm leading-relaxed text-gray-800 shadow-lg">
          {lastSpokenText}
        </div>
      )}
      {modelBadge && !isSpeaking && (
        <span className="rounded-full border border-gray-200 bg-white/80 px-2 py-0.5 text-xs text-gray-500">
          {modelBadge}
        </span>
      )}
      <Button
        size="lg"
        variant={isListening ? "destructive" : "default"}
        onClick={handleClick}
        disabled={isProcessing}
        aria-label={
          isListening
            ? "Stop recording and transcribe"
            : isSpeaking
              ? "Dismiss answer"
              : isProcessing
                ? "Processing voice input"
                : "Ask a question about your contract"
        }
      >
        {label}
      </Button>
    </div>
  );
}
