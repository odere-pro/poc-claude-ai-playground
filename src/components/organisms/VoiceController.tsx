"use client";

import { Button } from "@/components/ui/button";
import { useReport } from "@/context/ReportContext";
import { useVoice } from "@/hooks/useVoice";

export function VoiceController() {
  // Always call hooks before any conditional return — rules-of-hooks.
  const { state } = useReport();
  const { startListening, stopAndProcess, cancel } = useVoice();

  if (process.env.NEXT_PUBLIC_VOICE_ENABLED !== "true") return null;

  const { voiceState } = state;
  const isListening = voiceState === "listening";
  const isProcessing = voiceState === "processing";
  const isSpeaking = voiceState === "speaking";

  const handleClick = () => {
    if (voiceState === "idle") void startListening();
    else if (isListening) void stopAndProcess();
    else cancel();
  };

  const label = isListening
    ? "Stop"
    : isProcessing
      ? "Processing…"
      : isSpeaking
        ? "Speaking…"
        : "🎙 Speak";

  return (
    <div data-testid="voice-controller" className="fixed right-6 bottom-6 z-20">
      <Button
        size="lg"
        variant={isListening ? "destructive" : "default"}
        onClick={handleClick}
        disabled={isProcessing}
        aria-label={
          isListening
            ? "Stop recording and transcribe"
            : isSpeaking
              ? "Cancel speech"
              : isProcessing
                ? "Processing voice input"
                : "Start voice navigation"
        }
      >
        {label}
      </Button>
    </div>
  );
}
