# Gotchas

Non-obvious pitfalls we've hit — or are likely to hit — on this stack. Check before starting work in a touched area. Add new entries the moment you solve a tricky bug.

## Entry format

```
### [YYYY-MM-DD] Short symptom
**Area:** next.js | claude-code | vercel | shadcn | playwright | ecc | …
**Symptom:** what the user/developer sees
**Cause:** the actual underlying reason
**Fix:** the minimal change that resolves it
**Detect:** how to notice it next time (command, log, lint rule)
```

Keep entries small (≤ 8 lines). One gotcha per section. Delete entries older than 6 months that no longer apply.

---

## Seed gotchas

### [2026-04-16] Vercel function timeout at 10s on free tier

**Area:** vercel
**Symptom:** `/api/extract` returns 504 in production but works locally.
**Cause:** Vercel free tier caps serverless functions at 10s. Multi-page PDF extraction exceeds that.
**Fix:** Split extraction into per-page calls, or set `vercel.json → functions.maxDuration: 60` and upgrade to Pro.
**Detect:** Check `vercel.json`; confirm plan tier in the dashboard before relying on long timeouts.

### [2026-04-16] Playwright runs via Bash instead of MCP

**Area:** claude-code / playwright
**Symptom:** Claude launches `npx playwright` in Bash instead of driving the MCP browser.
**Cause:** Without explicit instruction, Claude defaults to the closest CLI equivalent.
**Fix:** Say "use playwright mcp to …" explicitly in the first message of a session.
**Detect:** Response mentions `Bash` tool calls for `npx playwright` instead of MCP tool calls.

### [2026-04-16] `require()` blocked by `no-require-imports` rule

**Area:** typescript / eslint
**Symptom:** `A 'require()' style import is forbidden` when conditionally loading `@anthropic-ai/bedrock-sdk`.
**Cause:** `eslint-config-next` enforces ES modules.
**Fix:** Use `await import("…")` inside an async function, or factor provider choice into a deployment-time constant.
**Detect:** `npm run lint` flags the file.

### [2026-04-16] ECC hooks slow edit-feedback loop

**Area:** ecc
**Symptom:** Every edit triggers several-second delay before Claude continues.
**Cause:** ECC hooks run multiple checks on PostToolUse.
**Fix:** `export ECC_HOOK_PROFILE=minimal`, or set `ECC_DISABLED_HOOKS=<name>` for a specific hook.
**Detect:** Inspect hook runtime in Claude session status; compare with `ECC_HOOK_PROFILE` env.

### [2026-04-16] shadcn components missing after `add`

**Area:** shadcn
**Symptom:** Import from `@/components/ui/<name>` fails after `npx shadcn@latest add <name>`.
**Cause:** `components.json` has a different alias than `tsconfig.json` paths.
**Fix:** Ensure `"aliases"."components"` in `components.json` matches a `tsconfig.json` `paths` entry.
**Detect:** Failing import + grep of both files.

### [2026-04-16] Tailwind v4 uses CSS config, not `tailwind.config.ts`

**Area:** tailwind
**Symptom:** Theme tokens in `tailwind.config.ts` have no effect.
**Cause:** Tailwind v4 reads configuration from `@theme` directives inside `src/app/globals.css`.
**Fix:** Move tokens into `globals.css` under `@theme { … }`; delete `tailwind.config.ts` if empty.
**Detect:** No `tailwind.config.ts` in repo yet shadcn still works — that's expected.

### [2026-04-16] gemini-image MCP "Failed to connect" on startup

**Area:** claude-code / mcp
**Symptom:** `claude mcp list` shows gemini-image disconnected.
**Cause:** `GEMINI_API_KEY` not exported; the MCP refuses to start.
**Fix:** `export GEMINI_API_KEY=...` in shell (or `.env.local` sourced via the chpwd hook).
**Detect:** `claude mcp list` in a fresh shell; look for a `✗` next to gemini-image.

### [2026-04-16] Next.js 16 server-only imports leaking to client

**Area:** next.js
**Symptom:** Build fails with "You're importing a component that imports `fs` …"
**Cause:** A shared utility importing `src/lib/anthropic.ts` was pulled into a client component.
**Fix:** Put `import "server-only";` at the top of any server-only module; refactor the client to call `/api/*` instead of the lib directly.
**Detect:** `grep -rn "from \"@/lib/anthropic\"" src/` in client components.

### [2026-04-25] Node 25 built-in `localStorage` shadows happy-dom in Vitest

**Area:** typescript / tooling
**Symptom:** `TypeError: window.localStorage.setItem is not a function` in Vitest tests on Node ≥ 25, even with `environment: "happy-dom"`.
**Cause:** Node 25 ships an experimental Web Storage on `globalThis.localStorage`. Without `--localstorage-file=<path>` it returns an empty Object that overrides happy-dom's Storage instance. Stderr warns `--localstorage-file was provided without a valid path`.
**Fix:** In tests that touch localStorage, install a Map-backed `Storage` stub via `Object.defineProperty(window, "localStorage", { value: stub, configurable: true })` in `beforeEach`. See `src/lib/languageDetector.test.ts` for the pattern.
**Detect:** Test fails with "is not a function" on a Storage method; node version is 22.7+.

### [2026-04-16] Husky pre-commit fails without `prepare` having run

**Area:** tooling
**Symptom:** After clone, commits don't trigger lint-staged.
**Cause:** `husky install` runs via `npm run prepare` on `npm install`; if deps skipped, hooks aren't wired.
**Fix:** `npm install` then `npm run prepare` to be safe.
**Detect:** `.git/hooks/pre-commit` missing or generic.
