# Pitching Guide

The pitch wins hackathons more often than the build does. Prepare it in parallel, not at the end.

## Narrative arc (10 slides, 5 minutes)

| #   | Slide                      | Purpose                                       | Secret sauce                     |
| --- | -------------------------- | --------------------------------------------- | -------------------------------- |
| 1   | Hook                       | One sentence that makes the jury lean forward | Stat or a concrete frustration   |
| 2   | Personal story             | Why _you_ care — 20 seconds                   | First-person, no buzzwords       |
| 3   | The invisible problem      | The scale of it — one bold number             | Cite source                      |
| 4   | Demo — upload              | Screenshot of the real product                | No lorem ipsum anywhere          |
| 5   | Demo — result              | The "wow" outcome screen                      | Green/yellow/red states visible  |
| 6   | How it works               | D2 user-flow diagram                          | ≤ 5 boxes; readable in 5s        |
| 7   | Architecture               | C4 context view (Structurizr)                 | Skip unless judges ask           |
| 8   | Market + biz model         | TAM/SAM/SOM or equivalent                     | One number per market tier       |
| 9   | What's built / what's next | Honest split                                  | Built > planned                  |
| 10  | Ask                        | What you want from the jury                   | Specific: mentor, pilot, funding |

## Writing the script

Draft with Claude Code, refine by reading aloud. Any sentence you stumble on is a sentence to cut.

Rules:

- Say one idea per slide out loud
- Never read the slide — the slide reinforces, you drive
- Use "you" more than "we"
- End every slide with a sentence that pulls to the next

## Tooling

### Marp — fast slide authoring

```bash
npx @marp-team/marp-cli slides.md --pptx --output pitch.pptx
```

Author in markdown, `---` between slides. Images with `![](file.png)`.

### Google Slides — final polish

Upload the `.pptx`; Slides converts automatically. Use it for:

- Brand colors + custom font
- Image resizing
- Speaker notes
- Presenter view during the live talk

### Gemini image MCP — evocative visuals

For 2–3 slides where a stock photo won't cut it:

> "Use gemini-image to generate a close-up of a hand holding a residence permit on a bank counter, editorial photography, warm tones, shallow depth of field."

Iterate: first call is the direction; second refines; third locks in. Save PNGs to `docs/images/`.

### D2 — user flow

```bash
d2 docs/diagrams/user-flow.d2 docs/diagrams/user-flow.svg
```

Small, readable, under 40 tokens of input. Use on slide 6.

### Structurizr — architecture (only if asked)

Write DSL → render at `playground.structurizr.com` → export PNG. Keep one context view handy; don't pre-spend a slide on it.

## Image sourcing hierarchy

1. Real screenshots of your working app (always preferred)
2. D2 / Structurizr diagrams (for system behavior)
3. Stock photos — Unsplash / Pexels (for context)
4. Gemini-generated (only for moments stock doesn't cover)

Never mix AI-generated styles on the same deck. Pick one and commit.

## Rehearsal

- Practice once solo with a timer
- Practice once in front of someone not on the team
- Time the whole deck to 4:30 — leaves 30 seconds for unplanned pauses
- If you can't finish by slide 10, the pitch is too long — cut, don't speed up

## Anti-patterns

- Opening with "Our team" instead of the problem
- Live-coding during the pitch (save for Q&A)
- Reading bullet points verbatim
- Over-explaining the tech before the value is clear
- "It's like X for Y" more than once

## Prompt recipes

```
Draft a 10-slide Marp deck for the Bank Readiness Checker pitch. Use the narrative arc
from docs/guides/pitching.md. Each slide: one sentence + optional image placeholder.
Speaker notes below each slide in HTML comments. Export to pitch.pptx.
```

```
Generate 3 images with gemini-image for the pitch deck:
1. Close-up of hands spreading immigration documents on a bank counter, warm editorial tones
2. An immigrant at an airport arrival gate, looking thoughtful, soft natural light
3. Abstract: a compass pointing to "the right bank", minimal, editorial
Save to docs/images/*.png.
```
