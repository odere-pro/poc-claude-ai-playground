import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, act } from "@testing-library/react";
import { ReportProvider, useReport } from "./ReportContext";

// happy-dom doesn't always install localStorage; install a deterministic shim
// once at module load.
const installStorage = () => {
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
  return store;
};

const STORAGE_KEY = "clauseguard.savedSummary";

function Probe({ onState }: { onState: (s: ReturnType<typeof useReport>["state"]) => void }) {
  const { state } = useReport();
  onState(state);
  return null;
}

describe("ReportContext hydration", () => {
  let store: Map<string, string>;

  beforeEach(() => {
    store = installStorage();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects a corrupted localStorage blob and clears the entry", async () => {
    // Schema-invalid: missing summary, wrong types.
    store.set(STORAGE_KEY, JSON.stringify({ corrupt: true, savedAt: Date.now() }));

    let capturedState: ReturnType<typeof useReport>["state"] | undefined;
    await act(async () => {
      render(
        <ReportProvider>
          <Probe onState={(s) => (capturedState = s)} />
        </ReportProvider>,
      );
    });

    expect(capturedState?.savedSummary).toBeNull();
    expect(store.has(STORAGE_KEY)).toBe(false);
  });

  it("rejects a malformed JSON string and clears the entry", async () => {
    store.set(STORAGE_KEY, "{not json");

    let capturedState: ReturnType<typeof useReport>["state"] | undefined;
    await act(async () => {
      render(
        <ReportProvider>
          <Probe onState={(s) => (capturedState = s)} />
        </ReportProvider>,
      );
    });

    expect(capturedState?.savedSummary).toBeNull();
    expect(store.has(STORAGE_KEY)).toBe(false);
  });

  it("hydrates a valid blob into state", async () => {
    const valid = {
      summary: {
        type: "summary",
        jurisdiction: "nl",
        permitType: "gvva",
        detectedLanguage: "uk",
        totalClauses: 6,
        illegalCount: 2,
        exploitativeCount: 0,
        permitConflictCount: 0,
        uncheckedCount: 2,
        compliantCount: 2,
        rights: [],
      },
      jurisdiction: "nl",
      permitType: "gvva",
      detectedLanguage: "uk",
      savedAt: Date.now(),
    };
    store.set(STORAGE_KEY, JSON.stringify(valid));

    let capturedState: ReturnType<typeof useReport>["state"] | undefined;
    await act(async () => {
      render(
        <ReportProvider>
          <Probe onState={(s) => (capturedState = s)} />
        </ReportProvider>,
      );
    });

    expect(capturedState?.savedSummary?.detectedLanguage).toBe("uk");
    expect(capturedState?.detectedLanguage).toBe("uk");
  });
});
