# Setup Guide — Hackathon Environment

Everything needed to turn a clean clone into a working hackathon-ready environment. Work through this top-to-bottom once; after that, you only set keys per-event.

## 1. Accounts (free tier)

| Account                  | Used for                    | Sign up               |
| ------------------------ | --------------------------- | --------------------- |
| GitHub                   | Repo + CI/CD                | github.com            |
| Vercel                   | Deploy + preview URLs       | vercel.com            |
| Anthropic                | Claude Code + app inference | console.anthropic.com |
| ngrok                    | Public URL for judges       | ngrok.com             |
| Sentry _(opt)_           | Runtime errors              | sentry.io             |
| Google AI Studio _(opt)_ | Gemini image gen            | aistudio.google.com   |
| Figma _(opt)_            | Design-to-code              | figma.com             |
| AWS _(opt)_              | S3 / DynamoDB / Lambda      | aws.amazon.com        |

## 2. Global tools

```bash
# Claude Code (already installed)
claude --version

# Node 22 via nvm — .nvmrc is honored by the auto-hook
node -v

# D2 — user-flow diagrams
curl -fsSL https://d2lang.com/install.sh | sh -s --

# AWS CLI (optional)
aws configure

# gh CLI (already installed & authed)
gh auth status
```

Project-local CLIs (installed via `npm install`):
`@playwright/test`, `vercel`, `ngrok` — invoke with `npx`.

## 3. Keys

Copy `.env.example` → `.env.local` and fill in:

```bash
ANTHROPIC_API_KEY=...
NGROK_AUTHTOKEN=...
# Optional below
GEMINI_API_KEY=...
FIGMA_PERSONAL_ACCESS_TOKEN=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=eu-west-1
SENTRY_DSN=...
ECC_HOOK_PROFILE=minimal
```

The zsh `chpwd` hook auto-sources `.env` when you `cd` into the project.

## 4. Claude Code toolchain (already configured)

### MCP servers (project-scoped, in `.mcp.json`)

```bash
claude mcp list   # should show: shadcn, nextjs, playwright, structurizr, gemini-image
```

### Plugins

```bash
claude plugin list   # should include: vercel@claude-plugins-official
```

### Skills

```bash
ls .claude/skills    # shadcn
```

### ECC (user-level, in `~/.claude/`)

```bash
ls ~/.claude/agents  # code-reviewer, security-reviewer, typescript-reviewer, ...
ls ~/.claude/skills
ls ~/.claude/rules
```

### Project hooks & rules

- `.claude/settings.json` — bash-only PostToolUse, SessionStart, Stop hooks
- `.claude/rules/*.md` — typescript, nextjs, security, testing, git

## 5. CI/CD

### GitHub secrets (Settings → Secrets → Actions)

| Secret                      | From                                       |
| --------------------------- | ------------------------------------------ |
| `ANTHROPIC_API_KEY`         | console.anthropic.com                      |
| `VERCEL_TOKEN`              | vercel.com → Settings → Tokens             |
| `VERCEL_ORG_ID`             | `.vercel/project.json` after `vercel link` |
| `VERCEL_PROJECT_ID`         | same file                                  |
| `SENTRY_AUTH_TOKEN` _(opt)_ | sentry.io                                  |

### Vercel link

```bash
npx vercel link        # creates .vercel/project.json (gitignored)
npx vercel env pull    # mirrors prod env vars to .env.local
```

## 6. Pre-flight checklist

Run these before the event. Every one must pass.

1. `npm install` — clean install works
2. `npm run dev` → `http://localhost:3000` renders
3. `claude mcp list` → 5 connected
4. In Claude: "use playwright mcp to open localhost:3000 and screenshot" → image appears
5. `npx vercel deploy` → live URL
6. Push a branch → CI passes on the PR
7. `echo 'a -> b' > /tmp/t.d2 && d2 /tmp/t.d2 /tmp/t.svg` → SVG
8. `npx @marp-team/marp-cli README.md --pptx --output /tmp/t.pptx` → PPTX
9. Edit a TS file → PostToolUse hook auto-formats with Prettier
10. `npx ngrok http 3000` → public URL

## 7. Hackathon day

```bash
cd bank-readiness-checker
git pull
cp .env.example .env.local
# fill keys
npm install
npm run dev
claude
```

First prompt:

> Read CLAUDE.md. Then build the document upload page using shadcn/ui Card, Button, and a drop zone. User drops PDF or image files of their residence permit and employment contract. Use playwright mcp to verify the upload works end-to-end.

## 8. Troubleshooting

Before diving in, skim [`docs/gotchas.md`](./docs/gotchas.md) — most hackathon-stack pitfalls already have an entry.

| Symptom                              | Fix                                                                       |
| ------------------------------------ | ------------------------------------------------------------------------- |
| MCP shows "Failed to connect"        | `claude mcp remove <name>` then re-add. Restart Claude Code.              |
| Hook fires too often / slows edits   | `export ECC_HOOK_PROFILE=minimal` or unset `ECC_DISABLED_HOOKS`.          |
| Vercel function times out            | Split the slow handler in two; upgrade to Pro for 60s limit.              |
| Playwright goes through bash not MCP | Say "use playwright mcp" explicitly in the first message.                 |
| Context too long                     | `/compact`. If still bad, start new session — memory hook restores state. |
| CI fails, local build works          | Missing GitHub secret (usually `ANTHROPIC_API_KEY`).                      |
| ngrok drops mid-demo                 | Free tier = 2h cap; restart `npx ngrok http 3000`.                        |

## 9. Cost estimate (24h hackathon)

| Item                                   | Cost       |
| -------------------------------------- | ---------- |
| Anthropic inference                    | $5–15      |
| Gemini images (5)                      | $0.50      |
| AWS (S3 / DynamoDB / Lambda, optional) | < $1       |
| Vercel / GitHub / ngrok                | Free       |
| **Total**                              | **~$6–17** |

---

Follow the specialized guides next:

- [Frontend](./docs/guides/frontend.md)
- [Backend](./docs/guides/backend.md)
- [UX/UI](./docs/guides/uxui.md)
- [Pitching](./docs/guides/pitching.md)
- [Demo](./docs/guides/demo.md)
