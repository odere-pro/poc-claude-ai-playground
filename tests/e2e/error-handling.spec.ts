import { test, expect } from "@playwright/test";

test("results page renders placeholder", async ({ page }) => {
  await page.goto("/results");
  await expect(page.getByRole("heading", { name: /results/i })).toBeVisible();
});
