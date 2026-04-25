// Validates Clauseguard JSON rulesets, permits, and rights summaries.
// Invariant: rule.source === top-level.source === filename.
// Run: npx tsx scripts/validate-rulesets.ts

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

interface RuleshapeMinimal {
  jurisdiction: string;
  source: string;
  rules?: Array<Record<string, unknown>>;
  permits?: Array<Record<string, unknown>>;
  rights?: Array<Record<string, unknown>>;
}

interface Failure {
  readonly file: string;
  readonly message: string;
}

const DATA_DIR = join(process.cwd(), "data");

const REQUIRED_RULE_FIELDS = [
  "id",
  "clauseType",
  "article",
  "law",
  "description",
  "source",
] as const;

function fail(failures: Failure[], file: string, message: string): void {
  failures.push({ file, message });
}

function validateLaborLaw(file: string, doc: RuleshapeMinimal, failures: Failure[]): void {
  if (doc.source !== file) {
    fail(failures, file, `top-level source "${doc.source}" must equal filename`);
  }
  if (!Array.isArray(doc.rules) || doc.rules.length === 0) {
    fail(failures, file, "no rules in file");
    return;
  }
  const seen = new Set<string>();
  for (const r of doc.rules) {
    for (const field of REQUIRED_RULE_FIELDS) {
      if (typeof r[field] !== "string" || (r[field] as string).length === 0) {
        fail(
          failures,
          file,
          `rule missing required field "${field}": ${JSON.stringify(r.id ?? r)}`,
        );
      }
    }
    if (r.source !== doc.source) {
      fail(
        failures,
        file,
        `rule "${r.id}" source "${r.source}" must equal top-level "${doc.source}"`,
      );
    }
    if (!r.illegalIf && !r.exploitativeIf) {
      fail(
        failures,
        file,
        `rule "${r.id}" must define at least one of illegalIf or exploitativeIf`,
      );
    }
    const key = `${r.article}|${r.clauseType}`;
    if (seen.has(key)) {
      fail(failures, file, `duplicate (article + clauseType) pair: ${key}`);
    }
    seen.add(key);
  }
}

function validatePermits(file: string, doc: RuleshapeMinimal, failures: Failure[]): void {
  if (doc.source !== file) {
    fail(failures, file, `top-level source "${doc.source}" must equal filename`);
  }
  if (!Array.isArray(doc.permits) || doc.permits.length === 0) {
    fail(failures, file, "no permits in file");
    return;
  }
  for (const p of doc.permits) {
    if (typeof p.id !== "string" || (p.id as string).length === 0) {
      fail(failures, file, `permit missing id: ${JSON.stringify(p)}`);
    }
    if (p.source !== doc.source) {
      fail(
        failures,
        file,
        `permit "${p.id}" source "${p.source}" must equal top-level "${doc.source}"`,
      );
    }
  }
}

function validateRights(file: string, doc: RuleshapeMinimal, failures: Failure[]): void {
  if (!Array.isArray(doc.rights) || doc.rights.length === 0) {
    fail(failures, file, "no rights in file");
    return;
  }
  for (const r of doc.rights) {
    if (typeof r.text !== "string" || (r.text as string).length === 0) {
      fail(failures, file, `rights item missing text`);
    }
    if (!r.citation || typeof r.citation !== "object") {
      fail(failures, file, `rights item missing citation: ${JSON.stringify(r)}`);
    }
  }
}

function main(): void {
  const failures: Failure[] = [];
  const files = readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"));

  for (const file of files) {
    const path = join(DATA_DIR, file);
    let doc: RuleshapeMinimal;
    try {
      doc = JSON.parse(readFileSync(path, "utf8")) as RuleshapeMinimal;
    } catch (e) {
      fail(failures, file, `JSON parse error: ${e instanceof Error ? e.message : String(e)}`);
      continue;
    }

    if (file.endsWith("-labor-law.json")) {
      validateLaborLaw(file, doc, failures);
    } else if (file.endsWith("-permit-categories.json")) {
      validatePermits(file, doc, failures);
    } else if (file.startsWith("rights-summary-")) {
      validateRights(file, doc, failures);
    }
  }

  if (failures.length > 0) {
    console.error(
      `Ruleset validation failed (${failures.length} issue${failures.length === 1 ? "" : "s"}):`,
    );
    for (const f of failures) {
      console.error(`  ${f.file}: ${f.message}`);
    }
    process.exit(1);
  }
  console.log(`OK — ${files.length} ruleset file${files.length === 1 ? "" : "s"} valid.`);
}

main();
