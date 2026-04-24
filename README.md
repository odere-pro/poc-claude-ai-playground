# Bank Readiness Checker

Paste your documents → which Dutch banks will accept you, what's missing, and a pre-filled application.

Built for a Claude Code hackathon: Next.js 16 + shadcn/ui + Anthropic SDK + Vercel.

## Quick start

```bash
cp .env.example .env.local       # fill in ANTHROPIC_API_KEY
npm install
npm run dev
```

Open `http://localhost:3000`.

## Pre-hackathon setup (T-1 day)

Run the pre-zero checklist end-to-end before the event clock starts:

- [`docs/PRE_ZERO_CHECKLIST.md`](./docs/PRE_ZERO_CHECKLIST.md) — accounts, plugins, MCPs, secrets, Vercel link, CI smoke
- `bash scripts/preflight.sh` — validation gate; must return `[ALL CLEAR]` before tagging `v0.1.0-preflight-ready`

## Scripts

| Command               | Purpose            |
| --------------------- | ------------------ |
| `npm run dev`         | Start dev server   |
| `npm run build`       | Production build   |
| `npm run typecheck`   | `tsc --noEmit`     |
| `npm run lint`        | ESLint             |
| `npm run test:e2e`    | Playwright tests   |
| `npm run test:e2e:ui` | Playwright UI mode |

## Toolchain

- **Next.js 16** (App Router) · **React 19** · **TypeScript strict**
- **shadcn/ui** (New York / Zinc) + Tailwind v4
- **Anthropic SDK** (provider-abstracted — direct API or Bedrock)
- **Playwright** for e2e
- **Vercel** for deploy
- **Claude Code** with 5 MCPs (shadcn, nextjs, playwright, structurizr, gemini-image), shadcn skill, ECC code-reviewer + security-reviewer

## Docs

- [`CLAUDE.md`](./CLAUDE.md) — instructions for Claude Code
- [`docs/PRE_ZERO_CHECKLIST.md`](./docs/PRE_ZERO_CHECKLIST.md) — T-1 day setup checklist (Claude + MCPs first, then Vercel + CI)
- [`docs/SETUP_GUIDE.md`](./docs/SETUP_GUIDE.md) — hackathon environment setup (accounts, tools, pre-flight)
- [`docs/guides/frontend.md`](./docs/guides/frontend.md) — UI components, routing, state
- [`docs/guides/backend.md`](./docs/guides/backend.md) — API routes, model calls, data
- [`docs/guides/uxui.md`](./docs/guides/uxui.md) — shadcn/ui patterns, autoVerify, visual polish
- [`docs/guides/pitching.md`](./docs/guides/pitching.md) — narrative, slides with Marp, images with Gemini
- [`docs/guides/demo.md`](./docs/guides/demo.md) — live-demo script, ngrok, failsafes
- [`docs/matching-logic.md`](./docs/matching-logic.md) — matching engine reference
- [`docs/gotchas.md`](./docs/gotchas.md) — running log of non-obvious pitfalls (read before debugging)

## Repository layout

```
src/app/         Next.js routes (pages + API)
src/lib/         types, matching engine, Anthropic client
src/components/  shadcn/ui components
data/            bank rules + permit categories (placeholders)
tests/e2e/       Playwright specs
docs/            guides + diagrams
.claude/         settings.json, rules/, skills/
.mcp.json        project-scoped MCP servers
```

## Environment

All variables documented in [`.env.example`](./.env.example). Required: `ANTHROPIC_API_KEY`, `NGROK_AUTHTOKEN`.

## License

Hackathon project — see repo settings.
