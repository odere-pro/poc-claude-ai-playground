import { describe, it, expect } from "vitest";
import { detectLanguage, detectFromVoice, setExplicitLanguage } from "./languageDetector";

// localStorage stub installed globally in tests/setup.ts.

describe("detectLanguage", () => {
  it("returns stored language when localStorage has a supported value", () => {
    window.localStorage.setItem("clauseguard_language", "uk");
    expect(detectLanguage()).toBe("uk");
  });

  it("ignores stored language when unsupported", () => {
    window.localStorage.setItem("clauseguard_language", "ja");
    Object.defineProperty(window.navigator, "language", {
      value: "nl-NL",
      configurable: true,
    });
    expect(detectLanguage()).toBe("nl");
  });

  it("returns browser language when no stored value", () => {
    Object.defineProperty(window.navigator, "language", {
      value: "nl-NL",
      configurable: true,
    });
    expect(detectLanguage()).toBe("nl");
  });

  it("falls back to en for unsupported browser languages", () => {
    Object.defineProperty(window.navigator, "language", {
      value: "ja-JP",
      configurable: true,
    });
    expect(detectLanguage()).toBe("en");
  });
});

describe("detectFromVoice", () => {
  it("extracts language from BCP-47 tags", () => {
    expect(detectFromVoice("uk-UA")).toBe("uk");
    expect(detectFromVoice("nl-NL")).toBe("nl");
    expect(detectFromVoice("ar-SA")).toBe("ar");
  });

  it("falls back to en for unsupported", () => {
    expect(detectFromVoice("zh-CN")).toBe("en");
    expect(detectFromVoice("ja-JP")).toBe("en");
  });
});

describe("setExplicitLanguage", () => {
  it("persists the language to localStorage", () => {
    setExplicitLanguage("pl");
    expect(window.localStorage.getItem("clauseguard_language")).toBe("pl");
  });

  it("round-trips through detectLanguage", () => {
    setExplicitLanguage("ar");
    expect(detectLanguage()).toBe("ar");
  });
});
