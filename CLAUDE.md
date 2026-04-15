# Immigrant Bank Account Readiness Checker

Paste your documents → which banks will accept you + what's missing + pre-filled application.

## Architecture

Next.js 16 App Router + shadcn/ui. API routes at `src/app/api/*` handle document processing via the Anthropic SDK. Vercel deployment. Optional AWS extensions (S3, DynamoDB, Lambda).

## Available tools — use these, don't reinvent

### MCP servers (project-scoped, in `.mcp.json`)

- **shadcn**: real-time component docs and props. Query before building UI.
- **nextjs** (Next.js DevTools): framework docs + dev-server awareness.
- **playwright**: browser automation. Say "use playwright mcp to test [flow]" for self-QA.
- **structurizr**: C4 architecture diagrams (hosted). Write Structurizr DSL.
- **gemini-image**: pitch presentation images only (needs `GEMINI_API_KEY`).

### Plugins

- **Vercel** (`vercel@claude-plugins-official`): `/deploy`, `/vercel-logs`.
- **ECC** (installed under `~/.claude/`): code-reviewer + security-reviewer agents; TS rules; hooks run on save.

### Skills

- **shadcn** skill at `.claude/skills/shadcn/` — project-scoped shadcn guidance.

### CLI tools

- **D2** — user flow diagrams (`d2 file.d2 file.svg`).
- **Marp** — pitch deck (`npx @marp-team/marp-cli slides.md --pptx`).
- **gh** — branches, PRs, issue management (no GitHub MCP needed).
- **AWS CLI** — when AWS extensions are active.

## Conventions

- TypeScript strict. No `any`. No non-null assertions unless justified inline.
- Immutable data. New objects, never mutate.
- Files 200–400 lines typical, 800 max.
- Feature-based organization under `src/`.
- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`.
- One branch per feature. PR before merge.

## Scripts — use these instead of raw tools

Always prefer `npm run <script>` over calling `tsc` / `eslint` / `prettier` directly. Saves tokens and picks up project config.

| Script                                    | Does                                         |
| ----------------------------------------- | -------------------------------------------- |
| `npm run dev`                             | Start dev server                             |
| `npm run build`                           | Production build                             |
| `npm run check`                           | typecheck + lint + format check (fast, safe) |
| `npm run fix`                             | lint --fix + format (auto-apply)             |
| `npm run typecheck`                       | `tsc --noEmit` only                          |
| `npm run lint` / `npm run lint:fix`       | ESLint                                       |
| `npm run format` / `npm run format:check` | Prettier                                     |
| `npm run test:e2e`                        | Playwright                                   |
| `npm run ship`                            | `check` + `build` — run before push          |

Pre-commit runs lint-staged automatically (lint + format on staged files).

## Testing

- One Playwright happy-path test (upload → match → results).
- One error-case test (invalid document).
- Run: `npm run test:e2e`.
- Interactive: "use playwright mcp to open localhost:3000 and test [flow]".

## Security

- Never persist user documents to disk unless they explicitly opt in (S3 path).
- Never log document contents.
- Never commit secrets; use `.env.local`.
- Immigration docs are sensitive. Fix security-reviewer findings immediately.

## Deployment

- `/deploy` (Vercel plugin) or `vercel deploy`.
- CI on every push: lint, typecheck, build, Playwright.
- Production auto-deploys on merge to `main`.

## Gotchas (must read)

- `docs/gotchas.md` is a running log of non-obvious pitfalls on this stack. Read it before debugging any issue in Vercel, shadcn, Playwright MCP, Next.js 16, Tailwind v4, or ECC hooks.
- When you spend ≥ 15 min diagnosing a non-obvious bug, append a new entry following the template in `docs/gotchas.md`. Rule detail in `.claude/rules/gotchas.md`.

## Domain knowledge

- `data/bank-rules/*.json` — one per bank (ING, ABN AMRO, Bunq, Rabobank).
  Shape defined in `src/lib/types.ts` → `BankRules`.
- `data/document-types.json` — canonical document type keys.
- `data/permit-categories.json` — IND permit categories.
- `docs/matching-logic.md` — matching rules and scoring.
- `tests/fixtures/` — anonymized sample documents.

All placeholder during scaffold. Populate before the hackathon.

## Key source files

- `src/lib/anthropic.ts` — provider-abstracted Anthropic client + `MODEL` constant.
- `src/lib/matching.ts` — `matchBank(rules, docs, opts)` returns `MatchResult`.
- `src/lib/types.ts` — shared types.
- `src/app/api/extract/route.ts` — document extraction endpoint (stub).
- `src/app/api/match/route.ts` — bank matching endpoint (stub).
