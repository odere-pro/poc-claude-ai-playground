# Pre-Zero Configuration Checklist

Everything that must be true **before hour 0** of the hackathon. Out of scope: app feature implementation, domain data population, pitch assets — those happen during the event.

Run this end-to-end T-1 day on the setup machine. End state: `bash scripts/preflight.sh` returns `[ALL CLEAR]`.

Legend: `[ ]` todo · `[x]` done · `[~]` partial · `[!]` decide before proceeding

---

## 1. Claude Code baseline

Confirm the session you're running the checklist from is healthy before touching anything else.

```bash
claude --version
claude /doctor           # no project plugin/permission errors
```

Verify project `.claude/` loads:

- [x] `.claude/settings.json` — permissions + hooks, parseable (fork-bomb deny rule removed earlier in this worktree)
- [x] `.claude/hooks/{session-start,format-on-save,session-stop}.sh` — present
- [x] `.claude/rules/{typescript,nextjs,security,testing,git,gotchas}.md` — loaded
- [x] `.claude/skills/shadcn/` — loaded as a skill

User-global plugin notes (not blocking for this repo):

- `llm-wiki-stack` — user-scoped, currently disabled; no longer surfaces in `/doctor`.

## 2. Claude Code plugins + ECC

Install before the MCP step and before any Vercel work, so `/deploy` and the reviewer agents are live when needed.

**Vercel slash-command plugin:**

```bash
claude plugin install vercel@claude-plugins-official
claude plugin list | grep vercel
```

**ECC** — installs into the current Claude settings (global `~/.claude/`), provides reviewer agents and TypeScript rules:

```bash
ecc install --profile developer \
  --with lang:typescript \
  --with agent:code-reviewer \
  --with agent:security-reviewer \
  --with agent:typescript-reviewer \
  --without skill:continuous-learning \
  --without skill:autonomous-loops
```

Verify:

```bash
claude plugin list
claude /doctor                           # no new errors
ls ~/.claude/agents/ 2>/dev/null         # expect code-reviewer, security-reviewer, typescript-reviewer entries
```

**Smoke-test one ECC hook:** introduce a deliberate `any` in any `src/**/*.ts`, save. Expect the TS reviewer to flag it. Revert.

Current state (probed T-1):

- [x] `pr-review-toolkit`, `feature-dev`, `commit-commands`, `superpowers`, `claude-code-setup`, `claude-md-management` already installed
- [ ] `vercel@claude-plugins-official` — install
- [ ] ECC install — run command above

## 3. MCP servers

All five declared in `.mcp.json`. Verify each is reachable before Vercel + CI steps — they'll use playwright MCP for self-QA.

```bash
claude mcp list
```

Required (must show `✓ Connected`):

- [x] **shadcn** — UI component docs
- [x] **nextjs** — framework docs + dev-server awareness
- [x] **playwright** — browser automation (self-QA)
- [x] **structurizr** — C4 diagrams (pitch-adjacent)
- [ ] **gemini-image** — pitch images; requires `GEMINI_API_KEY`. Optional per decision log (§10).

If any show `✗ Failed`:

- **shadcn / nextjs / playwright / structurizr** — restart Claude Code after any `.mcp.json` change; verify npx can reach the registry.
- **gemini-image** — set `GEMINI_API_KEY` in `.env.local` *and* export it in the shell where you launch Claude Code, then restart Claude.

**Smoke-test each critical MCP** (one turn in Claude Code per MCP):

- shadcn: "use shadcn mcp to list available components" → returns catalog
- nextjs: "use nextjs mcp to report current dev-server status" → returns status JSON
- playwright: "use playwright mcp to navigate to https://example.com and screenshot" → returns screenshot artifact

Once these three smoke-test green, the rest of the checklist is agent-assisted.

## 4. Accounts (must exist, free tier OK)

