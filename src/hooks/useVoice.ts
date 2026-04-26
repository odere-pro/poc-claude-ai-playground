"use client";

import { useRef, useCallback } from "react";
import { useReport } from "@/context/ReportContext";

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
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.start();
      // Set recording state only after getUserMedia resolves so the button
      // never flashes "recording" when mic permission is denied.
      dispatch({ type: "SET_VOICE_STATE", voiceState: "listening" });
    } catch {
      dispatch({ type: "SET_VOICE_STATE", voiceState: "idle" });
    }
  }, [dispatch]);

  const stopAndProcess = useCallback(async () => {
    const recorder = recorderRef.current;
    if (!recorder) return;

    await new Promise<void>((resolve) => {
      recorder.onstop = () => resolve();
      recorder.stop();
      recorder.stream.getTracks().forEach((t) => t.stop());
    });
    recorderRef.current = null;

    if (chunksRef.current.length === 0) {
      dispatch({ type: "SET_VOICE_STATE", voiceState: "idle" });
      return;
    }

    dispatch({ type: "SET_VOICE_STATE", voiceState: "processing" });

    const mimeType = recorder.mimeType || "audio/webm";
    const blob = new Blob(chunksRef.current, { type: mimeType });
    chunksRef.current = [];

    const form = new FormData();
    form.set("audio", blob, "recording.webm");

    // Pass the full clause analysis as context so the server-side Claude prompt
    // is grounded in this specific contract.
    form.set(
      "context",
      JSON.stringify({
        jurisdiction: state.jurisdiction,
        clauses: state.report?.clauses ?? [],
      }),
    );

    // Include the per-contract Reson8 custom model ID when ready — biases STT
    // toward this contract's specific legal vocabulary.
    if (state.customModelId) {
      form.set("customModelId", state.customModelId);
    }

    try {
      const tRes = await fetch("/api/transcribe", { method: "POST", body: form });
      if (!tRes.ok) throw new Error("transcribe_failed");
      const { reasoning, transcript } = (await tRes.json()) as {
        transcript: string;
        reasoning?: string;
      };

      dispatch({ type: "SET_VOICE_STATE", voiceState: "speaking" });
      dispatch({ type: "SET_LAST_SPOKEN", text: reasoning ?? transcript });
    } catch {
      dispatch({ type: "SET_VOICE_STATE", voiceState: "idle" });
    }
  }, [dispatch, state.customModelId, state.jurisdiction, state.report]);

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
    dispatch({ type: "SET_VOICE_STATE", voiceState: "idle" });
  }, [dispatch]);

  return { startListening, stopAndProcess, cancel };
}
