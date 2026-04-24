# Clauseguard — Repository Creation Spec

**Target: repo ready by day -3, all four teammates can clone + work in parallel.**

This document is prescriptive. Every file listed here must exist in the repo before onboarding begins. Every command is copy-pastable. No decisions are left for the event.

---

## 1. Meta

| Item            | Value                                              |
| --------------- | -------------------------------------------------- |
| Repo name       | `clauseguard`                                      |
| Org / owner     | `derechei` (or team org TBD before push)           |
| Visibility      | Private until event end, public after              |
| Default branch  | `main`                                             |
| License         | MIT (add post-event when public)                   |
| Node version    | 20.x LTS                                           |
| Package manager | `npm` (not pnpm, not yarn — Vercel defaults match) |
| Runtime         | Next.js 14.2.x App Router                          |
| Language        | TypeScript strict mode                             |
| Deploy target   | Vercel                                             |

---

## 2. Prerequisites on the setup machine

```bash
node --version   # must be v20.x
npm --version    # must be >= 10
git --version    # any recent
vercel --version # npm i -g vercel
```

Install missing:

```bash
npm i -g vercel
# @marp-team/marp-cli available via npx, no global install needed
```

Claude Code must be installed with access to: shadcn/ui MCP, Playwright MCP, Solvimon MCP, Structurizr MCP, Gemini MCP.

Already available on this machine: `gh` (authenticated), `d2`.

---

## 3. Scaffold commands (exact sequence)

```bash
# 1. Create Next.js app
npx create-next-app@14 clauseguard \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir=false \
  --import-alias="@/*" \
  --no-turbo

cd clauseguard

# 2. Init git + remote
git init
gh repo create clauseguard --private --source=. --remote=origin
git branch -M main

# 3. Install runtime deps
npm i @anthropic-ai/sdk zod

# 4. Install dev deps
npm i -D \
  vitest @vitest/ui \
  @testing-library/react @testing-library/jest-dom @testing-library/user-event \
  jsdom \
  msw \
  @playwright/test \
  tsx

# 5. Install Playwright browsers
npx playwright install --with-deps chromium

# 6. Scaffold directories (from repo root)
mkdir -p \
  app/api/analyze app/api/transcribe app/api/voice-command \
  app/analyzing app/results \
  components/atoms components/molecules components/organisms \
  context lib \
  data/fixtures \
  styles \
  public/icons \
  test e2e/fixtures \
  .github/workflows

# 7. Link Vercel project
vercel link --yes
vercel env pull .env.local
```

---

## 4. `package.json` — final shape

```json
{
  "name": "clauseguard",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:unit": "vitest run --project unit",
    "test:integration": "vitest run --project integration",
    "test:e2e": "playwright test",
    "test:all": "npm run type-check && npm run test && npm run test:e2e",
    "generate-mock-stream": "tsx test/generate-mock-stream.ts"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.30.0",
    "next": "14.2.x",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.47.0",
    "@testing-library/jest-dom": "^6.5.0",
    "@testing-library/react": "^16.0.0",
    "@testing-library/user-event": "^14.5.0",
    "@types/node": "^20.14.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitest/ui": "^2.1.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.57.0",
    "eslint-config-next": "14.2.x",
    "jsdom": "^25.0.0",
    "msw": "^2.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0",
    "vitest": "^2.1.0"
  }
}
```

---

## 5. Configuration files

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noImplicitAny": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules", "e2e", "test/e2e.setup.ts"]
}
```

### `next.config.mjs`

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};
export default nextConfig;
```

### `tailwind.config.ts`

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  darkMode: ["class", '[data-theme="dark"]'],
  theme: { extend: {} },
  plugins: [],
};
export default config;
```

### `vitest.config.ts`

```ts
import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(__dirname, ".") } },
  test: {
    projects: [
      {
        name: "unit",
        include: ["lib/**/*.test.ts", "context/**/*.test.ts"],
        environment: "jsdom",
        setupFiles: ["./test/unit.setup.ts"],
      },
      {
        name: "integration",
        include: ["components/**/*.test.tsx", "app/api/**/*.test.ts"],
        environment: "jsdom",
        setupFiles: ["./test/integration.setup.ts"],
      },
    ],
  },
});
```

### `playwright.config.ts`

```ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 120_000,
  retries: 1,
  use: {
    baseURL: process.env.BASE_URL ?? "http://localhost:3000",
    locale: "uk-UA",
    video: "on-first-retry",
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },
  webServer: process.env.BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:3000",
        timeout: 120_000,
      },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
});
```

### `.eslintrc.json`

```json
{
  "extends": ["next/core-web-vitals", "next/typescript"],
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-unused-vars": "error",
    "no-console": ["warn", { "allow": ["error", "warn"] }]
  }
}
```

### `.env.example`

```
# Required
ANTHROPIC_API_KEY=

