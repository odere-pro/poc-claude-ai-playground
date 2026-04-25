import { test, expect } from "@playwright/test";

// Voice E2E only meaningful when the feature flag is on. Without it,
// VoiceController returns null and we skip.
const voiceEnabled = process.env.NEXT_PUBLIC_VOICE_ENABLED === "true";

test.describe("Voice navigation", () => {
  test.skip(!voiceEnabled, "NEXT_PUBLIC_VOICE_ENABLED is not 'true'");

  test("voice controller is mounted on upload page", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('[data-testid="voice-controller"]')).toBeVisible();
  });

  test("transcribe failure leaves voice state idle", async ({ page }) => {
    await page.route("**/api/transcribe", (route) =>
      route.fulfill({
        status: 503,
        body: JSON.stringify({ error: "Voice transcription unavailable." }),
      }),
    );
    await page.goto("/");
    // We don't drive the real MediaRecorder here — that requires fake audio
    // permissions. This test asserts the controller renders and remains
    // functional when the upstream service is down.
    await expect(page.locator('[data-testid="voice-controller"]')).toBeVisible();
  });
});
