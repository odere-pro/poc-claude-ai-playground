# Claude Code hackathon environment

**Everything pre-configured in one repository.** Clone, set your API keys, and you have: production-grade UI components, image generation, presentations, architecture diagrams, deployment, AWS extensions, debugging, and code quality gates. This guide documents what's in the repo and how to use each tool during the hackathon.

---

## How the toolchain is organized

Claude Code handles most tools natively. Only add an MCP server when it provides data or API access that Claude Code can't get from the CLI.

| Layer                | What it means                                                        | Tools in this layer                                                |
| -------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Built-in**         | Claude Code does this natively. No setup.                            | Git, `gh` CLI (GitHub), autoVerify, bash/terminal                  |
| **CLI tools**        | Installed binaries that Claude Code drives directly.                 | D2, Marp, ngrok, AWS CLI, Vercel CLI                               |
| **Plugins**          | Claude Code plugins with richer integration than raw CLI.            | Vercel plugin, ECC                                                 |
| **MCP servers**      | Structured data or API access CLI can't provide. Only 5 needed.      | shadcn/ui, Next.js DevTools, Playwright, Structurizr, Gemini image |
| **npm dependencies** | Project dependencies Claude Code installs and uses in your app code. | Anthropic SDK, Sentry, Playwright test, AWS SDK                    |

**The principle:** if Claude Code can run a CLI command to achieve the same result, skip the MCP. MCP servers are for structured data feeds (component docs, library APIs, browser DevTools protocol) and hosted services (Structurizr, Gemini) where no CLI exists.

---

## 1. Vibe-code design: shadcn/ui MCP + autoVerify

The fastest path from idea to polished interface. No design tool, no mockups — describe what you want and Claude Code builds it with production-grade components.

### Default setup

**MCP server + skill (required):**

```bash
claude mcp add shadcn -- npx shadcn@latest mcp
npx skills add shadcn/ui
```

**What you get:** shadcn/ui components + 2,500 pre-built blocks (hero sections, dashboards, pricing pages, data tables) + Claude Code's built-in screenshot loop (autoVerify). Consistent spacing, dark mode, accessibility, and responsive layouts — all out of the box.

**Workflow:**

1. **Describe what you want in plain language.** "Build a dashboard with a sidebar nav, a metrics row at the top, and a data table below." Claude Code generates it using real shadcn/ui components — not generic divs.
2. **autoVerify handles visual QA.** Claude Code starts your dev server, screenshots the result, inspects for visual issues, fixes them, and screenshots again. No configuration needed. Built-in.
3. **Iterate by talking.** "Make the sidebar collapsible." "Add a dark mode toggle." "The table needs sortable columns." Each prompt refines the existing code.
4. **Prototype in Claude.ai first.** When exploring a layout idea, build it as an artifact in Claude.ai. Once you like the direction, tell Claude Code to build it properly with shadcn/ui.

**Tips for competition-quality output:**

- Be specific about visual hierarchy: "The primary metric should be 3x larger than the secondary ones" beats "make it look good."
- Name the vibe: "Minimal and editorial" or "dense and data-heavy" gives Claude Code a design direction.
- Reference real products: "Layout like Linear's issue tracker" or "card style like Vercel's dashboard."
- Ask for polish passes after layout works: "Add subtle hover transitions and refine the spacing." Judges notice micro-interactions.

### Optional: Figma MCP (designer on team)

Add when a designer joins and works in Figma.

```bash
claude mcp add figma -- npx figma-developer-mcp
```

Requires `FIGMA_PERSONAL_ACCESS_TOKEN`. Designer shares a frame URL → Claude Code reads layout, spacing, typography, color tokens → translates to shadcn/ui components. The designer doesn't need to know Claude Code exists.

---

## 2. Image generation: a presentation tool, not a product tool

Most hackathon apps don't need AI-generated images in the product itself. Your UI is handled by shadcn/ui. Your diagrams are handled by D2. Where image generation earns its place is the **pitch presentation** — 3–5 emotionally resonant images that make judges feel the problem before you show the solution.

### Gemini auto-prompt MCP

```bash
claude mcp add gemini-image -- npx -y @shinpr/mcp-image
```

Requires `GEMINI_API_KEY`. Auto-expands rough descriptions into structured prompts using a Subject-Context-Style framework. Quality presets (fast/balanced/quality) give predictable output tiers.

### Workflow: abstract → iterate → precise

