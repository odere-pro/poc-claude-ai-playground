import { test, expect } from "@playwright/test";

test("/results without an in-flight or saved analysis falls back to PricingGate", async ({
  page,
}) => {
  await page.goto("/results");
  // No prior session — page renders the upgrade prompt instead of an empty list.
  await expect(page.getByTestId("pricing-gate")).toBeVisible();
});

test("/api/transcribe returns 503 when voice is disabled", async ({ request }) => {
  // NEXT_PUBLIC_VOICE_ENABLED defaults to false in this repo.
  const res = await request.post("/api/transcribe");
  expect(res.status()).toBe(503);
});

test("/api/voice-command returns 503 when voice is disabled", async ({ request }) => {
  const res = await request.post("/api/voice-command");
  expect(res.status()).toBe(503);
});
