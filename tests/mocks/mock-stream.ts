// Hand-written replacement for the live Claude stream. Used by integration
// tests via `vi.mock("@anthropic-ai/sdk")` so the route handler reads
// realistic clause events without calling the real model.
// The ".real" capture from `scripts/generate-mock-stream.ts` (P0 finalization
// step) replaces this file once the NL fixture is locked.

interface ClaudeChunk {
  readonly type: "content_block_delta";
  readonly delta: { readonly type: "text_delta"; readonly text: string };
}

// Async iterable mimicking the Anthropic SDK's stream shape: yields
// content_block_delta chunks whose `delta.text` is concatenated to form
// the full "data: …\n" SSE body the route handler parses.
export function mockClaudeStreamChunks(): AsyncIterable<ClaudeChunk> {
  const lines = [
    ...NL_CLAUSES.map((c) => `data: ${JSON.stringify(c)}`),
    `data: ${JSON.stringify(NL_SUMMARY)}`,
    "data: [DONE]",
  ];
  const body = lines.join("\n") + "\n";
  // Split into a few chunks to simulate streaming.
  const chunks: ClaudeChunk[] = [];
  const sliceSize = Math.max(1, Math.ceil(body.length / 4));
  for (let i = 0; i < body.length; i += sliceSize) {
    chunks.push({
      type: "content_block_delta",
      delta: { type: "text_delta", text: body.slice(i, i + sliceSize) },
    });
  }
  return {
    async *[Symbol.asyncIterator]() {
      for (const c of chunks) yield c;
    },
  };
}

const NL_CLAUSES = [
  {
    type: "clause",
    id: "c1",
    title: "Non-compete (24 months, EU-wide)",
    status: "illegal",
    originalText:
      "The Employee agrees not to work in a similar role for any competitor within the European Union for a period of 24 months after termination of this agreement, without compensation.",
    explanation:
      "Een non-concurrentiebeding van 24 maanden zonder compensatie en met EU-brede reikwijdte is niet afdwingbaar in Nederland.",
    citation: {
      article: "Art. 7:653",
      law: "Burgerlijk Wetboek (BW)",
      description: "Non-compete clauses",
      source: "nl-labor-law.json",
    },
    action:
      "Vraag schriftelijk om opheffing van het beding; bij weigering kan de rechter het matigen of vernietigen.",
    permitConflict: null,
  },
  {
    type: "clause",
    id: "c2",
    title: "Probation period 3 months on 1-year fixed-term",
    status: "illegal",
    originalText:
      "The Employee is engaged on a 1-year fixed-term contract subject to a probation period of 3 months from the start date.",
    explanation:
      "Op een tijdelijk contract van minder dan twee jaar mag de proeftijd maximaal één maand bedragen.",
    citation: {
      article: "Art. 7:652",
      law: "Burgerlijk Wetboek (BW)",
      description: "Probationary period",
      source: "nl-labor-law.json",
    },
    action: "De proeftijd is nietig; opzegging tijdens de proeftijd is daarom ongeldig.",
    permitConflict: null,
  },
  {
    type: "clause",
    id: "c3",
    title: "Notice period — 1 month written",
    status: "compliant",
    originalText:
      "Either party may terminate this agreement by providing 1 month written notice, to take effect at the end of the calendar month.",
    explanation:
      "Een opzegtermijn van één maand voldoet aan het wettelijk minimum voor zowel werkgever als werknemer.",
    citation: {
      article: "Art. 7:672",
      law: "Burgerlijk Wetboek (BW)",
      description: "Notice periods for termination",
      source: "nl-labor-law.json",
    },
    action: null,
    permitConflict: null,
  },
  {
    type: "clause",
    id: "c4",
    title: "Overtime up to 45 hours/week in busy periods",
    status: "compliant",
    originalText:
      "The Employee may be required to work up to 45 hours per week during busy periods, in line with the Arbeidstijdenwet ceilings averaged over the relevant reference period.",
    explanation:
      "Een piek tot 45 uur per week valt binnen het wettelijke gemiddelde van 48 uur over 16 weken.",
    citation: {
      article: "Arbeidstijdenwet §5:7",
      law: "Arbeidstijdenwet",
      description: "Working time and overtime limits",
      source: "nl-labor-law.json",
    },
    action: null,
    permitConflict: null,
  },
  {
    type: "clause",
    id: "c5",
    title: "Confidentiality for 2 years post-termination",
    status: "unchecked",
    originalText:
      "The Employee shall not disclose any confidential information belonging to the Employer to third parties for a period of 2 years following termination of this agreement.",
    explanation:
      "Geheimhoudingsbedingen vallen buiten de huidige set regels — dit kan dus niet worden beoordeeld.",
    citation: null,
    action: null,
    permitConflict: null,
  },
  {
    type: "clause",
    id: "c6",
    title: "Work-from-home equipment and stipend",
    status: "unchecked",
    originalText:
      "When working from home, the Employee provides their own equipment. The Employer reimburses €30 per month towards utilities, payable monthly with salary.",
    explanation:
      "Thuiswerkvergoeding valt buiten de huidige set regels — dit kan dus niet worden beoordeeld.",
    citation: null,
    action: null,
    permitConflict: null,
  },
];

const NL_SUMMARY = {
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
    {
      text: "U heeft recht op een schriftelijke opzegging die voldoet aan de wettelijke minimumtermijnen.",
      citation: {
        article: "Art. 7:672",
        law: "Burgerlijk Wetboek (BW)",
        description: "Notice periods for termination",
        source: "nl-labor-law.json",
      },
    },
  ],
};

// Encode events as a single Anthropic-style content_block_delta event so
// the analyze route's parser can split on "data: " prefixes within the
// streamed text body. Used as a fallback HTTP body for places that
// intercept Anthropic at the network layer (currently unused — kept for
// future MSW-based suites).
export function mockClaudeAnalyzeStream(): string {
  const lines = [
    ...NL_CLAUSES.map((c) => `data: ${JSON.stringify(c)}`),
    `data: ${JSON.stringify(NL_SUMMARY)}`,
    "data: [DONE]",
  ];
  const text = lines.join("\n") + "\n";

  const messageStart = `event: message_start\ndata: ${JSON.stringify({
    type: "message_start",
    message: { id: "msg_test", role: "assistant", content: [], model: "claude-sonnet-4-6" },
  })}\n\n`;
  const blockStart = `event: content_block_start\ndata: ${JSON.stringify({
    type: "content_block_start",
    index: 0,
    content_block: { type: "text", text: "" },
  })}\n\n`;
  const delta = `event: content_block_delta\ndata: ${JSON.stringify({
    type: "content_block_delta",
    index: 0,
    delta: { type: "text_delta", text },
  })}\n\n`;
  const blockStop = `event: content_block_stop\ndata: ${JSON.stringify({
    type: "content_block_stop",
    index: 0,
  })}\n\n`;
  const messageStop = `event: message_stop\ndata: ${JSON.stringify({
    type: "message_stop",
  })}\n\n`;

  return messageStart + blockStart + delta + blockStop + messageStop;
}