**Step 1: Define what you need, not what it looks like.** Start with Claude Code or Claude.ai. Describe the emotion and context: "I need the jury to feel what it's like to be rejected at a bank when you have all the right documents." Claude helps translate that into a rough image prompt.

**Step 2: Feed the rough prompt to the MCP.** "Person at bank counter, documents spread out, being turned away." The framework auto-expands into Subject (person, documents, counter), Context (bank interior, frustration), and Style (editorial, warm tones, shallow depth of field). You don't write any of that.

**Step 3: Review and steer.** The first image gives you a direction. Correct with specifics: "Same scene but warmer lighting, focus on the documents on the counter, less dramatic."

**Step 4: Lock in with precision.** "Close-up of hands holding a residence permit and employment contract, bank desk in soft focus behind, editorial photography style, warm tones." Output is PNG. Typically 2–3 iterations per image.

### Free alternative: stock image marketplaces

Unsplash, Pexels, Pixabay — free, no attribution required. A well-chosen stock photo of a real bank counter can be more authentic than an AI-generated scene. Mix stock images for context slides with 1–2 AI-generated images for the specific moments no stock photo captures.

---

## 3. Presentations: Marp → Google Slides

Two steps. Marp gets the content down in minutes. Google Slides makes it presentable. No MCP needed — Claude Code runs Marp directly.

### Step 1: Draft with Marp

Claude Code writes standard Markdown with `---` separators between slides, then exports:

```bash
npx @marp-team/marp-cli slides.md --pptx
```

**Workflow:** Tell Claude Code your pitch structure → it generates the markdown → iterate on content → include generated PNG images via `![](bank-rejection.png)` → export to PPTX.

### Step 2: Polish in Google Slides

Upload the .pptx to Google Drive — it converts automatically. Adjust image placement, apply consistent fonts and brand colors, add transitions between key sections. Present from the browser with presenter view and speaker notes.

---

## 4. Model access: abstract the provider, decide later

Use the **Anthropic SDK** with environment-based provider switching. Your app code stays the same — only the config changes.

```typescript
import Anthropic from "@anthropic-ai/sdk";
// Direct API: set ANTHROPIC_API_KEY
// Bedrock: set AWS credentials + ANTHROPIC_BEDROCK=true
const client = new Anthropic();
```

Claude Code itself runs on Anthropic-provided API credits during most hackathons. This section is about your **app's** model calls. Keep these separate: Claude Code is your development tool, your app is the product.

---

## 5. Deploy: Vercel plugin + AWS via CLI

### Vercel (plugin — richer than raw CLI)

```bash
claude plugin install vercel@claude-plugins-official
```

Gives Claude Code `/deploy`, `/vercel-logs`, `/vercel-setup` commands. Handles CLI auth and project linking automatically. Preview deployments for every PR. Production deploy on merge to main.

**Limitation to watch:** Free tier has a 10-second function timeout (Pro: 60 seconds). If Claude takes a while processing multi-page documents, split extraction into smaller calls or upgrade to Vercel Pro.

### Next.js DevTools MCP

```bash
claude mcp add nextjs -- npx -y next-devtools-mcp@latest
```

Docs search, dev server discovery, Playwright browser evaluation, error detection. This is a real MCP — it provides framework-aware context that CLI tools can't match.

### AWS extensions (via CLI — no MCPs needed)

Claude Code writes AWS SDK code in your app and runs `aws` CLI for infrastructure. At hackathon scale, CLI commands are faster than MCP abstractions.

| Product need                  | AWS service  | How Claude Code uses it                                                           |
| ----------------------------- | ------------ | --------------------------------------------------------------------------------- |
| "Save my documents for reuse" | S3           | `aws s3 cp` for upload. AWS SDK `@aws-sdk/client-s3` in app code.                 |
| "Show my past checks"         | DynamoDB     | `aws dynamodb put-item` / `scan`. AWS SDK `@aws-sdk/client-dynamodb` in app code. |
| "Notify me when done"         | SQS + Lambda | `aws lambda create-function`. AWS SDK in app code.                                |
| "Deploy all infra as code"    | CDK          | `npx cdk deploy`. Claude Code writes CDK stacks in TypeScript.                    |
| "Don't let costs surprise me" | CloudWatch   | `aws cloudwatch put-metric-alarm`. Set billing alarm before hackathon.            |

---

## 6. Diagramming: D2 CLI + Structurizr MCP

Two diagram tools, two distinct jobs. D2 for user flow sequences. C4/Structurizr for architecture with zoom levels. Both produce clean, minimalistic output readable in 5 seconds.

### D2: user flow (CLI — no MCP needed)

