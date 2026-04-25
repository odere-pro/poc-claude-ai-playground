import { test, expect } from "@playwright/test";

test.describe("Error states", () => {
  test("speak tab is disabled when voice flag off (default in dev)", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('[data-testid="upload-tab-speak"]')).toBeDisabled();
  });

  test("stream-error event surfaces the incomplete banner", async ({ page }) => {
    await page.route("**/api/analyze**", (route) =>
      route.fulfill({
        status: 200,
        headers: { "content-type": "text/event-stream" },
        body:
          'data: {"type":"clause","id":"c1","title":"x","status":"illegal","originalText":"x","explanation":"x","citation":null,"action":null,"permitConflict":null}\n\n' +
          'data: {"type":"error"}\n\n',
      }),
    );

    await page.goto("/");
    await page.locator('[data-testid="upload-tab-text"]').click();
    await page.locator("textarea").fill("Sample contract.");
    await page.locator('[data-testid="analyze-button"]').click();
    await expect(page.locator('[data-testid="analysis-incomplete-banner"]')).toBeVisible({
      timeout: 10_000,
    });
  });
});