# Solvimon — billing (Thiago configures sandbox)
SOLVIMON_API_KEY=
SOLVIMON_TEST_CUSTOMER_ID=
SOLVIMON_CHECKOUT_URL_INDIVIDUAL=

# Reson8 — voice (conditional on hour 16 gate)
RESON8_API_KEY=
RESON8_MODEL_ID=

# Build flags
NEXT_PUBLIC_VOICE_ENABLED=false
DEMO_FORCE_402=false

# Test-only (do not use in production)
ANTHROPIC_API_KEY_TEST=
```

### `.gitignore` — extend Next.js defaults with:

```
# env
.env*.local
.env

# vercel
.vercel

# playwright
/test-results/
/playwright-report/
/playwright/.cache/

# os
.DS_Store
```

---

## 6. `CLAUDE.md` — root file (exact contents)

Place at repo root. This is what every teammate's Claude Code session reads first.

```markdown
# Project: Clauseguard — Immigrant Contract Analyzer

## Stack

- Next.js 14 App Router, TypeScript strict mode, Tailwind, shadcn/ui
- Anthropic SDK for Claude Sonnet 4.6 streaming
- Deployed on Vercel

## Ownership map

- Backend routes + `lib/claude.ts` + `lib/solvimon.ts` + rulesets → Alex
- Domain data (`data/*.json`, fixtures) → Timo
- UI components + design tokens → shared via shadcn/ui MCP, Alex coordinates
- Copy + pitch narrative + demo video → Kiki
- Solvimon sandbox + pricing config → Thiago

## MCP servers (call before using)

- shadcn/ui — UI component installation and docs
- Structurizr — C4 architecture diagrams (Q&A only, NOT pitch deck)
- Playwright — browser testing and self-QA (not bash)
- Solvimon — checkout link and pricing setup
- Gemini — pitch image generation

## CLI tools

- D2 — sequence and flow diagrams (never Mermaid)
- gh — GitHub operations
- vercel — deployment

## File conventions

- POST /api/analyze — contract text + permit type → streamed SSE compliance report
- POST /api/transcribe — audio blob → transcript via Reson8 (if voice shipped)
- POST /api/voice-command — transcript + report context → intent JSON (if voice shipped)
- lib/solvimon.ts — checkEntitlement() before analysis, reportUsage() after success
- lib/claude.ts — Anthropic SDK wrapper, prompt builder
- lib/citationValidator.ts — presence AND authenticity checks against loaded ruleset
- lib/languageDetector.ts — detection cascade (localStorage → browser → voice)
- Rulesets loaded via dynamic import() at request time (jurisdiction-aware at runtime)
- No persistent server-side storage — process in memory, discard after response
- localStorage persists SUMMARY ONLY (no full clause text, no contract text)
- TypeScript strict mode, no `any`

## Domain knowledge (authoritative — do not invent)

- /data/nl-labor-law.json — Dutch labor law rules; every citation article must match an entry here
- /data/se-labor-law.json — Swedish labor law (LAS); same rule
- /data/nl-permit-categories.json — IND permit types; do not invent restrictions
- /data/se-permit-categories.json — Migrationsverket permit types; do not invent restrictions
- /data/fixtures/ — test contracts; fixture 1 has 2 illegal + 2 compliant + 2 unchecked

## Groundedness rules (NON-NEGOTIABLE)

- Flagged clauses MUST have a citation matching a rule in the loaded ruleset
- Citations not present in the ruleset are hallucinations — validator MUST catch them
- Clauses with no matching rule are marked UNCHECKED, never silently dropped
- `citation.source` MUST be exactly "{jurisdiction}-labor-law.json"

## Security rules

- Never log contract content
- Never store document data server-side between requests
- Validate all file uploads (PDF/image only, 10MB max)
- Soft-fail on Solvimon outages — do not block user for billing failures

## Reuse rules

- No color values in component files — only `var(--color-*)` references
- No font-family or font-size in component files — only `var(--font-*)` / `var(--text-*)`
- CitationBlock required inside every ClauseCard where status != 'unchecked' (CI enforced)
- VoiceController renders once per page, gated by `NEXT_PUBLIC_VOICE_ENABLED`
- Atoms have no internal state — purely controlled

