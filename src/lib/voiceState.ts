import type { VoiceState } from "@/context/ReportContext";

/**
 * Pure state-machine reducer for the voice loop.
 *
 *   idle → listening (user pressed mic)
 *   listening → processing (audio captured, transcript fetched)
 *   processing → speaking (intent classified, response ready)
 *   speaking → idle (TTS done)
 *   any → idle (cancel / error)
 *
 * Invalid transitions are no-ops — the caller's UI shouldn't be able to
 * trigger them, but defending in depth keeps the state legible.
 */

export type VoiceAction =
  | { type: "MIC_PRESSED" }
  | { type: "AUDIO_CAPTURED" }
  | { type: "RESPONSE_READY" }
  | { type: "SPEECH_DONE" }
  | { type: "CANCEL" };

export function voiceReducer(state: VoiceState, action: VoiceAction): VoiceState {
  switch (action.type) {
    case "MIC_PRESSED":
      return state === "idle" ? "listening" : state;
    case "AUDIO_CAPTURED":
      return state === "listening" ? "processing" : state;
    case "RESPONSE_READY":
      return state === "processing" ? "speaking" : state;
    case "SPEECH_DONE":
      return state === "speaking" ? "idle" : state;
    case "CANCEL":
      return "idle";
    default: {
      action satisfies never;
      return state;
    }
  }
}
