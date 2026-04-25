import { test, expect } from "@playwright/test";

// Smoke-level coverage for the upload page that doesn't need the live
// Anthropic API. The full streaming happy-path runs against the preview
// deploy in CI (preview-e2e.yml).

test.describe("Upload page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("renders the headline", async ({ page }) => {
    await expect(page.locator('[data-testid="headline"]')).toBeVisible();
  });

  test("jurisdiction defaults to NL", async ({ page }) => {
    await expect(page.locator('[data-testid="jurisdiction-toggle"]')).toHaveAttribute(
      "data-value",
      "nl",
    );
  });

  test("Analyze button is disabled before any input", async ({ page }) => {
    await expect(page.locator('[data-testid="analyze-button"]')).toBeDisabled();
  });

  test("switching to text tab and typing enables Analyze", async ({ page }) => {
    await page.locator('[data-testid="upload-tab-text"]').click();
    await page.locator("textarea").fill("Sample contract text");
    await expect(page.locator('[data-testid="analyze-button"]')).toBeEnabled();
  });

  test("switching jurisdiction updates the toggle attribute", async ({ page }) => {
    await page.locator('[data-testid="jurisdiction-toggle"] [data-value="se"]').click();
    await expect(page.locator('[data-testid="jurisdiction-toggle"]')).toHaveAttribute(
      "data-value",
      "se",
    );
  });
});
