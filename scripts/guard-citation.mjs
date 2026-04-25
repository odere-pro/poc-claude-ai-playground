#!/usr/bin/env node
// Fail CI if any flagged-clause render path doesn't mount <CitationBlock>.
// Spec §Reuse rules: every ClauseCard with status !== 'unchecked' must
// include CitationBlock. We grep for ClauseCard.tsx and confirm the
// import + reference is present.

import { readFileSync } from "node:fs";

const FILE = "src/components/organisms/ClauseCard.tsx";
const content = readFileSync(FILE, "utf8");

if (!/from\s+["']@\/components\/molecules\/CitationBlock["']/.test(content)) {
  console.error(`✗ ${FILE} does not import CitationBlock`);
  process.exit(1);
}
if (!/<CitationBlock\b/.test(content)) {
  console.error(`✗ ${FILE} does not render <CitationBlock>`);
  process.exit(1);
}
console.log("✓ ClauseCard mounts CitationBlock");
