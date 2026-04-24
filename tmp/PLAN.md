# Hackathon Readiness Plan

Gap analysis against `docs/SETUP_GUIDE.md`. Everything below is what remains
before the event.

Legend: `[ ]` todo · `[~]` partial / placeholder

---

## 1. Accounts

Create / verify before the event. All free tier except Anthropic credits.

- [ ] **Vercel** — project created and linked (`vercel link`)
- [ ] **Anthropic** — API key issued (hackathon credits if provided)
- [ ] **ngrok** — account + authtoken
- [ ] **Sentry** — project created (optional, add during build)
- [ ] **Google AI Studio** — `GEMINI_API_KEY` (optional, pitch images)
- [ ] **Figma** — PAT (only if designer joins)
- [ ] **AWS** — account + IAM user with S3/DynamoDB/Lambda (only if AWS extensions active)

## 2. Secrets & env

- [ ] Copy `.env.example` → `.env.local`; fill `ANTHROPIC_API_KEY`, `NGROK_AUTHTOKEN`
- [ ] Vercel dashboard: set `ANTHROPIC_API_KEY` (Production + Preview)
- [ ] GitHub Actions secrets: `ANTHROPIC_API_KEY`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- [ ] Optional when added: `GEMINI_API_KEY`, `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, AWS creds

## 3. CLI tools

- [ ] **Vercel CLI** — `npm i -g vercel` (SessionStart hook currently warns)
- [ ] **ngrok** — install + `ngrok config add-authtoken <token>`; pre-sign-up, do NOT do on stage

## 4. Claude Code plugins

- [ ] **Vercel plugin** — `claude plugin install vercel@claude-plugins-official` (enables `/deploy`, `/vercel-logs`)
- [ ] **ECC** — selective install:
      `ecc install --profile developer --with lang:typescript --with agent:code-reviewer --with agent:security-reviewer --with agent:typescript-reviewer --without skill:continuous-learning --without skill:autonomous-loops`

## 5. MCP servers

- [ ] `claude mcp list` — confirm all 5 show **connected**
- [ ] Optional `figma` MCP added only if designer joins

## 6. Skills

- [ ] Verify ECC skills (`tdd`, `backend-patterns`, `build-fix`) loaded after plugin install

## 7. Domain data (currently placeholders)

- [~] `data/bank-rules/{ing,abn-amro,bunq,rabobank}.json` — populate from real bank sites
- [~] `data/document-types.json` — populate canonical types
- [~] `data/permit-categories.json` — populate IND permit categories
- [~] `docs/matching-logic.md` — finalize scoring rules
- [ ] `tests/fixtures/` — add anonymized sample documents (PDF/image)

## 8. App implementation (stubs today)

- [ ] `src/lib/anthropic.ts` — provider-abstracted client + `MODEL` constant
- [ ] `src/lib/matching.ts` — `matchBank(rules, docs, opts)` → `MatchResult`
- [ ] `src/lib/types.ts` — shared types (`BankRules`, `MatchResult`, `Document`)
- [ ] `src/app/api/extract/route.ts` — replace 501 stub; zod-validate input, strip EXIF, call Anthropic
- [ ] `src/app/api/match/route.ts` — replace 501 stub; load rules, score, return envelope
- [ ] Upload UI (shadcn Card + FileUpload + Button, ≤5 files, ≤10MB, MIME + magic-byte check)
- [ ] Results dashboard (Card per bank, Badge for green/yellow/red, Accordion for detail)
- [ ] Rate-limit middleware on `/api/extract` and `/api/match`
- [ ] CSP headers (per `.claude/rules/security.md`)

## 9. Testing

- [ ] Make happy-path test hit real fixture once API routes work
- [ ] Verify `npm run test:e2e` passes in CI

## 10. CI/CD

- [ ] Push a throwaway branch and confirm CI goes green end-to-end
- [ ] First `/deploy` produces a preview URL

## 11. Pitch assets (do last, hours 20–24)

- [ ] 3–5 Gemini images for emotional beats
- [ ] D2 user-flow diagram → `docs/diagrams/user-flow.svg`
- [ ] Structurizr C4 model (Context + Container; Component only if asked)
- [ ] `slides.md` → Marp → PPTX → polish in Google Slides
- [ ] ngrok tunnel test on phone before going on stage

## 12. Pre-flight checklist (run end-to-end the day before)

From `docs/SETUP_GUIDE.md` §Pre-flight — every item must pass:

- [ ] `npm install` clean
- [ ] `npm run dev` serves landing page on :3000
- [ ] `claude mcp list` — all 5 connected
- [ ] Playwright MCP screenshot works from Claude Code
- [ ] `/deploy` produces a live URL
- [ ] Throwaway PR passes CI
- [ ] `d2 test.d2 test.svg` renders
- [ ] `npx @marp-team/marp-cli test.md --pptx` exports
- [ ] ECC hooks fire on a deliberate type error
- [ ] `ngrok http 3000` yields HTTPS URL reachable from phone
- [ ] (AWS) `aws sts get-caller-identity` + `aws s3 ls` succeed
- [ ] (Gemini) test image generation round-trip

---

## Suggested build order at the event

1. **H 0–4** — core flow: upload → extract → match → result on Vercel
2. **H 4–8** — AWS extensions (S3 reuse, DynamoDB history) if scoped in
3. **H 8–12** — polish: Sentry, Playwright happy-path, micro-interactions, diagrams
4. **H 12–20** — stretch: Lambda queue, extra banks, edge cases
5. **H 20–24** — pitch: images, Marp deck, Google Slides polish, rehearsal
