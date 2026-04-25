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
- [ ] `npm run test:unit` passes
- [ ] `npm run test:integration` passes (if integration touched)
- [ ] `npm run test:e2e` passes locally OR will run on Vercel preview CI
- [ ] No `any` types, no non-null assertions without inline reason
- [ ] No hardcoded secrets, no `console.log` in committed code
- [ ] No document content logged or persisted server-side
- [ ] If touching uploads: MIME allowlist + size cap enforced
- [ ] If touching `/api/*`: zod schema validates the request body

## Security review trigger

If this PR touches any of the following, request a security-reviewer pass:

- File uploads, document parsing, EXIF handling
- Authentication, authorization, session handling
- Anthropic SDK calls, prompt construction
- Rate limiting, CSP / response headers
- Anything reading `process.env.*` on the client side

## Screenshots / preview

<!-- For UI: paste before/after screenshots. For API: paste a curl + response. -->
