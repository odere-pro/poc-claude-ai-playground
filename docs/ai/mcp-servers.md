# MCP Servers

Five MCP servers are configured project-wide in `.mcp.json`. They activate automatically when you open a Claude Code session in this directory — no setup required beyond env vars where noted.

```bash
claude mcp list   # verify all 5 show as connected
```

---

## shadcn

Real-time shadcn/ui component documentation and props. Query it before building any UI to get the correct API instead of guessing from memory.

**When to use:** Before adding or customizing any shadcn component.

**Example prompts**

```
Use shadcn mcp to show me the props for the Card component.
```

```
Use shadcn mcp to find the right component for a file drop zone.
```

```
Use shadcn mcp to show examples of the Dialog component with a form inside.
```

**Prerequisites:** None. Runs via `npx shadcn@latest mcp` on startup.

---

## nextjs

Next.js DevTools — dev-server awareness, framework documentation, and Next.js 16 pattern guidance. Gives Claude live access to what the dev server is actually serving instead of relying on stale context.

**When to use:** When implementing App Router patterns, debugging server/client component splits, or checking that a route is live before testing it.

**Example prompts**

```
Use nextjs mcp to check if the dev server is running and what routes are registered.
```

```
Use nextjs mcp to show the Next.js 16 docs on streaming server components.
```

```
Use nextjs mcp to inspect the current build output for src/app/api/extract/route.ts.
```

**Prerequisites:** `npm run dev` should be running for the dev-server awareness tools to return live data. Framework docs work without it.

---

## playwright

Browser automation for self-QA, end-to-end testing, and visual verification — all from inside a Claude session. Drives a real browser; no Bash fallback.

**When to use:** Any time you want Claude to interact with the running app and verify behavior visually. Always say "use playwright mcp" explicitly in the first message — otherwise Claude may fall back to running `npx playwright` via Bash.

**Example prompts**

```
Use playwright mcp to open localhost:3000, upload a sample PDF from tests/fixtures/,
and screenshot the result page.
```

```
Use playwright mcp to fill in the document upload form with an invalid file type
and verify the error message appears.
```

```
Use playwright mcp to navigate to localhost:3000 at 375px wide and screenshot
the mobile layout.
```

**Prerequisites:** `npm run dev` must be running. For `npm run test:e2e`, Playwright runs headlessly via Bash — the MCP path is for interactive, conversational QA.

**Gotcha:** If Playwright appears in Bash tool calls (`npx playwright`) instead of MCP tool calls, start a new message with "use playwright mcp to …" explicitly.

---

## structurizr

C4 architecture diagram generation. Write Structurizr DSL, get back PlantUML, Mermaid, or PNG exports. Hosted at `mcp.structurizr.com/mcp`.

**When to use:** Creating the architecture slide for the pitch deck, or documenting system structure for the team.

**Example prompts**

```
Write Structurizr DSL for a C4 context diagram showing: a user uploads documents,
the Next.js app calls the Anthropic API, and returns a MatchResult.
Then use structurizr mcp to export it as a Mermaid diagram.
```

```
Use structurizr mcp to validate this DSL and export a container diagram as PNG.
```

**Prerequisites:** Internet access (remote MCP at structurizr.com). No API key required for basic rendering.

---

## gemini-image

Google Gemini image generation for pitch deck and marketing visuals. Generates PNG images from text prompts.

**When to use:** For 2–3 slides in the pitch deck where stock photos don't convey the right emotion. Real app screenshots beat generated images for demo slides — use Gemini only for context/emotional slides.

**Iteration pattern:** Three-call workflow:

1. First call: establish direction (composition + mood)
2. Second call: refine (lighting, color grade, specific details)
3. Third call: lock in final version

Save outputs to `docs/images/`.

**Image sourcing hierarchy**

1. Real app screenshots — always preferred for demo slides
2. D2 / Structurizr diagrams — for system behavior
3. Stock photos (Unsplash / Pexels) — for context
4. Gemini images — for emotional moments stock doesn't cover

Never mix AI-generated image styles on the same deck. Pick one visual direction and commit.

**Example prompts**

```
Use gemini-image to generate a close-up of a hand holding a residence permit on a bank
counter, editorial photography, warm tones, shallow depth of field. Save to docs/images/hero.png.
```

```
Generate 3 pitch deck images with gemini-image:
1. Immigrant at an airport arrival gate, looking thoughtful, soft natural light
2. Hands spreading immigration documents on a wooden table, warm editorial tones
3. Abstract: a compass pointing to "the right bank", minimal, editorial style
Save each to docs/images/slide-[n].png.
```

```
Use gemini-image to refine the previous image — warmer tones, tighter crop on the hands,
remove the background clutter. Save to docs/images/hero-v2.png.
```

**Prerequisites:** `GEMINI_API_KEY` must be set before Claude Code starts.

```bash
# In .env.local (auto-sourced via the session-start hook):
GEMINI_API_KEY=your-key-here
```

If the MCP shows as disconnected (`claude mcp list` shows ✗ next to gemini-image), the key is missing or not exported. Export it in your shell or add it to `.env.local` and restart Claude Code.

---

## Troubleshooting

| Symptom                       | Cause                    | Fix                                                       |
| ----------------------------- | ------------------------ | --------------------------------------------------------- |
| MCP shows "Failed to connect" | Network or missing key   | `claude mcp remove <name>` → re-add → restart Claude Code |
| gemini-image disconnected     | `GEMINI_API_KEY` not set | Add to `.env.local` and restart Claude Code               |
| Playwright runs Bash not MCP  | Claude defaulted to CLI  | Start message with "use playwright mcp to …"              |
| structurizr times out         | Remote MCP unreachable   | Check internet; retry once; fall back to local Mermaid    |
| nextjs shows stale data       | Dev server not running   | `npm run dev` first                                       |
