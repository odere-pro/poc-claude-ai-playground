# ECC Plugins

ECC (Enhanced Claude Code) is the user-level layer installed at `~/.claude/`. It adds agents, rules, and skills on top of Claude Code's base capabilities. Everything here activates automatically when you open a session — no commands needed.

---

## Agents

Agents are specialized sub-models invoked by Claude for specific tasks. They live in `~/.claude/agents/`.

### code-reviewer

Reviews code for quality, patterns, and best practices.

**Triggers automatically** after code is written or modified in a session.

**Invoke manually:**

```
Use the code-reviewer agent to review src/lib/matching.ts.
```

**What it checks:**

- Code clarity and naming
- Function length (flags > 50 lines)
- File size (flags > 800 lines)
- Nesting depth (flags > 4 levels)
- Missing error handling
- Immutability violations

### security-reviewer

Reviews for security vulnerabilities. Flags OWASP Top 10, secret leaks, and immigration-document-specific risks.

**Triggers automatically** when touching security-sensitive files: auth, API routes, file uploads, environment config.

**Invoke manually:**

```
Use the security-reviewer agent to review src/app/api/extract/route.ts before I commit.
```

**What it checks:**

- Hardcoded secrets or credentials
- SQL injection (parameterized queries)
- XSS (sanitized HTML)
- File upload validation (MIME type, size, magic bytes)
- Server-only code leaking to the client bundle
- Document content appearing in logs

**Critical:** Fix all findings before pushing. Immigration documents are sensitive — this project has stricter requirements than a typical web app.

### typescript-reviewer

Reviews TypeScript for type safety and strict idioms.

**Triggers automatically** on `.ts` and `.tsx` edits.

**Invoke manually:**

```
Use the typescript-reviewer agent to check src/lib/types.ts.
```

**What it checks:**

- No `any` — use `unknown` + narrowing
- No unjustified non-null assertions (`!`)
- Public function signatures typed at boundaries
- Zod validation at API boundaries
- `readonly` on public data shapes

### Other agents

Additional agents may be present in `~/.claude/agents/`. List them:

```bash
ls ~/.claude/agents/
```

Common ones: `planner`, `architect`, `code-architect`, `code-explorer`, `tdd-guide`, `build-error-resolver`, `e2e-runner`, `performance-optimizer`, `a11y-architect`, `refactor-cleaner`, `doc-updater`.

Invoke any agent by name:

```
Use the tdd-guide agent to help me write tests for src/lib/matching.ts first.
```

---

## Project-scoped agents (`.claude/agents/`)

Project-scoped agents live in the repo, are checked into git, and travel with the codebase. They know this project's stack, scripts, and security model — ECC agents are generic. The two coexist: project agents typically **compose** ECC agents.

### full-stack-developer

Read-only orchestrator. Returns a routing plan that names which specialist subagents and MCP servers to invoke for a given task. Does not write code itself.

**Triggers:** manual only. Best for non-trivial features, security-sensitive changes (uploads, API routes, `src/lib/anthropic.ts`), or end-to-end workflows.

**Invoke:**

```
Use the full-stack-developer agent to plan adding a 10MB upload cap to /api/extract.
```

**What it returns:**

- **Understanding** — what it inferred about scope and rules
- **Routing plan** — numbered specialist agents / MCPs (with parallel markers)
- **Mandatory gates** — e.g. `security-reviewer` if uploads touched, `npm run check` before commit
- **Files likely affected**
- **Recommended next command** — single concrete prompt to paste back

**Composes:** `planner`, `architect`, `code-architect`, `code-explorer`, `tdd-guide`, `code-reviewer`, `typescript-reviewer`, `security-reviewer`, `e2e-runner`, `performance-optimizer`, `a11y-architect`, `build-error-resolver`, `refactor-cleaner`, `doc-updater`.

→ Agent definition: [`.claude/agents/full-stack-developer.md`](../../.claude/agents/full-stack-developer.md)

---

## Rules

Rules are Markdown files that Claude reads as standing instructions. They define conventions, checklists, and constraints for this codebase.

### Project-scoped rules (`.claude/rules/`)

These are checked into the repo and apply to everyone working on this project.

| File            | Governs                                                 |
| --------------- | ------------------------------------------------------- |
| `typescript.md` | Strict types, immutability, Zod at boundaries           |
| `nextjs.md`     | App Router, Server Components, thin routes              |
| `security.md`   | Document handling, secret management, upload validation |
| `testing.md`    | Playwright happy-path + error-path, no SDK mocks        |
| `git.md`        | Conventional commits, PR before merge                   |
| `gotchas.md`    | When and how to add new entries to `docs/gotchas.md`    |

### User-scoped rules (`~/.claude/rules/`)

Applied across all projects. May be extended per language:

- `common/` — language-agnostic: KISS, DRY, YAGNI, error handling, naming
- `web/` — frontend: CSS tokens, compositor-only animation, semantic HTML
- `typescript/` — TypeScript-specific idioms

**Priority:** project rules override user rules when they conflict.

---

## Skills

Skills are reference documents Claude can load on demand for detailed guidance.

### Project-scoped skill: shadcn

Located at `.claude/skills/shadcn/`. Contains implementation patterns for shadcn/ui components in this project's style.

Claude loads this automatically when working on UI.

### User-scoped skills (`~/.claude/skills/`)

Broader reference material. List what's installed:

```bash
ls ~/.claude/skills/
```

Common ones: `coding-standards`, `frontend-patterns`, `typescript-patterns`.

---

## Hooks

Hooks are shell scripts that run automatically at lifecycle events. They are defined in `.claude/settings.json` and live in `.claude/hooks/`.

### SessionStart — `session-start.sh`

Runs when you open a Claude Code session. Checks that `.env.local` exists and `ANTHROPIC_API_KEY` is set. Prints a warning if either is missing so you catch it before hitting a model call.

```
[warn] .env.local missing — copy .env.example and fill keys
[warn] ANTHROPIC_API_KEY not set
```

### PostToolUse (Edit | Write | MultiEdit) — `format-on-save.sh`

Runs Prettier on every file you write or edit. You never need to run `npm run format` manually during a session.

### Stop — `session-stop.sh`

Runs `npm run build` when the Claude session ends. Catches type errors and build failures before you push.

---

## Hook profiles

If hooks slow down your edit loop during fast iteration, dial them back:

```bash
# Minimal — only format-on-save, skip lint and type-check
export ECC_HOOK_PROFILE=minimal

# Disable one specific hook by name
export ECC_DISABLED_HOOKS=<hook-name>

# Restore default
unset ECC_HOOK_PROFILE
```

Set in `.env.local` to persist across sessions. Unset before final review and before pushing.

---

## Verify ECC is active

```bash
ls ~/.claude/agents/    # should list code-reviewer, security-reviewer, etc.
ls ~/.claude/rules/     # should list common/, web/, typescript/ etc.
ls ~/.claude/skills/    # should list installed skills
```

If `~/.claude/agents/` is empty, ECC is not installed. Contact the person who set up the project environment.
