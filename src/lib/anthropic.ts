import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
export const MODEL = "claude-sonnet-4-5";

// To switch to Bedrock: replace the constructor above with
// `new (require("@anthropic-ai/bedrock-sdk").AnthropicBedrock)()` and set AWS env vars.