Claude Code writes `.d2` files and renders them directly. No MCP server required.

```bash
# Pre-install D2
curl -fsSL https://d2lang.com/install.sh | sh -s --

# Claude Code renders directly
d2 flow.d2 flow.svg
```

~40 tokens for a full user interaction sequence. Use for the "paste your documents → get your answer" slide.

### C4/Structurizr: architecture (MCP — hosted service)

C4 defines built-in zoom levels: Context → Container → Component → Code. Structurizr's hosted MCP is the only interface — this MCP is justified.

```bash
claude mcp add structurizr -- npx mcp-remote https://mcp.structurizr.com/mcp
```

Claude Code writes Structurizr DSL → MCP validates and parses → render at `playground.structurizr.com`. Define the model once, generate views at any zoom level.

| Diagram               | Tool     | Purpose in pitch                                    |
| --------------------- | -------- | --------------------------------------------------- |
| User flow sequence    | D2 (CLI) | "Here's what happens when you paste your documents" |
| System context (L1)   | C4 (MCP) | "Here's what the system talks to"                   |
| Container view (L2)   | C4 (MCP) | "Here's what runs inside"                           |
| Component detail (L3) | C4 (MCP) | "Here's how matching works" — only if judges ask    |

---

## 7. Development framework: ECC with whitelist approach

ECC is the behavioral layer on top of Claude Code — quality gates, code review, security scanning, memory persistence.

### What it solves and what to watch for

|                    | **ECC for Claude Code**                                                                        | **How to mitigate**                                                           |
| ------------------ | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| **Core problem**   | Inconsistent agent behavior across sessions. No enforced testing, no code review, no memory.   | —                                                                             |
| **How it works**   | Agents, skills, hooks, rules injected into Claude Code config. Hooks fire on lifecycle events. | —                                                                             |
| **Learning curve** | 38 agents, 156 skills — too many to learn in 24 hours.                                         | Whitelist ~15 components. Drop everything else.                               |
| **Token overhead** | Full install loads unnecessary skills into context.                                            | Selective install with `--with`/`--without` flags.                            |
| **Hook conflicts** | Hooks may interfere with MCP servers.                                                          | `ECC_HOOK_PROFILE=minimal`. Disable specific hooks with `ECC_DISABLED_HOOKS`. |

### Whitelist: include only these

```bash
ecc install --profile developer \
  --with lang:typescript \
  --with agent:code-reviewer \
  --with agent:security-reviewer \
  --with agent:typescript-reviewer \
  --without skill:continuous-learning \
  --without skill:autonomous-loops
```

| Component                     | Why it's whitelisted                                                   |
| ----------------------------- | ---------------------------------------------------------------------- |
| **code-reviewer agent**       | Catches bugs before the demo.                                          |
| **security-reviewer agent**   | You're handling immigration documents.                                 |
| **typescript-reviewer agent** | TypeScript patterns for Next.js API routes and React components.       |
| **TDD skill**                 | One test per critical flow. Most hackathon projects crash during demo. |
| **backend-patterns skill**    | API design for document upload, inference, result formatting.          |
| **build-fix skill**           | Incrementally fix build and type errors at 3am.                        |
| **TypeScript rules**          | Immutability, error handling, file organization.                       |
| **SessionStart/Stop hooks**   | Memory persistence across Claude Code restarts.                        |
| **PostToolUse hooks**         | Auto-format on save.                                                   |

Everything else is dropped.

### Interoperability: ECC alongside MCP servers

| Tool                     | Layer              | Interaction with ECC                                                                                                 |
| ------------------------ | ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| **shadcn/ui MCP**        | Component docs     | No conflict. ECC doesn't touch UI decisions.                                                                         |
| **Next.js DevTools MCP** | Framework context  | Complements ECC's build-fix with framework-specific errors.                                                          |
| **Playwright MCP**       | Browser automation | Complements ECC — ECC catches code issues at save time, Playwright catches runtime issues by driving the actual app. |
| **Structurizr MCP**      | Architecture       | Separate concern. No interaction.                                                                                    |

**The rule:** ECC owns code quality. MCPs own domain knowledge. Skills own project context. They stack, they don't compete.

### GitHub + CI/CD

Claude Code uses `gh` CLI natively — no GitHub MCP needed. It creates branches, PRs, issues, reads PR comments directly.

**Pre-configured GitHub Actions:**

`.github/workflows/ci.yml` — on every push and PR: lint (`eslint`), type-check (`tsc --noEmit`), test (`playwright test`), build (`next build`). Vercel auto-deploys preview URLs for every PR.

