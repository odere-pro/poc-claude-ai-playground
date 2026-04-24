# AI Workflows

Eight copy-pasteable workflows for common tasks. Each follows the pattern: **goal → prompts → expected outcome**.

Open Claude Code (`claude`) in the project root before starting any workflow.

When in doubt about which workflow applies — or for any feature spanning UI + API + data — start with workflow 0 below. The orchestrator picks the right combination of agents and MCPs for you.

---

## 0. Orchestrate a feature end-to-end

**Goal:** One entry point that decides which specialist agents and MCPs to chain for a given task. Best for non-trivial work, security-sensitive changes, or anything spanning ≥ 2 layers (UI + API, API + data).

**Prompts**

```
Use the full-stack-developer agent to plan: add a 10MB upload size cap to /api/extract,
return 413 with no input echo on oversize, and cover both happy and error paths in Playwright.
```

```
Use the full-stack-developer agent to triage: build a results card component that shows
per-bank acceptance, missing documents, and a CTA. It must be keyboard-accessible.
```

The orchestrator returns five sections: **Understanding**, **Routing plan** (numbered specialists/MCPs), **Mandatory gates** (e.g. `security-reviewer` for upload changes, `npm run check` before commit), **Files likely affected**, and **Recommended next command**.

**Outcome:** A short, scannable plan you (or the parent session) execute step by step. The orchestrator does not write code — it routes. Specialists like `planner`, `code-architect`, `tdd-guide`, `security-reviewer`, `e2e-runner` do the actual work.

→ Agent definition: [`.claude/agents/full-stack-developer.md`](../../.claude/agents/full-stack-developer.md)

---

## 1. Build a UI component

**Goal:** Add a new shadcn/ui component with the correct API, built and verified against the running app.

**Prompts**

```
Read CLAUDE.md. Then use shadcn mcp to find the right component for a file drop zone
that accepts PDF and image files. Show me the props before building.
```

```
Build the document upload drop zone using the shadcn DropZone (or equivalent) component.
Accept PDF, PNG, JPEG up to 10MB. Show a file list with remove buttons after selection.
Use playwright mcp to verify the component renders at localhost:3000 and accepts a file drop.
```

**Outcome:** Component built, verified in a real browser, security-reviewer agent checks file handling.

---

## 2. Implement an API route

**Goal:** Go from a stub route to a working implementation with validation and tests.

**Prompts**

```
Read docs/guides/backend.md and src/app/api/extract/route.ts.
Implement POST /api/extract: accept multipart/form-data with up to 5 files (PDF/PNG/JPEG),
validate MIME type and size (10MB cap), call the Anthropic client with a structured-output
prompt returning { type, fields, confidence }, return ExtractedDocument[].
No logging of file contents. Use zod for body validation.
```

```
Now write a Playwright test for /api/extract:
- happy path: valid PDF → 200 + ExtractedDocument[]
- error path: invalid MIME type → 422
Run npm run test:e2e to confirm both pass.
```

**Outcome:** Route implemented, typed end-to-end, integration-tested with Playwright.

---

## 3. Self-QA a feature

**Goal:** Have Claude drive a real browser to interact with a feature and report what it finds — without writing a formal test.

**Prompts**

```
Use playwright mcp to open localhost:3000. Navigate the full upload flow:
1. Drop a file onto the upload zone
2. Submit the form
3. Wait for the results page
4. Screenshot the results
Report any visible errors, missing states, or broken layout.
```

```
Use playwright mcp to resize the browser to 375px wide and repeat the upload flow.
Screenshot every step. Report any overflow or layout issues.
```

**Outcome:** Bugs surfaced from a real browser, screenshots attached in the Claude response.

---

## 4. Security review before commit

**Goal:** Catch security issues in changed files before they reach the repo.

**Prompts**

```
I'm about to commit changes to src/app/api/extract/route.ts and src/lib/extract.ts.
Use the security-reviewer agent to check both files. Pay attention to:
- file upload validation (MIME, size, magic bytes)
- anything that could log document contents
- secrets or keys in the code
Block me if anything is CRITICAL.
```

