import "server-only";

import { readFile } from "fs/promises";
import path from "path";
import { rulesetSchema, contractTypeSpecSchema, rightsSummarySchema } from "./schemas";
import type { LoadedRuleSet, Rule, RedFlagClause, RightsItem } from "./types";

const DATA_DIR = path.join(process.cwd(), "data");

// Module-level cache — populated once per process, reused across requests.
let rulesetCache: Map<string, Rule[]> | null = null;
let redFlagCache: RedFlagClause[] | null = null;
let rightsCache: Map<string, RightsItem[]> | null = null;

async function getRuleset(jurisdiction: string): Promise<Rule[]> {
  if (!rulesetCache) rulesetCache = new Map();
  const cached = rulesetCache.get(jurisdiction);
  if (cached) return cached;

  const raw = await readFile(path.join(DATA_DIR, `${jurisdiction}-labor-law.json`), "utf-8");
  const parsed = rulesetSchema.parse(JSON.parse(raw));
  rulesetCache.set(jurisdiction, parsed.rules as Rule[]);
  return parsed.rules as Rule[];
}

async function getRedFlags(): Promise<RedFlagClause[]> {
  if (redFlagCache) return redFlagCache;

  const raw = await readFile(
    path.join(DATA_DIR, "labor-contracts", "red-flag-clauses.json"),
    "utf-8",
  );
  const data = JSON.parse(raw) as { clauses: RedFlagClause[] };
  redFlagCache = data.clauses;
  return redFlagCache;
}

async function getRights(jurisdiction: string): Promise<RightsItem[]> {
  if (!rightsCache) rightsCache = new Map();
  const cached = rightsCache.get(jurisdiction);
  if (cached) return cached;

  try {
    const raw = await readFile(
      path.join(DATA_DIR, `rights-summary-${jurisdiction}.json`),
      "utf-8",
    );
    const parsed = rightsSummarySchema.parse(JSON.parse(raw));
    const items = parsed.rights as RightsItem[];
    rightsCache.set(jurisdiction, items);
    return items;
  } catch {
    // Rights summary is optional — some jurisdictions may not have one yet.
    return [];
  }
}

export async function loadRulesForType(
  typeId: string,
  jurisdiction: string,
): Promise<LoadedRuleSet> {
  const specRaw = await readFile(
    path.join(DATA_DIR, "contract-types", `${typeId}.json`),
    "utf-8",
  );
  const spec = contractTypeSpecSchema.parse(JSON.parse(specRaw));

  const [allRules, allRedFlags, rights] = await Promise.all([
    getRuleset(jurisdiction),
    getRedFlags(),
    getRights(jurisdiction),
  ]);

  const ruleIndex = new Map(allRules.map((r) => [r.id, r]));
  const applicableRules = spec.applicable_rule_ids
    .map((id) => ruleIndex.get(id))
    .filter((r): r is Rule => r !== undefined);

  const redFlagIndex = new Map(allRedFlags.map((r) => [r.id, r]));
  const redFlags = spec.red_flag_ids
    .map((id) => redFlagIndex.get(id))
    .filter((r): r is RedFlagClause => r !== undefined);

  return {
    contractType: spec.id,
    contractTypeTitle: spec.title,
    applicableRules,
    mandatoryClauses: spec.mandatory_clauses,
    redFlags,
    rights,
  };
}

export async function listContractTypes(): Promise<
  { id: string; title: string; jurisdiction: string }[]
> {
  const raw = await readFile(path.join(DATA_DIR, "contract-types", "index.json"), "utf-8");
  const entries = JSON.parse(raw) as { id: string; title: string; jurisdiction: string }[];
  return entries;
}