`.github/workflows/deploy.yml` — on merge to `main`: Vercel production deployment. Optional `cdk deploy` if AWS extensions are active.

**Workflow during the hackathon:**

1. Claude Code creates feature branch → implements → commits with conventional messages.
2. Push triggers CI. Tests pass. Preview URL generated.
3. Quick review, merge to main. Production deploys.
4. Repeat.

ECC's code-reviewer runs locally before push. GitHub Actions runs the same checks remotely. Belt and suspenders.

---

## 8. Debugging, testing, and browser automation

### Playwright MCP (browser automation + testing + self-QA)

```bash
claude mcp add playwright -- npx @playwright/mcp@latest
```

Microsoft's official Playwright MCP. This is the tool that gives Claude Code eyes and hands on your running app. Claude Code navigates to your localhost, clicks through the user flow, fills forms with test data, inspects the result, and catches issues — all through structured accessibility data, no vision models needed.

**Three use cases during the hackathon:**

**Self-QA:** After Claude Code makes a code change, tell it: "Use playwright mcp to open localhost:3000, upload a test document, and verify the results screen shows green/yellow/red status for each bank." Claude Code drives a real browser, tests the flow, and fixes issues it finds.

**Integration testing:** "Use playwright mcp to test the full flow: upload a residence permit PDF, wait for processing, verify the bank matching results, then download the pre-filled application." This is the one test that prevents demo-day embarrassment.

**Visual verification:** "Use playwright mcp to take screenshots of the dashboard at mobile, tablet, and desktop widths." Complements autoVerify with explicit multi-device checks.

**Tip:** Explicitly say "playwright mcp" in your first message. Otherwise Claude Code may try to run Playwright through bash instead of the MCP.

### ngrok (expose to judges — CLI only)

```bash
ngrok http 3000
```

Public HTTPS URL pointing to localhost. Judges try the app on their phones during demo. Pre-install and pre-signup — don't do this on stage.

### Sentry (npm dependency — add during build)

```bash
npx @sentry/wizard@latest -i nextjs
```

Free tier. Catches runtime errors during the live demo with full stack traces. Set up when core flow works — not before.

---

## Pre-configured environment

Everything below is set up in the repository before the hackathon.

### Accounts required

Create these accounts before the hackathon. All free tier.

| Account              | Required for                           | Free tier                            | Sign up               |
| -------------------- | -------------------------------------- | ------------------------------------ | --------------------- |
| **GitHub**           | Repository, CI/CD, `gh` CLI            | Unlimited public repos               | github.com            |
| **Vercel**           | Deployment, preview URLs               | 100 deploys/day                      | vercel.com            |
| **Anthropic**        | Claude Code + app inference            | Hackathon credits typically provided | console.anthropic.com |
| **ngrok**            | Public URL for judges                  | 1 tunnel, 1 domain                   | ngrok.com             |
| **Sentry**           | Runtime error tracking                 | 5K errors/month                      | sentry.io             |
| **Google AI Studio** | Gemini image generation (optional)     | Free API key                         | aistudio.google.com   |
| **Figma**            | Design-to-code (optional, if designer) | Free for personal use                | figma.com             |
| **AWS**              | S3, DynamoDB, Lambda (optional)        | 12-month free tier                   | aws.amazon.com        |

### What's static (in the repo) vs dynamic (env variables)

**Static — committed to the repository, shared across all team members:**

