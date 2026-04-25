# TODO — Next steps

Status as of 2026-04-25 on `feat/clauseguard`. All milestones M0–M6 from
`/Users/aleksandrderechei/.claude/plans/majestic-enchanting-pond.md`
completed; `npm run ship` green; 49 vitest + 11 Playwright (2 skipped) pass.

## Before opening PR

- [ ] Push branch: `git push -u origin feat/clauseguard`.
- [ ] Decide PR strategy: one big PR or split per the plan
      (PR1: M0–M2, PR2: M3–M5, PR3: M6).
- [ ] Run `security-reviewer` on `src/app/api/`, `src/lib/solvimon.ts`,
      `src/context/ReportContext.tsx`, `src/components/organisms/UploadZone.tsx`.
- [ ] Run `typescript-reviewer` on the diff.
- [ ] Run `a11y-architect` on `ClauseCard`, `SummaryBanner`, `UploadZone`.
- [ ] Run `performance-optimizer`: confirm initial JS < 200 KB gzipped,
      both jurisdiction rulesets dynamic-imported (not statically bundled).

## Loose ends from the build

- [ ] **PDF parsing** — `UploadZone` currently passes `fileName` for file mode
      (placeholder). Wire `pdf.js` (lazy-loaded) to extract text client-side
      before dispatching `SET_CONTRACT_TEXT`. See `frontend.md` data flow step 1.
- [ ] **Real mock stream** — `tests/mocks/mock-stream.ts` is hand-written.
      Add `scripts/generate-mock-stream.ts` that runs against the live
      Claude API with `data/fixtures/fixture-nl-real.txt` and writes the
      captured SSE body. Regenerate when ruleset or fixture changes.
- [ ] **Fixture PDFs** — only `.txt` fixtures exist in
      `data/fixtures/`. Generate matching `.pdf` versions
      (LibreOffice → Export as PDF) so file-mode E2E can run end-to-end.
- [ ] **Rate limiting on `/api/analyze`** — flagged as gap during M2.
      Add per-IP token bucket (Vercel KV via Marketplace, or Edge config).

## P1 polish (when voice ships)

- [ ] Set `NEXT_PUBLIC_VOICE_ENABLED=true` in the Vercel preview env
      and re-run `npx playwright test tests/e2e/voice-navigation.spec.ts`.
- [ ] Replace `IconButton` placeholder paths — `close`, `speak`, `download`
      all currently point at `wave.svg`. Add real SVGs in `public/icons/`.
- [ ] `VoiceController` currently scrolls to clause via
      `[data-testid="clause-card"][data-id="…"]` but `ClauseCard` doesn't
      emit `data-id`. Add `data-id={clause.id}` to `ClauseCard` so
      `NavigationHighlight.scrollIntoView` actually finds the target.

## Demo readiness (morning of)

- [ ] Deploy preview via `/deploy` (Vercel plugin).
- [ ] Run the smoke trio against the preview URL:
      `BASE_URL=<preview> npx playwright test tests/e2e/upload.spec.ts \
tests/e2e/analyze-stream.spec.ts tests/e2e/error-states.spec.ts`.
- [ ] Manual walkthrough: upload `fixture-nl-real.pdf` → `/analyzing` →
      `/results` shows 2 illegal + 2 compliant + 2 unchecked, citations
      match `Art. 7:653` etc., reload shows `SessionRestoreBanner`,
      `localStorage.clauseguard_session` contains only `clauseIds` /
      `clauseStatuses` (grep for `originalText` should be empty).
- [ ] Verify `?force_402=true` triggers `PricingGate` deterministically
      (already covered by E2E; sanity-check in browser).
- [ ] Confirm Solvimon checkout opens in new tab from
      `[data-testid="pricing-tier-individual"]`.

## Post-hackathon

- [ ] Add a third jurisdiction (DE) per `domain-data.md` §"Adding a new
      jurisdiction" — exercises the architecture's jurisdiction-pluggable
      claim for Duco's Q&A.
- [ ] Lighthouse run on production URL; record CWV against the budgets
      in `architecture.md`.
- [ ] Append any ≥ 15-min debugging surprises to `docs/gotchas.md`.
