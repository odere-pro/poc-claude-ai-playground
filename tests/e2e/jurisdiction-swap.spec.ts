import { test, expect } from "@playwright/test";

const SE_BODY = [
  {
    type: "clause",
    id: "c1",
    title: "Probation 7 months",
    status: "illegal",
    originalText: "Probationary basis for 7 months.",
    explanation: "Provanställning får inte överstiga sex månader.",
    citation: {
      article: "LAS §6",
      law: "Lagen om anställningsskydd (LAS)",
      description: "Probationary employment",
      source: "se-labor-law.json",
    },
    action: null,
    permitConflict: null,
  },
  {
    type: "clause",
    id: "c2",
    title: "Working hours 40h",
    status: "compliant",
    originalText: "Standard ordinary working time is 40 hours per week.",
    explanation: "Inom lagstadgade gränser.",
    citation: {
      article: "Arbetstidslagen §5",
      law: "Arbetstidslagen",
      description: "Working hours",
      source: "se-labor-law.json",
    },
    action: null,
    permitConflict: null,
  },
];

const SE_SUMMARY = {
  type: "summary",
  jurisdiction: "se",
  permitType: "arbetstillstand",
  detectedLanguage: "sv",
  totalClauses: 2,
  illegalCount: 1,
  exploitativeCount: 0,
  permitConflictCount: 0,
  uncheckedCount: 0,
  rights: [
    {
      text: "Provanställning får inte överstiga sex månader.",
      citation: {
        article: "LAS §6",
        law: "Lagen om anställningsskydd (LAS)",
        description: "Probationary employment",
        source: "se-labor-law.json",
      },
    },
  ],
};

test("SE jurisdiction analyzes against LAS ruleset", async ({ page }) => {
  await page.route("**/api/analyze**", (route) =>
    route.fulfill({
      status: 200,
      headers: { "content-type": "text/event-stream" },
      body:
        SE_BODY.map((c) => `data: ${JSON.stringify(c)}`).join("\n\n") +
        "\n\n" +
        `data: ${JSON.stringify(SE_SUMMARY)}\n\n` +
        "data: [DONE]\n\n",
    }),
  );

  await page.goto("/");
  await page.locator('[data-testid="jurisdiction-toggle"] [data-value="se"]').click();
  await expect(page.locator('[data-testid="jurisdiction-toggle"]')).toHaveAttribute(
    "data-value",
    "se",
  );

  await page.locator('[data-testid="upload-tab-text"]').click();
  await page.locator("textarea").fill("Sample SE contract.");
  await page.locator('[data-testid="analyze-button"]').click();

  await page.waitForSelector('[data-testid="citation-block"]', { timeout: 30_000 });
  const citations = await page.locator('[data-testid="citation-block"]').allTextContents();
  expect(citations.some((c) => /LAS|Arbetstidslagen/.test(c))).toBe(true);
});