| File                           | What it configures                                                                                                                                       |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.claude/settings.json`        | MCP server definitions (shadcn/ui, Playwright, Structurizr, Next.js DevTools, Gemini image). Project-scoped — anyone who clones gets the same MCP setup. |
| `.claude/plugins.json`         | Vercel plugin, ECC plugin references.                                                                                                                    |
| `.claude/skills/`              | shadcn/ui skill files, ECC whitelisted skills (TDD, backend-patterns, build-fix).                                                                        |
| `.claude/agents/`              | ECC whitelisted agents (code-reviewer, security-reviewer, typescript-reviewer).                                                                          |
| `.claude/rules/`               | ECC TypeScript rules (immutability, error handling, file organization).                                                                                  |
| `CLAUDE.md`                    | Project instructions: architecture, conventions, what to build, what to avoid.                                                                           |
| `.github/workflows/ci.yml`     | CI pipeline: lint, type-check, test, build.                                                                                                              |
| `.github/workflows/deploy.yml` | CD pipeline: Vercel production deploy, optional CDK deploy.                                                                                              |
| `playwright.config.ts`         | Playwright test configuration (base URL, timeouts, browsers).                                                                                            |
| `vercel.json`                  | Vercel project settings (framework, build command, regions).                                                                                             |
| `.eslintrc.json`               | Linting rules.                                                                                                                                           |
| `tsconfig.json`                | TypeScript compiler options.                                                                                                                             |
| `tailwind.config.ts`           | Tailwind + shadcn/ui theme tokens.                                                                                                                       |

**Dynamic — set via environment variables, never committed:**

| Variable                                  | What it controls                                      | Where to set                    |
| ----------------------------------------- | ----------------------------------------------------- | ------------------------------- |
| `ANTHROPIC_API_KEY`                       | App model inference (direct API)                      | `.env.local` + Vercel dashboard |
| `ANTHROPIC_BEDROCK`                       | Switch inference to Bedrock (set to `true`)           | `.env.local`                    |
| `AWS_ACCESS_KEY_ID` / `SECRET` / `REGION` | AWS service access                                    | `.env.local` + CI secrets       |
| `NGROK_AUTHTOKEN`                         | ngrok tunnel auth                                     | Terminal export                 |
| `GEMINI_API_KEY`                          | Gemini image generation                               | Terminal export                 |
| `FIGMA_PERSONAL_ACCESS_TOKEN`             | Figma MCP auth                                        | Terminal export                 |
| `SENTRY_DSN`                              | Sentry error reporting endpoint                       | `.env.local` + Vercel dashboard |
| `SENTRY_AUTH_TOKEN`                       | Sentry source maps upload                             | CI secrets                      |
| `ECC_HOOK_PROFILE`                        | ECC hook intensity: `minimal` / `standard` / `strict` | Terminal export or `.env.local` |
| `ECC_DISABLED_HOOKS`                      | Disable specific ECC hooks by name                    | Terminal export                 |

**The `.env.example` file in the repo lists every variable with descriptions.** At the hackathon, copy it to `.env.local` and fill in your keys.

### Variables to set at the hackathon

```bash
# Required — copy .env.example to .env.local and fill in
ANTHROPIC_API_KEY=...
NGROK_AUTHTOKEN=...

