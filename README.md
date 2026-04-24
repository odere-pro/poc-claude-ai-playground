# Bank Readiness Checker

Paste your documents → which Dutch banks will accept you, what's missing, and a pre-filled application.

Built for a Claude Code hackathon: Next.js 16 + shadcn/ui + Anthropic SDK + Vercel.

## Quick start

```bash
cp .env.example .env.local   # fill in ANTHROPIC_API_KEY
npm install
npm run dev                  # → http://localhost:3000
```

Then launch Claude Code — AI tooling activates automatically:

```bash
claude
```

First prompt: `Read CLAUDE.md. Then build the document upload page using shadcn/ui.`

---

## AI-first development

This project is designed for AI-assisted development with Claude Code. Everything below is pre-configured — no manual setup needed beyond the env keys.

### MCP servers (project-scoped, in `.mcp.json`)

Five servers connect automatically when you open a Claude session.

| MCP              | Purpose                               | Example prompt                                                  |
| ---------------- | ------------------------------------- | --------------------------------------------------------------- |
| **shadcn**       | Component docs + correct props        | `use shadcn mcp to show Card props`                             |
| **nextjs**       | Dev-server awareness + framework docs | `use nextjs mcp to check server status`                         |
| **playwright**   | Browser automation + self-QA          | `use playwright mcp to test the upload flow on localhost:3000`  |
| **structurizr**  | C4 architecture diagrams              | `render a C4 context diagram for this system`                   |
| **gemini-image** | Pitch deck image generation           | `use gemini-image to generate a hero image for the pitch slide` |

Always say **"use playwright mcp"** explicitly — otherwise Claude defaults to the Bash CLI.

`gemini-image` requires `GEMINI_API_KEY` in `.env.local` or it won't connect.

→ Deep dive: [`docs/ai/mcp-servers.md`](./docs/ai/mcp-servers.md)

### Project agents (in `.claude/agents/`)

Project-scoped agents live in the repo and travel with it. They know this stack, scripts, and security model.

| Agent                    | Trigger                                                      | What it does                                                                                                                                                        |
| ------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **full-stack-developer** | Manual: `Use the full-stack-developer agent to plan <task>.` | Read-only orchestrator. Routes the request to the right specialist subagents and MCPs, and enforces the discover → plan → TDD → implement → review → ship pipeline. |

Use it for any non-trivial feature, security-sensitive change (uploads, API routes, `src/lib/anthropic.ts`), or end-to-end workflow. It returns a routing plan; the parent session executes.

### ECC agents (user-level, in `~/.claude/`)

Agents run automatically during the session and can be invoked directly. The `full-stack-developer` orchestrator composes these.

| Agent                   | Auto-triggers           | What it does                            |
| ----------------------- | ----------------------- | --------------------------------------- |
| **code-reviewer**       | After code write/modify | Quality, patterns, best practices       |
| **security-reviewer**   | Auth, API, upload code  | OWASP Top 10, secret leaks, PII in logs |
| **typescript-reviewer** | `.ts` / `.tsx` edits    | Type safety, strict idioms              |

Invoke manually: `Use the security-reviewer agent to check src/app/api/extract/route.ts.`

→ Deep dive: [`docs/ai/ecc-plugins.md`](./docs/ai/ecc-plugins.md)

### Hooks (auto-run, no action needed)

| Event         | What runs                                         |
| ------------- | ------------------------------------------------- |
| Session start | Checks `.env.local`, reports missing keys         |
| Edit / Write  | Prettier formats the file automatically           |
| Session stop  | `npm run build` — catches type errors before push |

Slow edit loop? `export ECC_HOOK_PROFILE=minimal` skips lint/type-check during fast iteration.

### Project rules auto-loaded by Claude

| Rule file                     | Governs                                       |
| ----------------------------- | --------------------------------------------- |
| `.claude/rules/typescript.md` | Strict types, immutability, Zod at boundaries |
| `.claude/rules/nextjs.md`     | App Router, Server Components, thin routes    |
| `.claude/rules/security.md`   | Document handling, secrets, upload validation |
| `.claude/rules/testing.md`    | Playwright, no SDK mocks                      |
| `.claude/rules/git.md`        | Conventional commits, PR before merge         |

### Presentation tooling

Build the pitch deck entirely from Claude Code:

