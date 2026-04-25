import { test, expect, type Page } from "@playwright/test";

// Mocks /api/analyze with a deterministic SSE body that mimics 6 clauses
// from the NL fixture. Lets us exercise the full upload → analyzing →
// results flow without burning Anthropic credits or real Claude latency.

const SSE_BODY = [
  {
    type: "clause",
    id: "c1",
    title: "Non-compete",
    status: "illegal",
    originalText:
      "You agree not to work in a similar role for any competitor within the EU for 24 months.",
    explanation: "Een non-concurrentiebeding van 24 maanden is niet afdwingbaar.",
    citation: {
      article: "Art. 7:653",
      law: "Burgerlijk Wetboek (BW)",
      description: "Non-compete clauses",
      source: "nl-labor-law.json",
    },
    action: null,
    permitConflict: null,
  },
  {
    type: "clause",
    id: "c2",
    title: "Probation 3 months on 1y",
    status: "illegal",
    originalText: "Probation period of 3 months on a 1-year fixed-term contract.",
    explanation: "Op een tijdelijk contract mag de proeftijd maximaal één maand bedragen.",
    citation: {
      article: "Art. 7:652",
      law: "Burgerlijk Wetboek (BW)",
      description: "Probationary period",
      source: "nl-labor-law.json",
    },
    action: null,
    permitConflict: null,
  },
  {
    type: "clause",
    id: "c3",
    title: "Notice 1 month",
    status: "compliant",
    originalText: "1 month written notice required.",
    explanation: "Voldoet aan het wettelijk minimum.",
    citation: {
      article: "Art. 7:672",
      law: "Burgerlijk Wetboek (BW)",
      description: "Notice periods",
      source: "nl-labor-law.json",
    },
    action: null,
    permitConflict: null,
  },
  {
    type: "clause",
    id: "c4",
    title: "Overtime 45h",
    status: "compliant",
    originalText: "Up to 45 hours per week during busy periods.",
    explanation: "Binnen de wettelijke gemiddelden.",
    citation: {
      article: "Arbeidstijdenwet §5:7",
      law: "Arbeidstijdenwet",
      description: "Working time",
      source: "nl-labor-law.json",
    },
    action: null,
    permitConflict: null,
  },
  {
    type: "clause",
    id: "c5",
    title: "Confidentiality",
    status: "unchecked",
    originalText: "Confidentiality for 2 years post-termination.",
    explanation: "Geheimhouding valt buiten de huidige set regels.",
    citation: null,
    action: null,
    permitConflict: null,
  },
  {
    type: "clause",
    id: "c6",
    title: "Work from home",
    status: "unchecked",
    originalText: "WFH equipment and €30/month utilities.",
    explanation: "Thuiswerkvergoeding valt buiten de huidige set regels.",
    citation: null,
    action: null,
    permitConflict: null,
  },
];

const SUMMARY = {
  type: "summary",
  jurisdiction: "nl",
  permitType: "gvva",
  detectedLanguage: "nl",
  totalClauses: 6,
  illegalCount: 2,
  exploitativeCount: 0,
  permitConflictCount: 0,
  uncheckedCount: 2,
  rights: [
    {
      text: "U mag een onafdwingbaar non-concurrentiebeding weigeren.",
      citation: {
        article: "Art. 7:653",
        law: "Burgerlijk Wetboek (BW)",
        description: "Non-compete clauses",
        source: "nl-labor-law.json",
      },
    },
  ],
};

function sse(): string {
  return [
    ...SSE_BODY.map((c) => `data: ${JSON.stringify(c)}`),
    `data: ${JSON.stringify(SUMMARY)}`,
    "data: [DONE]",
    "",
  ].join("\n\n");
}

async function mockAnalyze(page: Page): Promise<void> {
  await page.route("**/api/analyze**", (route) =>
    route.fulfill({
      status: 200,
      headers: { "content-type": "text/event-stream" },
      body: sse(),
    }),
  );
}

test.describe("Analyze stream → results", () => {
  test("paste-and-analyze yields 2 illegal + 2 compliant + 2 unchecked", async ({ page }) => {
    await mockAnalyze(page);
    await page.goto("/");
    await page.locator('[data-testid="upload-tab-text"]').click();
    await page.locator("textarea").fill("Sample NL contract.");
    await page.locator('[data-testid="analyze-button"]').click();

    await page.waitForSelector('[data-testid="summary-banner"]', {
      timeout: 30_000,
    });

    expect(await page.locator('[data-testid="clause-card"][data-status="illegal"]').count()).toBe(
      2,
    );
    expect(await page.locator('[data-testid="clause-card"][data-status="compliant"]').count()).toBe(
      2,
    );
    expect(await page.locator('[data-testid="clause-card"][data-status="unchecked"]').count()).toBe(
      2,
    );
  });

  test("citation block points at a real article", async ({ page }) => {
    await mockAnalyze(page);
    await page.goto("/");
    await page.locator('[data-testid="upload-tab-text"]').click();
    await page.locator("textarea").fill("Sample contract.");
    await page.locator('[data-testid="analyze-button"]').click();
    await page.waitForSelector('[data-testid="citation-block"]', { timeout: 30_000 });

    const ruleset = await page.evaluate(async () => {
      const res = await fetch("/api/debug/ruleset?jurisdiction=nl");
      return res.json() as Promise<{ rules: ReadonlyArray<{ article: string }> }>;
    });
    const valid = ruleset.rules.map((r) => r.article);

    const citations = await page.locator('[data-testid="citation-block"]').allTextContents();
    for (const c of citations) {
      // Match either "Art. 7:nnn" or "<word> §<n>[:n]" article forms.
      const match = c.match(/(Art\.\s*\d+:\d+|[A-Za-z]+\s*§\d+(?::\d+)?)/);
      if (match) expect(valid).toContain(match[0]);
    }
  });

  test("session persists summary only — no clause originalText leaked", async ({ page }) => {
    await mockAnalyze(page);
    await page.goto("/");
    await page.locator('[data-testid="upload-tab-text"]').click();
    await page.locator("textarea").fill("Sample contract.");
    await page.locator('[data-testid="analyze-button"]').click();
    await page.waitForSelector('[data-testid="summary-banner"]', {
      timeout: 30_000,
    });

    const stored = await page.evaluate(() => localStorage.getItem("clauseguard_session"));
    expect(stored).not.toBeNull();
    expect(stored).not.toContain("agree not to work");
    expect(stored).not.toContain("24 months");
  });
});