## Test expectations

- `npm run test:unit` passes — languageDetector, reducer, clauseOrdering, citationValidator (presence + authenticity)
- `npm run test:integration` passes — UploadZone, session persistence, /api/analyze, /api/voice-command (if voice)
- `npm run test:e2e` passes against preview URL — happy path, pricing gate, jurisdiction swap
```

---

## 7. File manifest — every file to create at scaffold time

Legend: **[S]** = stub (empty scaffold Alex commits day -7), **[P]** = populated by the owner later, **[X]** = fully implemented at scaffold.

### Root

| Path                   | State | Owner | Notes                    |
| ---------------------- | ----- | ----- | ------------------------ |
| `package.json`         | [X]   | Alex  | exact contents above     |
| `tsconfig.json`        | [X]   | Alex  | exact contents above     |
| `next.config.mjs`      | [X]   | Alex  | exact contents above     |
| `tailwind.config.ts`   | [X]   | Alex  | exact contents above     |
| `postcss.config.js`    | [X]   | Alex  | Next.js default          |
| `vitest.config.ts`     | [X]   | Alex  | exact contents above     |
| `playwright.config.ts` | [X]   | Alex  | exact contents above     |
| `.eslintrc.json`       | [X]   | Alex  | exact contents above     |
| `.env.example`         | [X]   | Alex  | exact contents above     |
| `.gitignore`           | [X]   | Alex  | extended Next.js default |
| `CLAUDE.md`            | [X]   | Alex  | exact contents above     |
| `README.md`            | [X]   | Alex  | see §9                   |
| `vercel.json`          | [X]   | Alex  | see below                |

**`vercel.json`:**

```json
{
  "buildCommand": "npm run build",
  "installCommand": "npm ci",
  "framework": "nextjs",
  "github": { "enabled": true, "silent": false },
  "functions": {
    "app/api/analyze/route.ts": { "maxDuration": 120 },
    "app/api/transcribe/route.ts": { "maxDuration": 30 },
    "app/api/voice-command/route.ts": { "maxDuration": 30 }
  }
}
```

### `app/`

| Path                             | State | Owner | Notes                                                                             |
| -------------------------------- | ----- | ----- | --------------------------------------------------------------------------------- |
| `app/layout.tsx`                 | [X]   | Alex  | wraps `<ReportProvider>`, imports `tokens.css`, sets `lang` from LanguageDetector |
| `app/page.tsx`                   | [S]   | Alex  | `UploadPage` — renders UploadZone + VoiceController(conditional)                  |
| `app/analyzing/page.tsx`         | [S]   | Alex  | `AnalysisPage`                                                                    |
| `app/results/page.tsx`           | [S]   | Alex  | `ResultsPage`                                                                     |
| `app/globals.css`                | [X]   | Alex  | imports `tokens.css`, Tailwind directives                                         |
| `app/api/analyze/route.ts`       | [P]   | Alex  | full spec in hackathon-env-setup.md §API route pattern                            |
| `app/api/transcribe/route.ts`    | [S]   | Alex  | conditional on voice                                                              |
| `app/api/voice-command/route.ts` | [S]   | Alex  | conditional on voice                                                              |
| `app/favicon.ico`                | [P]   | Kiki  | generated from shield.svg                                                         |

### `components/atoms/`

All atom files are scaffolded with TypeScript prop interfaces + minimal JSX + `data-testid`. Every file must compile from day -7.

| Path                               | State | Owner                                   | Reference                       |
| ---------------------------------- | ----- | --------------------------------------- | ------------------------------- |
| `components/atoms/Badge.tsx`       | [P]   | Alex scaffolds, shadcn/ui MCP generates | frontend-architecture.md §Badge |
| `components/atoms/Button.tsx`      | [P]   | same                                    | §Button                         |
| `components/atoms/IconButton.tsx`  | [P]   | same                                    | §IconButton                     |
| `components/atoms/ProgressBar.tsx` | [P]   | same                                    | §ProgressBar                    |
| `components/atoms/Skeleton.tsx`    | [P]   | same                                    | §Skeleton                       |
| `components/atoms/Divider.tsx`     | [P]   | same                                    | —                               |
| `components/atoms/Toast.tsx`       | [P]   | same                                    | §Toast                          |
| `components/atoms/Logo.tsx`        | [P]   | same                                    | §Logo                           |

**Scaffold template for each atom** (example: `Badge.tsx`):

```tsx
// components/atoms/Badge.tsx
import { type FC } from "react";

