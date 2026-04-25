## What changed

<!-- One sentence. The diff shows the *what*; here say *why*. -->

## Layer touched (pick one)

- [ ] Backend (`src/app/api/`, `src/lib/anthropic.ts`)
- [ ] State / hooks (`src/hooks/`, context providers)
- [ ] UI (`src/components/`, `src/app/*/page.tsx`)
- [ ] Domain data (`data/`)
- [ ] Tests only (`tests/`)
- [ ] Tooling / config (`*.config.*`, `.github/`, `package.json`)
- [ ] Docs only (`docs/`, `*.md`)

## Checklist

- [ ] `npm run check` clean (typecheck + lint + format)
- [ ] `npm run build` passes locally
- [ ] `npm run test:e2e` passes locally OR will run on Vercel preview CI
- [ ] No `any` types, no non-null assertions without inline reason
- [ ] No hardcoded colors / fonts in `src/components/**` (use tokens — see `.claude/rules/no-hardcoded-tokens.md`)
- [ ] No hardcoded secrets, no `console.log` in committed code
- [ ] No document content / PII logged or persisted server-side
- [ ] If touching uploads: MIME allowlist + size cap enforced
- [ ] If touching `/api/*`: input validated, errors don't echo input back
- [ ] If UI touched: `data-testid` attributes on new interactive elements
- [ ] If non-obvious bug fixed: entry added to `docs/gotchas.md` (see `.claude/rules/gotchas.md`)
- [ ] Conventional commit subject (`feat:` / `fix:` / `refactor:` / `docs:` / `test:` / `chore:`)

## Security review trigger

If this PR touches any of the following, request a security-reviewer pass:

- File uploads, document parsing, EXIF handling
- Authentication, authorization, session handling
- Anthropic SDK calls, prompt construction
- Rate limiting, CSP / response headers
- Anything reading `process.env.*` on the client side

## Screenshots / preview

<!-- For UI: paste before/after screenshots. For API: paste a curl + response. -->
