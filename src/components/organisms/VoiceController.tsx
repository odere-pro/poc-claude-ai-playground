"use client";

import { useRef } from "react";
import { useRouter } from "next/navigation";
import { IconButton } from "@/components/atoms/IconButton";
import { detectFromVoice } from "@/lib/languageDetector";
import { useReport, useReportDispatch } from "@/context/ReportContext";
import type {
  Jurisdiction,
  SupportedLanguage,
  VoiceCommandResponse,
  VoiceIntent,
  VoiceReportContext,
} from "@/lib/types";

const TTS_LANG: Record<SupportedLanguage, string> = {
  nl: "nl-NL",
  en: "en-GB",
  uk: "uk-UA",
  ar: "ar-SA",
  pl: "pl-PL",
  sv: "sv-SE",
};

export function VoiceController() {
  const state = useReport();
  const dispatch = useReportDispatch();
  const router = useRouter();
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const enabled = process.env.NEXT_PUBLIC_VOICE_ENABLED === "true";
  if (!enabled) return null;

  const speak = (text: string, lang: SupportedLanguage): void => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = TTS_LANG[lang];
    u.onstart = () => dispatch({ type: "SET_VOICE_STATE", payload: "speaking" });
    u.onend = () => dispatch({ type: "SET_VOICE_STATE", payload: "idle" });
    dispatch({ type: "SET_LAST_SPOKEN", payload: text });
    window.speechSynthesis.speak(u);
  };

  const dispatchIntent = (intent: VoiceIntent): void => {
    switch (intent.intent) {
      case "switch_jurisdiction":
        dispatch({
          type: "SET_JURISDICTION",
          payload: intent.jurisdiction as Jurisdiction,
        });
        break;
      case "explain_clause":
        dispatch({ type: "HIGHLIGHT_CLAUSE", payload: intent.clauseId });
        break;
      case "download":
        if (typeof window !== "undefined") window.print();
        break;
      case "new_contract":
        dispatch({ type: "RESET" });
        router.push("/");
        break;
      default:
        break;
    }
  };

  const handleAudio = async (blob: Blob): Promise<void> => {
    const form = new FormData();
    form.append("audio", blob, "recording.webm");

    let transcript = "";
    let detectedLanguage = state.detectedLanguage;
    try {
      const res = await fetch("/api/transcribe", { method: "POST", body: form });
      if (!res.ok) throw new Error(`transcribe ${res.status}`);
      const data = (await res.json()) as {
        transcript: string;
        detectedLanguage: string;
      };
      transcript = data.transcript;
      detectedLanguage = detectFromVoice(data.detectedLanguage);
      dispatch({ type: "SET_LANGUAGE", payload: detectedLanguage });
    } catch (err) {
      console.error("Voice transcription failed:", err instanceof Error ? err.message : "unknown");
      dispatch({ type: "SET_VOICE_STATE", payload: "idle" });
      return;
    }

    const reportContext: VoiceReportContext = {
      clauses:
        state.report?.clauses.map((c) => ({
          id: c.id,
          title: c.title,
          status: c.status,
        })) ?? [],
      currentIndex: 0,
      jurisdiction: state.jurisdiction,
      detectedLanguage,
      illegalCount: state.report?.summary?.illegalCount ?? 0,
    };

    try {
      const res = await fetch("/api/voice-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, reportContext }),
      });
      if (!res.ok) throw new Error(`voice-command ${res.status}`);
      const data = (await res.json()) as VoiceCommandResponse;
      dispatchIntent(data.intent);
      speak(data.responseText, detectedLanguage);
    } catch (err) {
      console.error("Voice intent failed:", err instanceof Error ? err.message : "unknown");
      dispatch({ type: "SET_VOICE_STATE", payload: "idle" });
    }
  };

  const startRecording = async () => {
    if (state.voiceState !== "idle") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        void handleAudio(blob);
      };
      recorderRef.current = recorder;
      recorder.start();
      dispatch({ type: "SET_VOICE_STATE", payload: "listening" });
    } catch (err) {
      console.error("Mic access failed:", err instanceof Error ? err.message : "unknown");
    }
  };

  const stopRecording = () => {
    if (state.voiceState !== "listening") return;
    recorderRef.current?.stop();
    dispatch({ type: "SET_VOICE_STATE", payload: "processing" });
  };

  const onMic = state.voiceState === "listening" ? stopRecording : startRecording;

  return (
    <div data-testid="voice-controller" className="fixed right-6 bottom-6 flex items-center gap-3">
      <span
        aria-live="polite"
        className="rounded-full px-3 py-1 text-xs font-medium"
        style={{
          backgroundColor: "var(--color-card)",
          color: "var(--color-muted-foreground)",
        }}
      >
        {state.voiceState}
      </span>
      <IconButton
        icon="mic"
        ariaLabel="Toggle voice navigation"
        size="lg"
        variant={
          state.voiceState === "listening"
            ? "listening"
            : state.voiceState === "speaking"
              ? "speaking"
              : "default"
        }
        onClick={onMic}
        disabled={state.voiceState === "speaking" || state.voiceState === "processing"}
      />
    </div>
  );
}