export type BadgeStatus = "illegal" | "exploitative" | "compliant" | "permit" | "unchecked";

export interface BadgeProps {
  status: BadgeStatus;
  label?: string;
}

const DEFAULT_LABELS: Record<BadgeStatus, string> = {
  illegal: "ILLEGAL",
  exploitative: "EXPLOITATIVE",
  compliant: "COMPLIANT",
  permit: "PERMIT CONFLICT",
  unchecked: "UNCHECKED",
};

export const Badge: FC<BadgeProps> = ({ status, label }) => (
  <span
    data-testid="clause-badge"
    data-status={status}
    className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium bg-[var(--color-status-${status}-bg)] text-[var(--color-status-${status})]`}
  >
    {label ?? DEFAULT_LABELS[status]}
  </span>
);
```

Every atom commits with: prop interface exported, `data-testid` attribute, token-based styling, no hardcoded values, default export or named export (consistent — named throughout).

### `components/molecules/`

| Path                                              | State | Owner          | Reference               |
| ------------------------------------------------- | ----- | -------------- | ----------------------- |
| `components/molecules/CitationBlock.tsx`          | [P]   | Alex scaffolds | §CitationBlock          |
| `components/molecules/ClauseText.tsx`             | [P]   | same           | §ClauseText             |
| `components/molecules/StatusCard.tsx`             | [P]   | same           | §StatusCard             |
| `components/molecules/JurisdictionToggle.tsx`     | [P]   | same           | §JurisdictionToggle     |
| `components/molecules/PermitSelector.tsx`         | [P]   | same           | §PermitSelector         |
| `components/molecules/UploadTab.tsx`              | [P]   | same           | §UploadTab              |
| `components/molecules/VoiceTranscriptPreview.tsx` | [P]   | same           | §VoiceTranscriptPreview |
| `components/molecules/ExpanderSection.tsx`        | [P]   | same           | §ExpanderSection        |

### `components/organisms/`

| Path                                            | State | Owner | Reference                      |
| ----------------------------------------------- | ----- | ----- | ------------------------------ |
| `components/organisms/AppHeader.tsx`            | [P]   | Alex  | §AppHeader                     |
| `components/organisms/UploadZone.tsx`           | [P]   | Alex  | §UploadZone                    |
| `components/organisms/AnalysisProgress.tsx`     | [P]   | Alex  | §AnalysisProgress              |
| `components/organisms/SummaryBanner.tsx`        | [P]   | Alex  | §SummaryBanner                 |
| `components/organisms/ClauseCard.tsx`           | [P]   | Alex  | §ClauseCard                    |
| `components/organisms/ClauseList.tsx`           | [P]   | Alex  | §ClauseList                    |
| `components/organisms/RightsSummary.tsx`        | [P]   | Alex  | §RightsSummary                 |
| `components/organisms/VoiceController.tsx`      | [P]   | Alex  | §VoiceController (conditional) |
| `components/organisms/NavigationHighlight.tsx`  | [P]   | Alex  | §NavigationHighlight           |
| `components/organisms/PricingGate.tsx`          | [P]   | Alex  | §PricingGate                   |
| `components/organisms/SessionRestoreBanner.tsx` | [P]   | Alex  | §SessionRestoreBanner          |

### `context/`

| Path                            | State | Owner | Notes                                                                                |
| ------------------------------- | ----- | ----- | ------------------------------------------------------------------------------------ |
| `context/ReportContext.tsx`     | [X]   | Alex  | full reducer with all 11 actions; spec in frontend-architecture.md §State management |
| `context/ReportContext.test.ts` | [X]   | Alex  | reducer tests for every action                                                       |

### `lib/`

| Path                       | State | Owner | Notes                                                                    |
| -------------------------- | ----- | ----- | ------------------------------------------------------------------------ |
| `lib/claude.ts`            | [X]   | Alex  | Anthropic SDK wrapper + `buildAnalysisPrompt` + `buildVoiceIntentPrompt` |
| `lib/solvimon.ts`          | [X]   | Alex  | `checkEntitlement`, `reportUsage`; full impl in env-setup.md             |
| `lib/voiceState.ts`        | [S]   | Alex  | conditional; state machine reducer                                       |
| `lib/languageDetector.ts`  | [X]   | Alex  | detection cascade; full impl in missing-items.md §7                      |
| `lib/citationValidator.ts` | [X]   | Alex  | `validateClause(clause, ruleset)` — presence + authenticity              |
| `lib/clauseOrdering.ts`    | [X]   | Alex  | sort order: illegal → permit → exploitative → unchecked → compliant      |
| `lib/types.ts`             | [X]   | Alex  | every interface from missing-items.md §1 JSON schema                     |
| `lib/*.test.ts`            | [X]   | Alex  | one test file per module                                                 |

### `data/`

| Path                                 | State | Owner | Notes                                         |
| ------------------------------------ | ----- | ----- | --------------------------------------------- |
| `data/nl-labor-law.json`             | [P]   | Timo  | 6 rules minimum per missing-items.md §4       |
| `data/nl-permit-categories.json`     | [P]   | Timo  | GVVA + Kennismigrant per §5                   |
| `data/se-labor-law.json`             | [P]   | Timo  | 4 rules; deliverable by day -2 or cut         |
| `data/se-permit-categories.json`     | [P]   | Timo  | Arbetstillstånd; same gate                    |
| `data/rights-summary-nl.json`        | [P]   | Timo  | FNV contact + rights list                     |
| `data/rights-summary-se.json`        | [P]   | Timo  | Unionen/LO; same gate                         |
| `data/fixtures/fixture-nl-real.pdf`  | [P]   | Timo  | 2 illegal + 2 compliant + 2 unchecked         |
| `data/fixtures/fixture-nl-real.txt`  | [P]   | Timo  | plain text copy for unit tests                |
| `data/fixtures/fixture-nl-clean.pdf` | [P]   | Timo  | all compliant                                 |
| `data/fixtures/fixture-nl-clean.txt` | [P]   | Timo  | same                                          |
| `data/fixtures/fixture-se-real.pdf`  | [P]   | Timo  | 1 illegal + 2 compliant + 1 unchecked (if SE) |
| `data/fixtures/fixture-se-real.txt`  | [P]   | Timo  | same                                          |

### `styles/`

| Path                | State | Owner | Notes                                                                                       |
| ------------------- | ----- | ----- | ------------------------------------------------------------------------------------------- |
| `styles/tokens.css` | [X]   | Alex  | full token set from frontend-architecture.md §Design tokens — imported in `app/globals.css` |

### `public/icons/`

| Path                       | State | Owner                           | Notes      |
| -------------------------- | ----- | ------------------------------- | ---------- |
| `public/icons/shield.svg`  | [P]   | Alex (generate with Gemini MCP) | brand mark |
| `public/icons/mic.svg`     | [P]   | same                            |            |
| `public/icons/wave.svg`    | [P]   | same                            |            |
| `public/icons/flag-nl.svg` | [P]   | same                            |            |
| `public/icons/flag-se.svg` | [P]   | same                            |            |

### `test/`

| Path                           | State | Owner | Notes                                                    |
| ------------------------------ | ----- | ----- | -------------------------------------------------------- |
| `test/unit.setup.ts`           | [X]   | Alex  | `import '@testing-library/jest-dom/vitest'`              |
| `test/integration.setup.ts`    | [X]   | Alex  | MSW server setup                                         |
| `test/mocks/handlers.ts`       | [X]   | Alex  | MSW request handlers                                     |
| `test/mocks/server.ts`         | [X]   | Alex  | MSW Node server instance                                 |
| `test/mock-stream.ts`          | [P]   | Alex  | generated from real `/api/analyze` run against fixture 1 |
| `test/generate-mock-stream.ts` | [X]   | Alex  | script that produces mock-stream.ts                      |
| `test/fixtures/mockClauses.ts` | [X]   | Alex  | TypeScript mock clause objects for integration tests     |

### `e2e/`

| Path                                | State | Owner | Notes                           |
| ----------------------------------- | ----- | ----- | ------------------------------- |
| `e2e/happy-path.spec.ts`            | [P]   | Alex  | full test from test-strategy.md |
| `e2e/pricing-gate.spec.ts`          | [P]   | Alex  | demo step 11                    |
| `e2e/jurisdiction-swap.spec.ts`     | [P]   | Alex  | slide 4                         |
| `e2e/error-states.spec.ts`          | [P]   | Alex  | failure modes                   |
| `e2e/voice-navigation.spec.ts`      | [P]   | Alex  | conditional on voice            |
| `e2e/fixtures/fixture-nl-real.pdf`  | [P]   | Timo  | copy from data/fixtures         |
| `e2e/fixtures/fixture-nl-clean.pdf` | [P]   | Timo  | same                            |

### `.github/workflows/`

| Path                                | State | Owner | Notes                                                      |
| ----------------------------------- | ----- | ----- | ---------------------------------------------------------- |
| `.github/workflows/ci.yml`          | [X]   | Alex  | exact contents in test-strategy.md §CI/CD                  |
| `.github/workflows/preview-e2e.yml` | [X]   | Alex  | runs E2E against Vercel preview URL                        |
| `.github/pull_request_template.md`  | [X]   | Alex  | checklist: tests pass, type-check clean, touched one layer |

### `.vscode/` (optional but recommended)

| Path                      | State | Owner | Notes                                                |
| ------------------------- | ----- | ----- | ---------------------------------------------------- |
| `.vscode/settings.json`   | [X]   | Alex  | `editor.formatOnSave: true`, ESLint on save          |
| `.vscode/extensions.json` | [X]   | Alex  | recommends ESLint, Tailwind IntelliSense, Playwright |

---

## 8. Day -7 commit sequence

Alex runs these in order. Each commit is atomic and labeled.

```bash
# Commit 1: skeleton
git add package.json tsconfig.json next.config.mjs tailwind.config.ts postcss.config.js .eslintrc.json .env.example .gitignore vercel.json
git commit -m "chore: scaffold Next.js 14 + TypeScript + Tailwind"

# Commit 2: configs for tests
git add vitest.config.ts playwright.config.ts test/
git commit -m "chore: configure vitest + playwright + MSW"

# Commit 3: directory skeleton
git add app/ components/ context/ lib/ styles/ public/ data/ e2e/
git commit -m "chore: directory scaffold with placeholder files"

# Commit 4: CLAUDE.md and README
git add CLAUDE.md README.md
git commit -m "docs: CLAUDE.md and onboarding README"

# Commit 5: design tokens
git add styles/tokens.css app/globals.css app/layout.tsx
git commit -m "feat(design): full CSS custom property token system"

# Commit 6: core lib modules
git add lib/types.ts lib/claude.ts lib/solvimon.ts lib/languageDetector.ts lib/citationValidator.ts lib/clauseOrdering.ts lib/*.test.ts
git commit -m "feat(lib): core modules with tests"

# Commit 7: ReportContext
git add context/
git commit -m "feat(state): ReportContext with full reducer + tests"

# Commit 8: atom scaffolds
git add components/atoms/
git commit -m "feat(ui): atom component scaffolds with prop interfaces + data-testid"

# Commit 9: CI
git add .github/
git commit -m "ci: GitHub Actions pipeline + PR template"

# Commit 10: push + tag
git push -u origin main
git tag v0.1.0-scaffold
git push --tags
```

After commit 10, Vercel auto-deploys. The preview URL is the single source of truth from this point.

---

## 9. `README.md` — onboarding contents

````markdown
# Clauseguard

Immigrant employment contract analyzer — upload a contract, get a compliance report with legal citations in your language.

## Quick start

```bash
git clone https://github.com/<org>/clauseguard
cd clauseguard
cp .env.example .env.local
# fill in ANTHROPIC_API_KEY + others
npm install
npm run dev
```
````

Open http://localhost:3000

## Commands

| Command                        | What it does                                        |
| ------------------------------ | --------------------------------------------------- |
| `npm run dev`                  | Start Next.js dev server                            |
| `npm run build`                | Production build                                    |
| `npm run type-check`           | TypeScript strict check                             |
| `npm run test`                 | All vitest projects                                 |
| `npm run test:unit`            | Unit tests only                                     |
| `npm run test:integration`     | Integration tests only                              |
| `npm run test:e2e`             | Playwright E2E (requires preview URL)               |
| `npm run test:all`             | Type-check + unit + integration + E2E               |
| `npm run generate-mock-stream` | Regenerate test/mock-stream.ts from a live API call |

## Ownership

| Area                                     | Owner            |
| ---------------------------------------- | ---------------- |
| Backend routes, prompts, deploy          | Alex             |
| Rulesets, fixtures, domain data          | Timo             |
| Solvimon billing                         | Thiago           |
| Copy, pitch narrative, demo video        | Kiki             |
| UI components (shared via shadcn/ui MCP) | Alex coordinates |

## Docs

- `CLAUDE.md` — what every Claude Code session must know
- `docs/hackathon-brief.md` — event plan
- `docs/frontend-architecture.md` — components, tokens, state
- `docs/test-strategy.md` — test matrix
- `docs/missing-items.md` — JSON schemas, prompts, fixture specs
- `docs/repo-spec.md` — this file

## Rules

1. No hardcoded colors or fonts in components — only `var(--token)`.
2. No `any`. TypeScript strict mode.
3. Every PR must pass CI before merge.
4. Contract text never hits localStorage. Summary only.
5. Every flagged clause must have a citation validated against the loaded ruleset.

````

---

## 10. CI/CD pipeline — exact contents

### `.github/workflows/ci.yml`

```yaml
name: CI

on:
  push:
    branches: ['**']
  pull_request:
    branches: [main]

jobs:
  type-check:
    name: TypeScript
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm' }
      - run: npm ci
      - run: npm run type-check

  lint:
    name: ESLint
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm' }
      - run: npm ci
      - run: npm run lint

  unit-and-integration:
    name: Vitest
    runs-on: ubuntu-latest
    needs: [type-check, lint]
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm' }
      - run: npm ci
      - run: npm run test:unit
      - run: npm run test:integration
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY_TEST }}
````

### `.github/workflows/preview-e2e.yml`

```yaml
name: Preview E2E

on:
  deployment_status:

jobs:
  e2e:
    name: Playwright on Vercel Preview
    if: github.event.deployment_status.state == 'success'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: "npm" }
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run test:e2e
        env:
          BASE_URL: ${{ github.event.deployment_status.target_url }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY_TEST }}
          RESON8_API_KEY: ${{ secrets.RESON8_API_KEY_TEST }}
          SOLVIMON_API_KEY: ${{ secrets.SOLVIMON_API_KEY_TEST }}
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 7
```

### `.github/pull_request_template.md`

```markdown
## What changed

