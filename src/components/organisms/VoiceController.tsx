"use client";

import { Button } from "@/components/ui/button";
import { useReport } from "@/context/ReportContext";

/**
 * Voice navigation entry point. P1 — only mounts when
 * NEXT_PUBLIC_VOICE_ENABLED === "true". Real Reson8 + tool-use
 * integration lands later; this scaffold drives the state-machine
 * via the existing reducer so wiring is in place.
 */
export function VoiceController() {
  // Always call hooks before any conditional return — rules-of-hooks.
  const { state, dispatch } = useReport();
  if (process.env.NEXT_PUBLIC_VOICE_ENABLED !== "true") return null;
  const isListening = state.voiceState === "listening";

  return (
    <div data-testid="voice-controller" className="fixed right-6 bottom-6 z-20">
      <Button
        size="lg"
        variant={isListening ? "destructive" : "default"}
        onClick={() =>
          dispatch({
            type: "SET_VOICE_STATE",
            voiceState: isListening ? "idle" : "listening",
          })
        }
        aria-label={isListening ? "Stop listening" : "Start voice navigation"}
      >
        {isListening ? "Stop" : "🎙 Speak"}
      </Button>
    </div>
  );
}
