# Clauseguard — Next steps

Tracked items deferred from the PR #9 remediation pass. Picking these up
moves the repo from "structurally complete + green CI" to "demo-ready".

## P0 — required for live demo

- [ ] Configure GitHub → Vercel auto-deploy: import the repo at
      [vercel.com/new](https://vercel.com/new), confirm Next.js framework
      preset, add env vars (`ANTHROPIC_API_KEY` + Solvimon/Reson8 keys +
      `NEXT_PUBLIC_VOICE_ENABLED`) for Production and Preview scopes, then
      verify a push to a feature branch yields a Preview URL and merge to
      `main` promotes to Production. No local `vercel` CLI needed once Git
      integration is in place.
- [ ] Wire `ANTHROPIC_API_KEY` in Vercel preview + production secrets, then
      run the real `/api/analyze` happy-path against `data/fixtures/fixture-nl-real.txt`
      and confirm streamed clauses + citations in the UI.
- [ ] Add server-side citation-downgrade integration test
      (`src/app/api/analyze/route.test.ts`): feed a fake Anthropic stream that
      emits a clause with a fabricated article, assert the SSE output marks
      it `unchecked` with `citation: null`.
- [ ] Add `STREAM_ERROR` → `incomplete` integration test in `ReportContext.test.tsx`
      asserting the phase transition is dispatched when the SSE consumer reports
      `onError`.
- [ ] Persist `clauseguard.lang` to a cookie when the client cascade runs, so SSR
      and CSR `<html lang>` agree on the second visit (currently the cookie is
      only consumed, never written).
- [ ] Manual contrast audit for the five `--color-status-*` token pairs in light
      and dark mode; bump foreground or background where 4.5:1 fails. Wire an
      axe-core check into the Playwright suite.

## P1 — voice features (gated by `NEXT_PUBLIC_VOICE_ENABLED`)

- [ ] Implement `/api/transcribe` against Reson8 (multipart upload of recorded
      audio Blob → transcript + BCP-47 language).
- [ ] Implement `/api/voice-command` using Anthropic tool-use to map the
      transcript + report context to a `VoiceIntent` discriminated-union
      payload. Use existing `voiceCommandRequestSchema` for the request and
      add a `voiceCommandResponseSchema`.
- [ ] Wire `VoiceController.tsx` to the actual mic capture → transcribe →
      voice-command → TTS state machine (`src/lib/voiceState.ts` already
      handles transitions). Use `toTtsLang` from `src/lib/mappings.ts`.
- [ ] Update `tests/e2e/voice-navigation.spec.ts` to cover at least one full
      intent flow when the flag is on (e.g., "next clause" → next ClauseCard
      becomes highlighted).

## P2 — hardening + polish

- [ ] Migrate `analyzeRequestSchema` to use `unknown` body parsing more strictly
      (currently the route does `await req.json()` then schema-checks; an
      enormous JSON could be parsed before rejection — consider streaming
      `req.text()` with size guard).
- [ ] Add a Playwright test for the keyboard-only upload flow (Tab to "Browse
      files" → Enter → file dialog opens). The current happy-path covers the
      DOM contract but not the keyboard contract end-to-end.
- [ ] Cookie-based persistence of jurisdiction + permit so SSR matches user
      preferences on reload.
- [ ] Replace `data/fixtures/fixture-nl-real.txt` with a real (anonymized) PDF
      so the demo exercises the binary-upload path end-to-end. Add a minimal
      pdf-parse step server-side.
- [ ] Tighten `solvimon.ts` further: handle Solvimon `429` distinctly (back off,
      retry once) instead of soft-fail; the current behavior treats `429` the
      same as a connectivity error.
- [ ] Move `force_402` from a query-param to a request header (e.g.
      `X-Demo-Force-402: 1`) so it's invisible to URL-sharing — current fix
      gates it to non-prod, but a header is sturdier across preview deploys.

## P2.5 — tooling validation

- [ ] Smoke-test every project-scoped MCP server end-to-end
      (`.mcp.json`): `shadcn` (component lookup), `nextjs` (docs query),
      `playwright` (browser automation), `structurizr` (DSL parse +
      diagram render), `gemini-image` (image generation). Document any
      that fail to start or auth in `docs/gotchas.md`.
- [ ] Test the `gemini-image` MCP path: generate one pitch image from a
      short prompt, save to `docs/assets/`, confirm the file is a valid
      PNG/JPG and dimensions match what was requested.
- [ ] Author a Structurizr DSL workspace under `docs/architecture/` that
      describes Clauseguard's C4 model (Context + Container + Component
      for the analyze pipeline). Render to Mermaid via the `structurizr`
      MCP `export-mermaid` tool and check both the `.dsl` source and the
      `.mmd` output into the repo.
- [ ] Generate an HTML pitch deck via the `frontend-slides` skill from
      `README.md` + `CLAUDE.md` content (problem → demo → architecture →
      groundedness story). Output to `docs/pitch/` and link from README.

## P3 — nice-to-haves

- [ ] Light-touch i18n scaffolding (translated UI strings — not just model
      response language).
- [ ] Bot abuse: rate-limit `/api/analyze` per IP via Vercel KV or a small
      durable counter.
- [ ] A `/admin` page (auth-gated) showing recent analyses' summaries (no
      contract text — only counts) for debugging.
- [ ] Add Sentry wiring for client + server. Env keys are already in
      `.env.example` but unused.
