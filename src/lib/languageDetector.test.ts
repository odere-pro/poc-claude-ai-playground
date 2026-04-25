import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { detectLanguage, detectFromVoice, setExplicitLanguage } from "./languageDetector";

// Node 25 ships an experimental built-in `localStorage` with no usable
// methods unless --localstorage-file is set. That shadow breaks
// happy-dom's window.localStorage. Install a Map-backed stub for tests.
class MemoryStorage implements Storage {
  private store = new Map<string, string>();
  get length(): number {
    return this.store.size;
  }
  clear(): void {
    this.store.clear();
  }
  getItem(key: string): string | null {
    return this.store.has(key) ? (this.store.get(key) as string) : null;
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  setItem(key: string, value: string): void {
    this.store.set(key, String(value));
  }
}

let storage: MemoryStorage;

beforeEach(() => {
  storage = new MemoryStorage();
  Object.defineProperty(window, "localStorage", {
    value: storage,
    configurable: true,
    writable: true,
  });
});

afterEach(() => {
  storage.clear();
});

describe("detectLanguage", () => {
  it("returns stored language when localStorage has a supported value", () => {
    storage.setItem("clauseguard_language", "uk");
    expect(detectLanguage()).toBe("uk");
  });

  it("ignores stored language when unsupported", () => {
    storage.setItem("clauseguard_language", "ja");
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
    expect(storage.getItem("clauseguard_language")).toBe("pl");
  });

  it("round-trips through detectLanguage", () => {
    setExplicitLanguage("ar");
    expect(detectLanguage()).toBe("ar");
  });
});