| Tool                 | Purpose                                     | Command                                                        |
| -------------------- | ------------------------------------------- | -------------------------------------------------------------- |
| **Marp**             | Author slides in Markdown → PPTX            | `npx @marp-team/marp-cli slides.md --pptx --output pitch.pptx` |
| **gemini-image** MCP | Generate emotional visuals for pitch slides | `use gemini-image to generate …` (3-call iteration pattern)    |
| **D2**               | User-flow diagrams                          | `d2 docs/diagrams/user-flow.d2 docs/diagrams/user-flow.svg`    |
| **structurizr** MCP  | Architecture diagrams                       | `render a C4 context diagram …`                                |

See [`docs/guides/pitching.md`](./docs/guides/pitching.md) for the 10-slide narrative arc and ready-to-use prompt recipes.

→ Full workflow guide: [`docs/ai/workflows.md`](./docs/ai/workflows.md)

---

## Scripts

| Command               | Purpose                                |
| --------------------- | -------------------------------------- |
| `npm run dev`         | Start dev server                       |
| `npm run build`       | Production build                       |
| `npm run check`       | Typecheck + lint + format check        |
| `npm run fix`         | Lint --fix + format (auto-apply)       |
| `npm run typecheck`   | `tsc --noEmit`                         |
| `npm run lint`        | ESLint                                 |
| `npm run test:e2e`    | Playwright tests (headless)            |
| `npm run test:e2e:ui` | Playwright UI mode                     |
| `npm run ship`        | `check` + `build` — run before pushing |

Pre-commit runs lint-staged automatically (lint + format on staged files).

## Toolchain

- **Next.js 16** (App Router) · **React 19** · **TypeScript strict**
- **shadcn/ui** (New York / Zinc) + Tailwind v4
- **Anthropic SDK** (provider-abstracted — direct API or Bedrock)
- **Playwright** for e2e
- **Vercel** for deploy

## Docs

### AI tooling

- [`docs/ai/mcp-servers.md`](./docs/ai/mcp-servers.md) — MCP reference + example prompts for all 5 servers
- [`docs/ai/ecc-plugins.md`](./docs/ai/ecc-plugins.md) — ECC agents, rules, skills, hook profiles
- [`docs/ai/workflows.md`](./docs/ai/workflows.md) — 7 practical AI workflow recipes

### Project

- [`CLAUDE.md`](./CLAUDE.md) — full instructions for Claude Code
- [`docs/PRE_ZERO_CHECKLIST.md`](./docs/PRE_ZERO_CHECKLIST.md) — T-1 day setup checklist
- [`docs/SETUP_GUIDE.md`](./docs/SETUP_GUIDE.md) — accounts, tools, pre-flight
- [`docs/matching-logic.md`](./docs/matching-logic.md) — matching engine reference
- [`docs/gotchas.md`](./docs/gotchas.md) — non-obvious pitfalls (read before debugging)

### Feature guides

- [`docs/guides/frontend.md`](./docs/guides/frontend.md) — UI components, routing, state
- [`docs/guides/backend.md`](./docs/guides/backend.md) — API routes, model calls, data
- [`docs/guides/uxui.md`](./docs/guides/uxui.md) — shadcn/ui patterns, visual polish
- [`docs/guides/pitching.md`](./docs/guides/pitching.md) — narrative arc, Marp, Gemini images
- [`docs/guides/demo.md`](./docs/guides/demo.md) — live-demo script, failsafes

## Repository layout

```
src/app/         Next.js routes (pages + API)
src/lib/         types, matching engine, Anthropic client
src/components/  shadcn/ui components
data/            bank rules + permit categories
tests/e2e/       Playwright specs
docs/            guides + diagrams
docs/ai/         AI tooling reference (MCP, ECC, workflows)
.claude/         settings.json, hooks/, rules/, skills/
.mcp.json        project-scoped MCP servers
```

## Pre-hackathon setup (T-1 day)

Run the pre-zero checklist before the event clock starts:

- [`docs/PRE_ZERO_CHECKLIST.md`](./docs/PRE_ZERO_CHECKLIST.md) — accounts, plugins, MCPs, secrets, Vercel link, CI smoke
- `bash scripts/preflight.sh` — validation gate; must return `[ALL CLEAR]`

## Environment

All variables documented in [`.env.example`](./.env.example). Required: `ANTHROPIC_API_KEY`.

## License

Hackathon project — see repo settings.
