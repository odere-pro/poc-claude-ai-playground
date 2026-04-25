import Anthropic from "@anthropic-ai/sdk";

// Pinned for the demo. Bump deliberately — newer models can shift JSON shape
// and break the SSE event contract.
export const MODEL = "claude-sonnet-4-5";

let client: Anthropic | null = null;

/**
 * Lazy SDK accessor. Constructing Anthropic at import time refuses to run in
 * happy-dom (test env) due to the SDK's browser-detection guard. Build the
 * client on first use instead, so route handlers compose cleanly in tests.
 */
export function getAnthropic(): Anthropic {
  if (client) return client;
  client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}
