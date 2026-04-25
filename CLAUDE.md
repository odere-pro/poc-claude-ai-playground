# Clauseguard

Upload an employment contract → get a streamed compliance report in your language with every clause cited to a real legal article.

**Tagline:** _"Know what you signed."_

## Architecture

Next.js 16 App Router + shadcn/ui. API routes at `src/app/api/*` stream via Anthropic SDK. JSON rulesets bundled in `data/` and loaded per-request via dynamic `import()`. Vercel deployment. No database — `localStorage` summary only, no full clause text.

## Default routing

For any task touching code, tests, or config, FIRST invoke the `full-stack-developer` agent to get a routing plan. Skip only for read-only questions and one-line edits.

## Available tools — use these, don't reinvent

### MCP servers (project-scoped, in `.mcp.json`)

- **shadcn**: real-time component docs and props. Query before building UI.
- **nextjs**: framework docs + dev-server awareness.
- **playwright**: browser automation for self-QA.
- **structurizr**: C4 architecture diagrams.
- **gemini-image**: pitch images only.

### Plugins

- **Vercel** (`vercel@claude-plugins-official`): `/deploy`, `/vercel-logs`.
- **ECC**: code-reviewer + security-reviewer + typescript-reviewer agents.

## Conventions

- TypeScript strict. No `any`. No non-null assertions unless justified inline.
- Immutable data. New objects, never mutate.
- Files 200–400 lines typical, 800 max.
- Feature-based organization under `src/`.
- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`.
- One branch per feature. PR before merge.

## Scripts

| Script                               | Does                            |
| ------------------------------------ | ------------------------------- |
| `npm run dev`                        | Start dev server                |
| `npm run build`                      | Production build                |
| `npm run check`                      | typecheck + lint + format check |
| `npm run fix`                        | lint --fix + format             |
| `npm run typecheck`                  | `tsc --noEmit`                  |
| `npm run test`                       | Vitest (unit + integration)     |
| `npm run test:unit` / `:integration` | Single project                  |
| `npm run test:e2e`                   | Playwright                      |
| `npm run ship`                       | check + test + build            |

Pre-commit runs lint-staged on staged files.

## Testing

- Unit: `src/lib/*.test.ts`, `src/context/*.test.tsx`
- Integration: `src/app/api/**/*.test.ts`, `src/components/**/*.test.tsx` (MSW + happy-dom)
- E2E: `tests/e2e/*.spec.ts` (Playwright)
- One Playwright happy-path + one error-path per user-facing flow.
- No mocking the Anthropic SDK at integration level — stub at the route handler boundary.
- Fixtures in `data/fixtures/` are anonymized; never check in real user data.

## Security (immigration + employment docs = sensitive)

- Never log contract content, filenames, or user PII.
- Never persist user documents to disk.
- All uploads validated: MIME allowlist + magic-byte check + 10MB size cap.
- Anthropic / Solvimon / Reson8 keys server-only. Never expose to client bundle.
- CSP headers; no inline scripts.
- Rate-limit `/api/analyze`, `/api/transcribe`, `/api/voice-command` per IP.
- Strip EXIF / metadata from images before processing.
- Error responses must NOT echo input back to the client.

## Groundedness rules (NON-NEGOTIABLE)

- Flagged clauses MUST have a citation matching a rule in the loaded ruleset.
- Citations not present in the ruleset are hallucinations — `lib/citationValidator` MUST catch them.
- Clauses with no matching rule are marked `unchecked`, never silently dropped.
- `citation.source` MUST be exactly `"{jurisdiction}-labor-law.json"`.

## Reuse rules

- No color values in component files — only `var(--color-*)`.
- No font-family / font-size in component files — only `var(--font-*)` / `var(--text-*)`.
- `CitationBlock` required inside every `ClauseCard` where `status !== "unchecked"` (CI-enforced).
- `VoiceController` renders once per page, gated by `NEXT_PUBLIC_VOICE_ENABLED`.
- Atoms have no internal state — purely controlled.

## Deployment

- `/deploy` (Vercel plugin) or `vercel deploy`.
- CI on every push: lint, typecheck, vitest, build, Playwright against preview URL.
- Production auto-deploys on merge to `main`.

## Domain knowledge

- `data/nl-labor-law.json` — Dutch labor law rules. Every citation article must match an entry.
- `data/se-labor-law.json` — Swedish labor law (LAS).
- `data/nl-permit-categories.json` — IND permit types. Do not invent restrictions.
- `data/se-permit-categories.json` — Migrationsverket permit types.
- `data/rights-summary-{nl,se}.json` — union contacts + rights.
- `data/fixtures/` — anonymized test contracts.

## Key source files

- `src/lib/anthropic.ts` — Anthropic SDK client + `MODEL`.
- `src/lib/prompts.ts` — `buildAnalysisPrompt`, `buildVoiceIntentPrompt`.
- `src/lib/citationValidator.ts` — presence + authenticity validation.
- `src/lib/clauseOrdering.ts` — sort priority for results.
- `src/lib/streamClient.ts` — client-side SSE consumer with 100ms batching.
- `src/lib/solvimon.ts` — `checkEntitlement` + `reportUsage` (soft-fail).
- `src/lib/languageDetector.ts` — localStorage → browser → "en" cascade.
- `src/lib/types.ts` — shared types (Jurisdiction, ClauseEvent, SummaryEvent, …).
- `src/context/ReportContext.tsx` — global state + reducer.
- `src/app/api/analyze/route.ts` — main streaming endpoint.
- `src/app/api/transcribe/route.ts` — Reson8 STT proxy (P1).
- `src/app/api/voice-command/route.ts` — Claude tool-use voice intent (P1).

## Gotchas

- `docs/gotchas.md` is a running log of non-obvious pitfalls. Read it before debugging Vercel, shadcn, Playwright MCP, Next.js 16, or Tailwind v4 issues.
- Append a new entry when a non-obvious bug costs ≥ 15 min. See `.claude/rules/gotchas.md`.
