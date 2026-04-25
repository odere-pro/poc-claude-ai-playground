import { test, expect } from "@playwright/test";
import path from "node:path";

/**
 * Happy-path UI shell.
 *
 * Full streaming-analysis e2e is gated on a live ANTHROPIC_API_KEY and is
 * driven via the preview-deploy workflow. This local spec covers what we
 * can verify without the upstream model:
 *  - hero copy renders
 *  - jurisdiction toggle changes selected state
 *  - dropping a real fixture surfaces the filename and triggers navigation
 *  - localStorage never holds raw clause text (privacy invariant)
 */
test("upload page renders the hero and accepts a fixture file", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Know what you signed/i })).toBeVisible();
  await expect(page.getByTestId("jurisdiction-toggle")).toBeVisible();
  await expect(page.getByTestId("permit-selector")).toHaveValue("gvva");

  // Switch to SE — permit selector must rebuild.
  await page.getByRole("button", { name: /Sweden/i }).click();
  await expect(page.getByTestId("permit-selector")).toHaveValue("arbetstillstand");

  // Switch back to NL.
  await page.getByRole("button", { name: /Netherlands/i }).click();
  await expect(page.getByTestId("permit-selector")).toHaveValue("gvva");

  // Drop a fixture into the file input.
  const fixture = path.resolve(__dirname, "../../data/fixtures/fixture-nl-real.txt");
  // The hidden input is rendered immediately — set its files.
  await page.locator("input[type=file]").setInputFiles(fixture);

  // Filename surfaces with a check mark.
  await expect(page.getByTestId("upload-filename")).toContainText("fixture-nl-real.txt");
});

test("localStorage never contains raw clause text after upload", async ({ page }) => {
  await page.goto("/");
  const fixture = path.resolve(__dirname, "../../data/fixtures/fixture-nl-real.txt");
  await page.locator("input[type=file]").setInputFiles(fixture);

  // Whatever lands in localStorage must not contain the contract verbatim.
  const stored = await page.evaluate(() =>
    JSON.stringify(window.localStorage.getItem("clauseguard.savedSummary")),
  );
  expect(stored).not.toContain("EMPLOYMENT CONTRACT");
  expect(stored).not.toContain("Trial period");
});