<!-- one sentence -->

## Layer touched (pick one)

- [ ] Backend (api/, lib/claude.ts, lib/solvimon.ts)
- [ ] State (context/)
- [ ] UI (components/)
- [ ] Data (data/)
- [ ] Tests only
- [ ] Docs only

## Checklist

- [ ] `npm run type-check` clean
- [ ] `npm run test:unit` passes
- [ ] `npm run test:integration` passes (if integration touched)
- [ ] No hardcoded colors/fonts
- [ ] No `any` types
- [ ] No contract text persisted to localStorage
- [ ] If flagged clauses touched: citationValidator still passes
```

---

## 11. GitHub repo configuration (post-creation)

Run these after first push:

```bash
# Protect main
gh api repos/:owner/clauseguard/branches/main/protection \
  --method PUT \
  -f required_status_checks[strict]=true \
  -f required_status_checks[contexts][]=TypeScript \
  -f required_status_checks[contexts][]=ESLint \
  -f required_status_checks[contexts][]=Vitest \
  -f enforce_admins=false \
  -f required_pull_request_reviews[required_approving_review_count]=0 \
  -f restrictions=

# Secrets (repeat for each)
gh secret set ANTHROPIC_API_KEY_TEST --body "<key>"
gh secret set SOLVIMON_API_KEY_TEST --body "<key>"
gh secret set RESON8_API_KEY_TEST --body "<key>"

