import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import {
  detectFromVoice,
  detectLanguage,
  normalizeLanguage,
  setExplicitLanguage,
} from "./languageDetector";

// happy-dom in this vitest version doesn't auto-install localStorage on `window`.
// Install a minimal in-memory shim so the cascade tests can read/write.
beforeAll(() => {
  if (typeof window !== "undefined" && !window.localStorage?.getItem) {
    const store = new Map<string, string>();
    Object.defineProperty(window, "localStorage", {
      configurable: true,
      value: {
        getItem: (k: string) => store.get(k) ?? null,
        setItem: (k: string, v: string) => store.set(k, String(v)),
        removeItem: (k: string) => void store.delete(k),
        clear: () => store.clear(),
        key: (i: number) => Array.from(store.keys())[i] ?? null,
        get length() {
          return store.size;
        },
      },
    });
  }
});

describe("normalizeLanguage", () => {
  it("returns supported primary subtag for region-tagged input", () => {
    expect(normalizeLanguage("uk-UA")).toBe("uk");
    expect(normalizeLanguage("nl-NL")).toBe("nl");
    expect(normalizeLanguage("pt-BR")).toBe("pt");
  });

  it("normalizes underscore separators", () => {
    expect(normalizeLanguage("uk_UA")).toBe("uk");
  });

  it("returns null for unsupported languages", () => {
    expect(normalizeLanguage("ja-JP")).toBeNull();
    expect(normalizeLanguage("zh")).toBeNull();
  });

  it("returns null for empty / nullish inputs", () => {
    expect(normalizeLanguage(null)).toBeNull();
    expect(normalizeLanguage(undefined)).toBeNull();
    expect(normalizeLanguage("")).toBeNull();
  });
});

describe("detectLanguage", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns the localStorage value when supported", () => {
    window.localStorage.setItem("clauseguard.lang", "uk");
    expect(detectLanguage()).toBe("uk");
  });

  it("falls back to navigator.language when storage is empty", () => {
    vi.spyOn(window.navigator, "language", "get").mockReturnValue("nl-NL");
    expect(detectLanguage()).toBe("nl");
  });

  it("falls back to 'en' when neither storage nor navigator yields a supported language", () => {
    vi.spyOn(window.navigator, "language", "get").mockReturnValue("ja-JP");
    expect(detectLanguage()).toBe("en");
  });

  it("ignores unsupported storage values and continues the cascade", () => {
    window.localStorage.setItem("clauseguard.lang", "ja");
    vi.spyOn(window.navigator, "language", "get").mockReturnValue("uk-UA");
    expect(detectLanguage()).toBe("uk");
  });
});

describe("detectFromVoice", () => {
  it("normalizes BCP-47 voice tags", () => {
    expect(detectFromVoice("uk-UA")).toBe("uk");
  });

  it("falls back to 'en' for unsupported voice tags", () => {
    expect(detectFromVoice("ja-JP")).toBe("en");
  });
});

describe("setExplicitLanguage", () => {
  it("persists the choice to localStorage", () => {
    setExplicitLanguage("nl");
    expect(window.localStorage.getItem("clauseguard.lang")).toBe("nl");
  });
});
