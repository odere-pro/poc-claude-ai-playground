import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Pinned for the demo. Bump deliberately — newer models can shift JSON shape
// and break the SSE event contract.
export const MODEL = "claude-sonnet-4-5";
