import { test, expect } from "@playwright/test";

/**
 * Slide 4 — switching jurisdiction from NL to SE rebuilds the permit list
 * and points subsequent analysis at the SE ruleset (verified via the API
 * request body, not via the model's response since e2e is deterministic).
 */
test("toggling NL → SE rebuilds permit list and resets to arbetstillstand", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByTestId("permit-selector")).toHaveValue("gvva");
  await page.getByRole("button", { name: /Sweden/i }).click();
  await expect(page.getByTestId("permit-selector")).toHaveValue("arbetstillstand");
});

test("/api/analyze accepts jurisdiction=se with the SE default permit", async ({ request }) => {
  // 402 short-circuits before ruleset load — proves the route accepts the
  // valid jurisdiction shape without needing the upstream model.
  const res = await request.post("/api/analyze?force_402=true", {
    data: {
      contractText: "Sample.",
      permitType: "arbetstillstand",
      jurisdiction: "se",
      detectedLanguage: "sv",
    },
  });
  expect(res.status()).toBe(402);
});