**Outcome:** Security-reviewer flags findings with severity levels. Fix CRITICAL before committing; the agent won't let you proceed without acknowledgement.

---

## 5. Generate a C4 architecture diagram

**Goal:** Produce a clean architecture diagram for the pitch deck or team docs.

**Prompts**

```
Write Structurizr DSL for a C4 context diagram of this system:
- User uploads immigration documents via the web app
- Web app calls the Anthropic API for document extraction
- Web app runs the matching engine locally against bank rules
- Results are returned to the user
Keep it to one context view with 4-5 boxes. Then use structurizr mcp to export as Mermaid.
```

```
Use structurizr mcp to export the diagram as a PNG and save it to docs/diagrams/architecture.png.
```

**Outcome:** Diagram exported to `docs/diagrams/`. Drop the PNG into the pitch deck slide 7.

---

## 6. Build the pitch deck with Marp

**Goal:** Author a 10-slide pitch deck in Markdown and export it to PPTX.

**Prompts**

```
Read docs/guides/pitching.md. Draft a 10-slide Marp deck for the Bank Readiness Checker
using the narrative arc from that guide. Each slide: one headline sentence, one supporting
bullet or image placeholder. Speaker notes below each slide in HTML comments (<!-- notes -->).
Save to slides.md.
```

```
Export slides.md to PPTX:
npx @marp-team/marp-cli slides.md --pptx --output pitch.pptx
```

Then upload `pitch.pptx` to Google Slides for final polish: brand colors, custom font, presenter view.

**Iteration tip:** Read the slide deck aloud. Any sentence you stumble on is a sentence to cut. Target 4:30 run time — 10 slides at ~25 seconds each.

**Outcome:** `pitch.pptx` ready to upload to Google Slides. Image placeholders marked for the Gemini workflow below.

---

## 7. Generate presentation images with Gemini

**Goal:** Create 2–3 evocative images for emotional pitch deck slides where stock photos don't fit.

**Image sourcing hierarchy** (always follow this order):

1. Real app screenshots — best for demo slides (slides 4–5)
2. D2 / Structurizr diagrams — for system behavior (slides 6–7)
3. Stock photos (Unsplash / Pexels) — for context
4. Gemini images — only for emotional/story slides where nothing else fits

**Prerequisites:** `GEMINI_API_KEY` must be set in `.env.local`. If `claude mcp list` shows gemini-image as disconnected, the key is missing — add it and restart Claude Code.

**Iteration pattern:** Three calls — direction → refinement → final.

**Prompts**

```
Use gemini-image to generate a close-up of a hand holding a residence permit
on a bank counter, editorial photography, warm tones, shallow depth of field.
Save to docs/images/slide-2-story.png.
```

```
Refine the previous image: warmer color grade, tighter crop on the documents,
remove background clutter. Save to docs/images/slide-2-story-v2.png.
```

```
Generate 2 more pitch deck images with gemini-image:
1. An immigrant at an airport arrival gate, thoughtful expression, soft natural light
2. Abstract: a compass pointing to "the right bank", minimal, editorial style
Save to docs/images/slide-1-hook.png and docs/images/slide-3-problem.png.
```

**Style rule:** Never mix AI-generated image styles on the same deck. Commit to one visual direction (e.g., "warm editorial photography") before generating any images, and hold it across all slides.

**Outcome:** PNGs in `docs/images/` ready to insert into the Marp slides or Google Slides.

---

## Tips

- **Start every session with context:** `Read CLAUDE.md` as the first message.
- **Chain MCPs:** playwright MCP to verify → shadcn MCP to check component API → build in one flow.
- **Slow hooks?** `export ECC_HOOK_PROFILE=minimal` during fast iteration; unset before final review.
- **Context too long?** `/compact` to summarize the conversation. If still degraded, start a new session — the session-start hook restores key context automatically.