# Add collaborators (read+write)
gh api repos/:owner/clauseguard/collaborators/<thiago-gh> --method PUT -f permission=push
gh api repos/:owner/clauseguard/collaborators/<timo-gh> --method PUT -f permission=push
gh api repos/:owner/clauseguard/collaborators/<kiki-gh> --method PUT -f permission=push
```

---

## 12. Vercel configuration

```bash
# Link after first push
vercel link --yes

# Add env vars to Preview + Production
vercel env add ANTHROPIC_API_KEY production preview
vercel env add SOLVIMON_API_KEY production preview
vercel env add SOLVIMON_TEST_CUSTOMER_ID production preview
vercel env add SOLVIMON_CHECKOUT_URL_INDIVIDUAL production preview
vercel env add RESON8_API_KEY production preview
vercel env add RESON8_MODEL_ID production preview
vercel env add NEXT_PUBLIC_VOICE_ENABLED production preview

# Trigger first deploy
vercel --prod
```

Vercel automatically creates a preview URL per PR — that URL is what Playwright hits in CI.

---

## 13. Validation checklist — run before onboarding

Alex runs all of these on a fresh clone. Every one must pass.

```bash
# 1. Clone and install
git clone https://github.com/<org>/clauseguard /tmp/clauseguard-verify
cd /tmp/clauseguard-verify
cp .env.example .env.local
# fill in ANTHROPIC_API_KEY + SOLVIMON_API_KEY
npm install