# Optional — add when needed
GEMINI_API_KEY=...
FIGMA_PERSONAL_ACCESS_TOKEN=...
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
AWS_DEFAULT_REGION=...
SENTRY_DSN=...
```

### Toolchain summary

**Built-in (zero config):**

| Tool       | What Claude Code does with it                              |
| ---------- | ---------------------------------------------------------- |
| Git        | Commits, branches, merges                                  |
| `gh` CLI   | Creates PRs, issues, reads comments — no GitHub MCP needed |
| autoVerify | Screenshot → fix → verify loop                             |
| Bash       | Runs any CLI tool directly                                 |

**CLI tools (pre-installed):**

| Tool    | Purpose                                                                     |
| ------- | --------------------------------------------------------------------------- |
| D2      | User flow diagrams — Claude Code writes `.d2` files and runs `d2 render`    |
| Marp    | Pitch deck — Claude Code writes markdown and runs `npx @marp-team/marp-cli` |
| ngrok   | Public URL for judges                                                       |
| AWS CLI | S3, DynamoDB, Lambda, CDK, CloudWatch — direct commands                     |

**Plugins:**

| Plugin          | Purpose                                                           |
| --------------- | ----------------------------------------------------------------- |
| Vercel          | `/deploy`, `/vercel-logs`, `/vercel-setup` — richer than raw CLI  |
| ECC (selective) | code-reviewer, security-reviewer, TDD, build-fix, TS rules, hooks |

**MCP servers (5 total):**

| MCP              | Why it can't be a CLI tool                                                                                                                |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| shadcn/ui        | Real-time component docs, props, examples — no CLI equivalent                                                                             |
| Next.js DevTools | Framework-aware dev server integration — beyond what `next` CLI provides                                                                  |
| Playwright       | Browser automation via accessibility tree — Claude Code drives your running app for self-QA, integration testing, and visual verification |
| Structurizr      | Hosted C4 service — MCP is the only interface                                                                                             |
| Gemini image     | Image generation API — MCP wraps the API with auto-prompt optimization                                                                    |

**npm dependencies (installed in project):**

| Package                    | Purpose                                                                                              |
| -------------------------- | ---------------------------------------------------------------------------------------------------- |
| `@anthropic-ai/sdk`        | Model inference in your app                                                                          |
| `@sentry/nextjs`           | Runtime error tracking                                                                               |
| `@playwright/test`         | Integration tests in CI (Playwright MCP handles interactive testing, this handles automated CI runs) |
| `@aws-sdk/client-s3`       | S3 operations in app code (when needed)                                                              |
| `@aws-sdk/client-dynamodb` | DynamoDB operations in app code (when needed)                                                        |

### Build order during the hackathon

**Hours 0–4:** Core flow on Vercel. Upload → extract → match → result. This is the demo.

**Hours 4–8:** Activate S3 + DynamoDB via AWS CLI. Document reuse, request history. Visible to judges.

**Hours 8–12:** Polish. Sentry for demo safety. One Playwright test. Hover transitions, spacing. Architecture diagrams in D2 and C4.

**Hours 12–20:** Stretch features. Lambda queue for long extractions. Additional bank rules. Edge case handling.

**Hours 20–24:** Pitch. Generate 3–5 images with Gemini MCP. Draft deck in Marp. Export to Google Slides. Polish. Practice.

### Cost estimate

| Item                                | Cost       |
| ----------------------------------- | ---------- |
| Anthropic API inference (full day)  | ~$5–15     |
| Pitch images (5 via Gemini)         | ~$0.50     |
| AWS services (S3, DynamoDB, Lambda) | < $1       |
| Vercel / GitHub / ngrok             | Free       |
| All MCP servers and tools           | Free       |
| **Total**                           | **~$6–17** |

---

## Quick reference

**MCP servers (pre-configured with `--scope project` — committed to `.claude/settings.json`):**

```bash
claude mcp add --scope project shadcn -- npx shadcn@latest mcp
claude mcp add --scope project nextjs -- npx -y next-devtools-mcp@latest
claude mcp add --scope project playwright -- npx @playwright/mcp@latest
claude mcp add --scope project structurizr -- npx mcp-remote https://mcp.structurizr.com/mcp
claude mcp add --scope project gemini-image -- npx -y @shinpr/mcp-image
claude mcp add --scope project figma -- npx figma-developer-mcp   # optional: designer on team
```

`--scope project` stores these in `.claude/settings.json` in the repo. Anyone who clones gets the same MCP setup — no per-developer configuration.

**Plugins:**

```bash
claude plugin install vercel@claude-plugins-official
ecc install --profile developer --with lang:typescript --with agent:code-reviewer --with agent:security-reviewer --without skill:continuous-learning --without skill:autonomous-loops
```

**Skills:**

```bash
npx skills add shadcn/ui
```

**CLI tools (pre-installed, Claude Code drives directly):**

```bash
curl -fsSL https://d2lang.com/install.sh | sh -s --          # D2
npm i -g ngrok                                                # ngrok
# AWS CLI, Marp, Vercel CLI — installed via package manager
```

---

## CLAUDE.md template

This is the most important file in the repo. It tells Claude Code what the project is, what tools are available, and how to work. Without it, Claude Code doesn't know Playwright MCP exists for testing, doesn't know D2 is the diagram tool, and doesn't know about ECC's code-reviewer agent. Pre-configure this before the hackathon.

```markdown
# Immigrant Bank Account Readiness Checker

Paste your documents → which banks will accept you + what's missing + pre-filled application.

## Architecture

Next.js 14+ app with shadcn/ui components. API routes handle document processing via Anthropic SDK. Vercel deployment. Optional AWS extensions (S3, DynamoDB, Lambda).

## Available tools — use these, don't reinvent

### MCP servers (loaded automatically)

- **shadcn/ui MCP**: Use for all UI components. Query component docs and props before building UI.
- **Playwright MCP**: Use for testing. Say "use playwright mcp to test [flow]" for self-QA and integration testing.
- **Structurizr MCP**: Use for architecture diagrams. Write Structurizr DSL for C4 model views.
- **Next.js DevTools MCP**: Use for framework docs and error context.
- **Gemini image MCP**: Use for pitch presentation images only.

### Plugins

- **Vercel plugin**: Use `/deploy` for deployment, `/vercel-logs` for debugging.
- **ECC**: code-reviewer and security-reviewer agents run automatically via hooks.

### CLI tools (run directly via bash)

- **D2**: Write `.d2` files and render with `d2 filename.d2 filename.svg` for user flow diagrams.
- **Marp**: Write markdown slides and export with `npx @marp-team/marp-cli slides.md --pptx`.
- **gh**: Create branches, PRs, issues via GitHub CLI.
- **AWS CLI**: `aws s3`, `aws dynamodb`, `aws lambda` for infrastructure.

