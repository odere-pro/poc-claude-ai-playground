import { describe, it, expect } from "vitest";
import { voiceReducer } from "./voiceState";

describe("voiceReducer", () => {
  it("idle → listening on MIC_PRESSED", () => {
    expect(voiceReducer("idle", { type: "MIC_PRESSED" })).toBe("listening");
  });
  it("listening → processing on AUDIO_CAPTURED", () => {
    expect(voiceReducer("listening", { type: "AUDIO_CAPTURED" })).toBe("processing");
  });
  it("processing → speaking on RESPONSE_READY", () => {
    expect(voiceReducer("processing", { type: "RESPONSE_READY" })).toBe("speaking");
  });
  it("speaking → idle on SPEECH_DONE", () => {
    expect(voiceReducer("speaking", { type: "SPEECH_DONE" })).toBe("idle");
  });
  it("CANCEL always returns idle", () => {
    expect(voiceReducer("listening", { type: "CANCEL" })).toBe("idle");
    expect(voiceReducer("processing", { type: "CANCEL" })).toBe("idle");
    expect(voiceReducer("speaking", { type: "CANCEL" })).toBe("idle");
  });
  it("ignores invalid transitions (e.g. RESPONSE_READY from idle)", () => {
    expect(voiceReducer("idle", { type: "RESPONSE_READY" })).toBe("idle");
    expect(voiceReducer("idle", { type: "SPEECH_DONE" })).toBe("idle");
  });
});