# 2. Type-check
npm run type-check          # exit 0

# 3. Lint
npm run lint                # exit 0

# 4. Unit + integration tests
npm run test                # exit 0

# 5. Dev server starts
npm run dev &
sleep 5
curl http://localhost:3000  # returns 200
kill %1

# 6. Build passes
npm run build               # exit 0

# 7. API route responds
npm run dev &
sleep 5
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"contractText":"Test clause.","permitType":"gvva","jurisdiction":"nl","detectedLanguage":"en"}'
# returns streamed SSE response
kill %1

# 8. Force-402 works
curl -X POST "http://localhost:3000/api/analyze?force_402=true" \
  -H "Content-Type: application/json" \
  -d '{"contractText":"Test","permitType":"gvva","jurisdiction":"nl"}'
# returns 402

# 9. Playwright smoke
npm run test:e2e -- --grep "headline renders"

# 10. Vercel preview
vercel --yes                 # deploys, returns preview URL
curl <preview-url>           # returns 200
```

If all 10 pass → repo is ready. Tag `v0.2.0-onboarding-ready`, invite the team.

---

## 14. Onboarding sequence for each teammate

After Alex validates, each teammate gets:

1. **GitHub repo invite** — push access to `main` via PR
2. **Vercel team invite** — can see preview deploys
3. **Claude Code setup doc** (separate — see §15)
4. **1:1 walkthrough** (15 min) — where their files live, which docs they own, how to push a PR

---

## 15. Claude Code onboarding for teammates

A separate 1-page doc gets shared with each teammate. Template:

```markdown
# Claude Code setup — Clauseguard