## Conventions

- TypeScript strict mode. No `any` types.
- Immutable data. New objects, never mutate.
- Small files: 200–400 lines typical, 800 max.
- Feature-based file organization, not type-based.
- Conventional commit messages: feat:, fix:, refactor:, docs:, test:.
- One branch per feature. PR before merge.

## Testing requirements

- One Playwright integration test for the happy path (upload → match → results).
- One error case test (invalid document format).
- Run tests with: `npx playwright test`
- For interactive testing: "use playwright mcp to open localhost:3000 and test [specific flow]"

## Security

- Never persist documents to disk unless user explicitly opts in (S3 extension).
- Never log document contents.
- Never commit API keys. Use .env.local.
- Immigration documents are sensitive. When security-reviewer agent flags an issue, fix it.

## Deployment

- `vercel deploy` or `/deploy` via Vercel plugin.
- CI runs on every push: lint, type-check, test, build.
- Production deploys on merge to main.

## Domain knowledge

Bank requirements data is in `data/bank-rules/`. Each bank has a JSON file with:

- Required document types per permit category
- Accepted permit types
- Required proof of address format
- Additional requirements (BSN, employer letter, etc.)

Document type mappings are in `data/document-types.json`.
```

Adjust this template to match your actual project structure. The key sections Claude Code needs are: available tools (so it knows what to use), conventions (so it writes consistent code), and domain knowledge (so it finds the right data).

---

## Domain knowledge setup

Claude Code needs to find your project's domain data. Pre-populate these before the hackathon:

| File/folder                     | Content                                                            | Source                            |
| ------------------------------- | ------------------------------------------------------------------ | --------------------------------- |
| `data/bank-rules/ing.json`      | ING requirements: accepted permits, required documents, conditions | Research from bank websites       |
| `data/bank-rules/abn-amro.json` | ABN AMRO requirements                                              | Research from bank websites       |
| `data/bank-rules/bunq.json`     | Bunq requirements                                                  | Research from bank websites       |
| `data/bank-rules/rabobank.json` | Rabobank requirements                                              | Research from bank websites       |
| `data/document-types.json`      | Mapping of document types to extraction patterns                   | Your domain knowledge             |
| `data/permit-categories.json`   | Work permit types and their properties                             | IND (Dutch immigration) website   |
| `docs/matching-logic.md`        | How the matching engine works — rules, scoring, edge cases         | Your design decisions             |
| `tests/fixtures/`               | Sample documents for testing (anonymized)                          | Create test PDFs before hackathon |

Claude Code reads these files during development to understand the domain. Without them, it invents bank requirements instead of using real data.

---

## Pre-flight checklist

Run this before the hackathon to verify everything works. Every item should pass. If something fails, fix it before the event — don't debug infrastructure during build time.

### 1. Repository

```bash
git clone [your-repo-url]
cd [repo]
cp .env.example .env.local
# Fill in ANTHROPIC_API_KEY and NGROK_AUTHTOKEN
npm install
```

### 2. App starts

```bash
npm run dev
# Visit http://localhost:3000 — should see the landing page
```

### 3. MCP servers connect

```bash
claude mcp list
# Should show: shadcn, nextjs, playwright, structurizr, gemini-image
# All status: connected
```

### 4. Playwright MCP works

In Claude Code: "Use playwright mcp to open localhost:3000 and take a screenshot"
Expected: browser opens, screenshot appears in conversation.

### 5. Vercel deploys

```bash
/deploy
# Or: vercel deploy
# Should produce a live URL
```

### 6. GitHub CI passes

```bash
git checkout -b test/preflight
git commit --allow-empty -m "test: preflight check"
git push -u origin test/preflight
gh pr create --fill
# Check GitHub Actions — CI should pass (lint, type-check, build)
# Delete the test branch after
```

### 7. D2 renders

```bash
echo 'user -> app: upload docs' > test.d2
d2 test.d2 test.svg
# Should produce test.svg
rm test.d2 test.svg
```

### 8. Marp exports

```bash
echo -e "---\nmarp: true\n---\n# Test Slide" > test.md
npx @marp-team/marp-cli test.md --pptx
# Should produce test.pptx
rm test.md test.pptx
```

### 9. ECC hooks fire

In Claude Code: create a TypeScript file with a deliberate type error.
Expected: PostToolUse hook runs linter, flags the error.

### 10. ngrok tunnels

```bash
ngrok http 3000
# Should produce a public HTTPS URL
# Open it on your phone — should show the app
```

### Optional: AWS extensions

```bash
aws sts get-caller-identity    # AWS credentials work
aws s3 ls                      # S3 access works
```

### Optional: Gemini image generation

In Claude Code: "Use gemini-image to generate a test image of a sunset"
Expected: PNG file generated.

If all checks pass, your environment is hackathon-ready. Delete any test files, commit, push.

---

## Prompt playbook

Pre-written prompts for common hackathon actions. Copy-paste or add as slash commands in `.claude/commands/`.

### Building features

```
Build the document upload component. Use shadcn/ui Card, FileUpload, and Button components.
The user drops or selects PDF/image files. Show upload progress. Display file names after upload.
Max 5 files, max 10MB each. Layout like Vercel's file upload pattern.
```

```
Create the bank matching API route at /api/match. It receives extracted document data,
loads bank rules from data/bank-rules/, compares each document against each bank's requirements,
and returns a result object with status (green/yellow/red) per bank plus missing documents list.
```

```
Build the results dashboard. For each bank, show a Card with the bank name, status badge
(green=ready, yellow=missing docs, red=not eligible), and a list of what's missing.
Use shadcn/ui Badge for status, Accordion for details per bank.
```

### Testing

```
Use playwright mcp to test the full flow: open localhost:3000, upload the test PDF from
tests/fixtures/sample-permit.pdf, wait for processing to complete, verify that the results
screen shows status badges for at least 3 banks, and take a screenshot of the final state.
```

```
Use playwright mcp to test error handling: open localhost:3000, upload a text file that is
not a valid document, verify that an error message appears, and take a screenshot.
```

### Diagrams

```
Create a D2 sequence diagram showing the user flow: user uploads documents → app sends to
Claude API for extraction → Claude returns structured data → app matches against bank rules
→ app returns results with green/yellow/red per bank. Save as docs/diagrams/user-flow.d2
and render to SVG.
```

```
Create a Structurizr DSL model for the system architecture. Level 1 (context): User,
Bank Readiness App, Claude API, Bank Requirements Database. Level 2 (container): Next.js
frontend, API routes, document extraction service, matching engine, result generator.
Validate with the Structurizr MCP.
```

### Pitch deck

```
Create a 10-slide Marp deck for the pitch. Structure:
1. Hook (the problem in one sentence)
2. Personal story (my immigration experience)
3. The invisible problem (statistics)
4. Demo screenshot — upload screen
5. Demo screenshot — results screen
6. How it works (D2 user flow diagram)
7. Architecture (C4 system context)
8. Market size and business model
9. What's built vs what's next
10. Ask
Export to PPTX.
```

### Deployment

```
Create a feature branch for [feature name], implement it, write one test,
run the test with playwright, commit with a conventional message, push, and create a PR.
```

---

## When things break

Quick fixes for the most common failures during a hackathon.

**MCP server won't start:**

```bash
claude mcp list                    # Check status
claude mcp remove [name]           # Remove broken server
claude mcp add --scope project [name] -- [command]  # Re-add
# Restart Claude Code after changes
```

**ECC hook interfering with development speed:**

```bash
export ECC_HOOK_PROFILE=minimal    # Reduce hook surface
# Or disable a specific hook:
export ECC_DISABLED_HOOKS=post-tool-format
```

**Vercel deploy times out (function timeout):**
Split the document processing API route into two calls: one for extraction (fast), one for matching (fast). Don't process everything in a single 10-second function.

**Playwright MCP uses bash instead of MCP:**
Always say "use playwright mcp" explicitly in your first message of a session. Claude Code sometimes defaults to running Playwright through bash otherwise.

**Claude Code context getting long / quality degrading:**
Run `/compact` to compress the conversation. If quality is still poor, start a new session — ECC's SessionStart hook will restore memory from the previous session.

**GitHub CI failing but local build works:**
Check that `.env.local` variables are also set in GitHub Actions secrets. Common miss: `ANTHROPIC_API_KEY` needed for tests that call the model.

**D2 diagram looks ugly:**
Add `direction: right` for horizontal flow. Use `*.style.border-radius: 8` for rounded corners. The TALA layout engine handles positioning — don't fight it.

**Can't connect to AWS services:**

```bash
aws sts get-caller-identity    # Verify credentials
aws configure list             # Check region
# If using SSO: aws sso login
```

**ngrok tunnel dies mid-demo:**
Free tier tunnels expire after 2 hours. Restart with `ngrok http 3000`. Keep the terminal visible during the demo so you notice if it drops.
