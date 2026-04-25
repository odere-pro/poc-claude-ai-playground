import { test, expect } from "@playwright/test";

/**
 * Pricing gate (demo step 11).
 *
 * Hits /api/analyze?force_402=true directly — the route returns 402
 * without invoking Anthropic, which is exactly the path the demo
 * triggers from the UI's "force pricing gate" affordance.
 */
test("force_402 short-circuits with 402 and a JSON error", async ({ request }) => {
  const res = await request.post("/api/analyze?force_402=true", {
    data: {
      contractText: "Sample.",
      permitType: "gvva",
      jurisdiction: "nl",
      detectedLanguage: "en",
    },
  });
  expect(res.status()).toBe(402);
  const body = (await res.json()) as { error: string };
  expect(body.error).toMatch(/limit/i);
});

test("/api/analyze rejects unknown jurisdictions with 400", async ({ request }) => {
  const res = await request.post("/api/analyze", {
    data: {
      contractText: "x",
      permitType: "gvva",
      jurisdiction: "fr",
      detectedLanguage: "en",
    },
  });
  expect(res.status()).toBe(400);
});

test("/api/analyze enforces 100KB body cap with 413", async ({ request }) => {
  const tooBig = "x".repeat(100 * 1024 + 1);
  const res = await request.post("/api/analyze", {
    data: {
      contractText: tooBig,
      permitType: "gvva",
      jurisdiction: "nl",
      detectedLanguage: "en",
    },
  });
  expect(res.status()).toBe(413);
});