- [x] **GitHub** — repo exists, `gh` CLI authenticated
- [ ] **Vercel** — account + project created (project link happens in §7)
- [ ] **Anthropic** — account + API key (hackathon credits if provided)
- [!] **ngrok** — only if mobile demo from local machine is part of the pitch
- [!] **Google AI Studio** — `GEMINI_API_KEY` (only if gemini-image MCP stays in)
- [!] **Sentry** — add during polish, not pre-zero
- [!] **Figma** — only if a designer joins
- [!] **AWS IAM** — only if AWS extensions scoped in

## 5. CLI tools — install + verify

```bash
node --version       # v20+ (CI uses v22)
npm --version        # >= 10
git --version
gh --version && gh auth status
vercel --version || npm i -g vercel
d2 --version
# optional per decision log:
aws --version
ngrok --version
```

Current state: `node`, `npm`, `git`, `gh`, `d2`, `aws`, `@marp-team/marp-cli` (via npx) all in place. Only `vercel` CLI is expected to be missing — install when running the checklist.

## 6. Secrets & env

**Local `.env.local`:**

```bash
cp .env.example .env.local
# edit: set ANTHROPIC_API_KEY (+ GEMINI_API_KEY if §3 needs it)
```

**Vercel dashboard (Production + Preview):**

```bash
vercel env add ANTHROPIC_API_KEY production preview
# repeat for GEMINI_API_KEY if in scope
```

**GitHub Actions secrets** (used by `.github/workflows/ci.yml` and `deploy.yml`):

```bash
gh secret set ANTHROPIC_API_KEY --body "<value>"
gh secret set VERCEL_TOKEN --body "<value>"
gh secret set VERCEL_ORG_ID --body "<value>"
gh secret set VERCEL_PROJECT_ID --body "<value>"
gh secret list
```

After this, restart Claude Code. The `.claude/hooks/session-start.sh` warning about missing `.env.local` / `ANTHROPIC_API_KEY` should disappear.

## 7. Vercel link + first deploy

```bash
vercel link --yes              # creates .vercel/project.json (gitignored)
vercel env pull .env.local     # sync any dashboard-only vars locally
```

Then from Claude Code invoke `/deploy` (Vercel plugin from §2). Fallback: `vercel --prod` in the shell. Either returns a preview URL.

Smoke:

```bash
curl -I <preview-url>          # 200 OK
```

## 8. CI smoke test on throwaway branch

Verify the pipeline is green end-to-end before event day. If it's red now, debug now, not at hour 0.

```bash
git checkout -b chore/preflight-smoke
git commit --allow-empty -m "chore: trigger CI smoke"
git push -u origin chore/preflight-smoke
gh pr create --fill \
  --title "chore: preflight smoke" \
  --body "Throwaway — verifies CI pipeline green. Do not merge."
gh pr checks --watch
```

Both `check` (typecheck + lint + build) and `test` (Playwright) jobs must succeed. After green: close the PR, delete the branch.

## 9. Validation gate

```bash
bash scripts/preflight.sh
```

Exits 0 only if every prior step is healthy. Prints `[ALL CLEAR]` on success.

Flags:

- `PREFLIGHT_SKIP_E2E=1` — skip Playwright when debugging earlier steps
- `PREFLIGHT_WITH_AWS=1` — require `aws` CLI
- `PREFLIGHT_WITH_NGROK=1` — require `ngrok` CLI
- `PREFLIGHT_WITH_GEMINI=1` — require gemini-image MCP connected

## 10. Decision log — fill before running the checklist

- [ ] ngrok in or out? → affects §4, §5
- [ ] AWS extensions in or out? → affects §4, §5, `PREFLIGHT_WITH_AWS`
- [ ] Sentry in or out? → default: out, add during polish
- [ ] Designer joining? → Figma PAT needed?
- [ ] Pitch images via Gemini in or out? → affects §3, §4, §6, `PREFLIGHT_WITH_GEMINI`

---

## After `[ALL CLEAR]`

Tag the state:

```bash
git tag v0.1.0-preflight-ready
git push --tags
```

From here, the H 0 timer can start. What happens next is out of scope for this file — see `tmp/PLAN.md` §7, §8, §12 and the "Suggested build order at the event" section.
