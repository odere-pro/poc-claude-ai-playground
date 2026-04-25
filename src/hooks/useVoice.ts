"use client";

import { useRef, useCallback } from "react";
import { useReport } from "@/context/ReportContext";
import type { AppState } from "@/context/ReportContext";
import type { TranscribeContext } from "@/lib/schemas";
import type { VoiceCommandResponse } from "@/lib/types";

/**
 * Build domain-knowledge context for the Reson8 transcription request.
 *
 * Extracts clause titles and citation identifiers from the active analysis so
 * the STT model can weight legal vocabulary (e.g. "niet-concurrentiebeding",
 * "BW 7:653") higher than phonetically similar common words.
 */
function buildTranscribeContext(state: AppState): TranscribeContext {
  const clauses = state.report?.clauses ?? [];

  const rawVocab: string[] = [];
  for (const clause of clauses) {
    if (clause.title) rawVocab.push(clause.title);
    if (clause.citation?.article) rawVocab.push(clause.citation.article);
    if (clause.citation?.label) rawVocab.push(clause.citation.label);
  }

  const vocabulary = [...new Set(rawVocab)].slice(0, 200);

  const prompt = [
    `Employment contract analysis`,
    `jurisdiction: ${state.jurisdiction.toUpperCase()}`,
    `permit: ${state.permitType}`,
  ].join(", ");

  return {
    jurisdiction: state.jurisdiction,
    permitType: state.permitType,
    detectedLanguage: state.detectedLanguage,
    vocabulary,
    prompt,
  };
}

export interface UseVoiceReturn {
  startListening: () => Promise<void>;
  stopAndProcess: () => Promise<void>;
  cancel: () => void;
}

export function useVoice(): UseVoiceReturn {
  const { state, dispatch } = useReport();
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startListening = useCallback(async () => {
    dispatch({ type: "SET_VOICE_STATE", voiceState: "listening" });
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start();
    } catch {
      // Mic permission denied or device unavailable — go back to idle.
      dispatch({ type: "SET_VOICE_STATE", voiceState: "idle" });
    }
  }, [dispatch]);

  const stopAndProcess = useCallback(async () => {
    const recorder = recorderRef.current;
    if (!recorder) return;

    // Wait for the recorder to fully stop before reading chunks.
    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      recorder.stop();
      recorder.stream.getTracks().forEach((t) => t.stop());
    });
    recorderRef.current = null;

    dispatch({ type: "SET_VOICE_STATE", voiceState: "processing" });

    const mimeType = recorder.mimeType || "audio/webm";
    const blob = new Blob(chunksRef.current, { type: mimeType });
    chunksRef.current = [];

    const ctx = buildTranscribeContext(state);
    const form = new FormData();
    form.set("audio", blob, "recording.webm");
    form.set("context", JSON.stringify(ctx));

    try {
      const tRes = await fetch("/api/transcribe", { method: "POST", body: form });
      if (!tRes.ok) throw new Error("transcribe_failed");
      const { transcript } = (await tRes.json()) as { transcript: string };

      const reportContext = {
        currentClauseId: state.highlightedClauseId,
        clauseIds: (state.report?.clauses ?? []).map((c) => c.id),
        jurisdiction: state.jurisdiction,
      };

      const vcRes = await fetch("/api/voice-command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript, reportContext }),
      });
      if (!vcRes.ok) throw new Error("voice_command_failed");

      const { responseText } = (await vcRes.json()) as VoiceCommandResponse;

      dispatch({ type: "SET_VOICE_STATE", voiceState: "speaking" });
      dispatch({ type: "SET_LAST_SPOKEN", text: responseText });

      // Use Web Speech API for TTS. A future Reson8 TTS call replaces this
      // block by swapping in a fetch + audio playback before the idle dispatch.
      if (responseText && typeof window !== "undefined" && "speechSynthesis" in window) {
        const utterance = new SpeechSynthesisUtterance(responseText);
        utterance.onend = () => dispatch({ type: "SET_VOICE_STATE", voiceState: "idle" });
        utterance.onerror = () => dispatch({ type: "SET_VOICE_STATE", voiceState: "idle" });
        window.speechSynthesis.speak(utterance);
      } else {
        dispatch({ type: "SET_VOICE_STATE", voiceState: "idle" });
      }
    } catch {
      dispatch({ type: "SET_VOICE_STATE", voiceState: "idle" });
    }
  }, [dispatch, state]);

  const cancel = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder) {
      try {
        recorder.stop();
        recorder.stream.getTracks().forEach((t) => t.stop());
      } catch {
        // Already stopped — ignore.
      }
      recorderRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    dispatch({ type: "SET_VOICE_STATE", voiceState: "idle" });
  }, [dispatch]);

  return { startListening, stopAndProcess, cancel };
}
