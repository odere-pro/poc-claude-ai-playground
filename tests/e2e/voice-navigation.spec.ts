import { test, expect } from "@playwright/test";

/**
 * Voice navigation is P1 and gated by NEXT_PUBLIC_VOICE_ENABLED. The default
 * test environment has voice off — verify the controller does NOT mount.
 *
 * Full voice flow (mic press → transcribe → intent → TTS) requires the real
 * Reson8 + Claude tool-use endpoints and is wired in a separate run.
 */
test("VoiceController does not render when voice is disabled", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("voice-controller")).toHaveCount(0);
});
