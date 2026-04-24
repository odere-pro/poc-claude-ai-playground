# Hackathon environment cheat sheet

## Toolchain at a glance

| Layer    | Tools                                                                      |
| -------- | -------------------------------------------------------------------------- |
| Built-in | git, `gh`, bash, autoVerify (screenshot loop)                              |
| CLI      | D2, Marp, ngrok, AWS CLI, Vercel CLI                                       |
| Plugins  | Vercel (`/deploy`, `/vercel-logs`), ECC (code-reviewer, security-reviewer) |
| MCP      | shadcn/ui, Next.js DevTools, Playwright, Structurizr, Gemini image         |
| npm      | `@anthropic-ai/sdk`, `@sentry/nextjs`, `@playwright/test`, AWS SDKs        |

Rule: if Claude Code can run a CLI command to get the same result, skip the MCP.

---

## Setup (one-time)

```bash
cp .env.example .env.local   # fill ANTHROPIC_API_KEY + NGROK_AUTHTOKEN
npm install
claude mcp list              # verify all 5 show connected
/deploy                      # verify Vercel preview URL
```

MCP servers and CI/CD are pre-configured in the repo — no per-developer setup.

---

## Key commands

| What           | Command                                                     |
| -------------- | ----------------------------------------------------------- |
| Dev server     | `npm run dev`                                               |
| Deploy preview | `/deploy` or `vercel deploy`                                |
| Diagram        | `d2 flow.d2 flow.svg`                                       |
| Deck export    | `npx @marp-team/marp-cli slides.md --pptx`                  |
| Public URL     | `ngrok http 3000`                                           |
| Test flow      | "use playwright mcp to open localhost:3000 and test [flow]" |

---

## Build order

| Hours | Focus                                                   |
| ----- | ------------------------------------------------------- |
| 0–4   | Core flow: upload → extract → match → result on Vercel  |
| 4–8   | AWS extensions: S3 reuse, DynamoDB history              |
| 8–12  | Polish: Sentry, Playwright test, hover states, diagrams |
| 12–20 | Stretch: Lambda queue, extra banks, edge cases          |
| 20–24 | Pitch: Gemini images, Marp → Google Slides, rehearsal   |

---

## Env variables

```bash
# Required
ANTHROPIC_API_KEY=
NGROK_AUTHTOKEN=

# Optional
GEMINI_API_KEY=
FIGMA_PERSONAL_ACCESS_TOKEN=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_DEFAULT_REGION=
SENTRY_DSN=
```

---

## Troubleshooting

| Symptom                      | Fix                                                         |
| ---------------------------- | ----------------------------------------------------------- |
| MCP won't connect            | `claude mcp remove [name]` then re-add; restart Claude Code |
| Playwright uses bash not MCP | Say "use playwright mcp" explicitly                         |
| Vercel 10s timeout           | Split extraction and matching into separate API calls       |
| ECC hooks slowing you down   | `export ECC_HOOK_PROFILE=minimal`                           |
| Context degrading            | `/compact` or start new session                             |
| CI fails, local passes       | Check GitHub Actions secrets match `.env.local`             |
| ngrok drops mid-demo         | Free tier: 2h limit — restart with `ngrok http 3000`        |
