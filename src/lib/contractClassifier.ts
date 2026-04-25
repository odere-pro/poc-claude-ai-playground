import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import { readFile } from "fs/promises";
import path from "path";
import { listContractTypes } from "./ruleLoader";
import { classifyResponseSchema } from "./schemas";
import type { ClassifyResult, Jurisdiction } from "./types";

const client = new Anthropic();

const GROUND_TRUTH_DIR = path.join(process.cwd(), "data", "contract-types", "ground-truth");
const EXCERPT_LENGTH = 600;

// Module-level cache — populated once per process.
let groundTruthCache: Map<string, string> | null = null;

async function loadGroundTruth(): Promise<Map<string, string>> {
  if (groundTruthCache) return groundTruthCache;

  const types = await listContractTypes();
  const cache = new Map<string, string>();

  await Promise.all(
    types.map(async (t) => {
      try {
        const text = await readFile(path.join(GROUND_TRUTH_DIR, `${t.id}.txt`), "utf-8");
        cache.set(t.id, text.slice(0, EXCERPT_LENGTH));
      } catch {
        // Ground-truth file not yet generated — classifier falls back to name-only.
      }
    }),
  );

  groundTruthCache = cache;
  return cache;
}

function buildUserMessage(
  text: string,
  types: { id: string; title: string; jurisdiction: string }[],
  groundTruth: Map<string, string>,
  jurisdiction?: Jurisdiction,
): string {
  const filtered = types.filter((t) => !jurisdiction || t.jurisdiction === jurisdiction);

  const typesBlock = filtered
    .map((t) => {
      const excerpt = groundTruth.get(t.id);
      const sampleSection = excerpt
        ? `\n  Ground-truth excerpt:\n  """\n  ${excerpt.replace(/\n/g, "\n  ")}\n  """`
        : "";
      return `- ${t.id}: ${t.title} (${t.jurisdiction})${sampleSection}`;
    })
    .join("\n\n");

  return `Available contract types with ground-truth excerpts:\n\n${typesBlock}\n\nContract to classify (first 2000 characters):\n"""\n${text.slice(0, 2000)}\n"""`;
}

export async function classifyContract(
  text: string,
  jurisdiction?: Jurisdiction,
): Promise<ClassifyResult> {
  const [types, groundTruth] = await Promise.all([listContractTypes(), loadGroundTruth()]);

  const userMessage = buildUserMessage(text, types, groundTruth, jurisdiction);

  const message = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 128,
    system: `You are a contract type classifier. Match the given contract text to the closest type from the list.

Each type entry may include a short excerpt from a real ground-truth contract of that type — use this to match language patterns, section headings, and terminology, not just the type name.

Respond with EXACTLY ONE JSON object and nothing else — no markdown, no explanation, no code fences:
{"typeId":"<id from the list>","confidence":<0.0–1.0>,"jurisdiction":"<nl or se>"}

Rules:
- Pick the single best matching typeId.
- confidence: 0.0 = random guess, 1.0 = certain match.
- jurisdiction: "nl" if Dutch, "se" if Swedish. Default "nl" if unclear.
- If none match well, pick the closest and set confidence < 0.5.`,
    messages: [{ role: "user", content: userMessage }],
  });

  const raw = message.content
    .filter((b) => b.type === "text")
    .map((b) => (b as { type: "text"; text: string }).text)
    .join("");

  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return { typeId: "nl-indefinite", confidence: 0, jurisdiction: jurisdiction ?? "nl" };
  }

  const parsed = classifyResponseSchema.safeParse(JSON.parse(jsonMatch[0]));
  if (!parsed.success) {
    return { typeId: "nl-indefinite", confidence: 0, jurisdiction: jurisdiction ?? "nl" };
  }

  return parsed.data;
}