## Prerequisites

- Node 20+
- Claude Code CLI installed and authenticated

## One-time setup

1. Clone the repo:
```

git clone https://github.com/<org>/clauseguard
cd clauseguard
cp .env.example .env.local

```
Get the env values from Alex (shared 1Password vault).

2. Install:
```

npm install
npx playwright install --with-deps chromium

```

3. Register MCP servers:
```

claude mcp add shadcn https://mcp.shadcn.com
claude mcp add playwright http://localhost:9323
claude mcp add solvimon https://test.mcp.solvimon.com --header "X-API-KEY:<key>"

```

4. Verify:
```

npm run dev # serves at localhost:3000
npm run test:unit # passes

```

5. Start Claude Code in the repo root:
```

cd clauseguard
claude

```
It reads `CLAUDE.md` automatically. Ask: "what's my role here" — it will tell you based on the ownership map.

## Your first PR

Pick a small task from your owned area. Make a branch:
```

git checkout -b <your-name>/first-change

# make changes

git commit -am "your change"
git push -u origin <your-name>/first-change
gh pr create --fill

```

CI runs automatically. Vercel deploys a preview URL. Request review, merge when green.
```

---

## 16. Stretch: pre-commit hooks (optional)

Day -5 if time permits. Lower priority than getting the repo working.

```bash
npm i -D husky lint-staged
npx husky init
echo "npx lint-staged" > .husky/pre-commit
```

`package.json`:

```json
"lint-staged": {
  "*.{ts,tsx}": ["eslint --fix", "tsc --noEmit"],
  "*.{json,md,css}": []
}
```

---

## 17. What this document does NOT cover

- **Claude system prompts** (`lib/claude.ts` prompt text) — see `missing-items.md` §2 and §3
- **Ruleset JSON schemas** — see `missing-items.md` §4 and §5
- **Fixture composition** — see `missing-items.md` §6
- **Test cases themselves** — see `test-strategy.md`
- **Pitch deck** — separate artifact, Kiki + Alex own
- **Solvimon MCP configuration** (meter + plans + checkout) — Thiago owns via MCP, not via repo code

---

## 18. Summary

**Outcome:** by end of day -7, the repo is cloneable, builds clean, deploys to Vercel, and has every scaffold file every teammate will need. Day -6 to day -1 is population of scaffolds with real content by each owner, in parallel, with no blockers.

**One command test:** a fresh teammate runs `git clone … && cp .env.example .env.local && npm install && npm run dev` and sees localhost:3000 render a skeleton. That's the success criterion for this spec.
