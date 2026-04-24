# Demo Guide

The live demo is when 24 hours of work pay off — or don't. Make it bulletproof.

## Setup (1 hour before)

- [ ] Laptop on charger, external display tested
- [ ] Browser: two tabs — app + `claude mcp list` output as a backup
- [ ] Terminal: large font (Ghostty `Cmd+=`), `dev` session attached
- [ ] `.env.local` has live `ANTHROPIC_API_KEY` (not the sandbox one)
- [ ] Sentry dashboard open in a hidden tab (you'll check post-demo)
- [ ] Disable notifications system-wide (Do Not Disturb)
- [ ] Close Slack / email / any chat app

## Setup (5 minutes before)

- [ ] Hard refresh the app tab
- [ ] Run the golden path once end-to-end — if anything fails, fix _one_ thing only
- [ ] Restart the dev server so the first demo request doesn't hit a cold module cache
- [ ] Clear the tab's recent searches / autocomplete
- [ ] Pin the speaker notes / deck outline on a second device

## The demo script (3 minutes)

**Opening (20s)** — One sentence problem, one sentence promise.

**Upload (45s)**

- Narrate while acting: "I'm dragging the permit and contract here"
- Show the file cards with progress
- Pause briefly when processing starts — let them see the loader

**Results (60s)**

- "Three banks. Green means ready. Yellow means missing something specific."
- Click one missing-docs accordion → "Here's exactly what's needed"
- Click the action button → pre-filled application preview

**Why it's hard (30s)** — Show the bank-rules JSON; "Every bank has different rules. We encode them so users don't have to."

**Close (30s)** — One sentence on what's next. One sentence on the ask.

## Failsafes

### If the model API is slow

- **Plan A**: Continue narrating the UI
- **Plan B**: Switch to the pre-recorded screen capture tab ("Here's the same flow we ran earlier")
- **Plan C**: Walk through the results page with `mock=true` query param (implement this early)

### If the dev server crashes

- Have a second terminal ready with `PORT=3001 npm run dev` on standby

### If the internet drops at the venue

- Keep a screen recording of the full flow at 1080p, 60fps in `docs/demo/`
- Record it the night before, not the hour before

### If a bank rules file has a typo

- `data/bank-rules/*.json` are hot-reloadable — edit, save, demo uses it
- Do _not_ edit during the demo; just avoid the broken path and come back

## Record the backup video

```bash
# macOS built-in
# Cmd+Shift+5 → record selected portion, save to docs/demo/

# Script to follow while recording:
# 1. open localhost:3000
# 2. drop 2 files
# 3. wait for processing
# 4. scroll through results
# 5. expand one accordion
# 6. click the pre-fill action
```

Keep it ≤ 90 seconds. If you run it, caveat: "same flow, rendered faster — this is real output from yesterday."

## Judge Q&A

Anticipate these — have a two-sentence answer ready:

| Likely question                   | Answer hook                                                                                |
| --------------------------------- | ------------------------------------------------------------------------------------------ |
| "Is this hitting real bank APIs?" | No — rules are encoded from public bank requirements. Future: integrate with open banking. |
| "How accurate is the extraction?" | Show a confidence score per field on the extracted view.                                   |
| "What about GDPR?"                | Server-side, ephemeral in-memory, documents discarded after response unless S3 opt-in.     |
| "Can I try it on my phone?"       | Yes — open the Vercel preview URL on your phone.                                           |
| "Why not use [X model]?"          | Anthropic's structured extraction was the best fit for this use case.                      |
| "Business model?"                 | Freemium for users, pay-per-match or API pricing for banks.                                |

## After the demo

- Check Sentry for any errors during the run; be ready to explain what they mean
- Keep the terminal in the foreground — judges sometimes ask to see the prompt you used

## Anti-patterns

- Typing live during the demo (pre-fill everything that can be pre-filled)
- Saying "this is just a prototype" — of course it is; don't apologize
- Showing the 404 or loading spinner on the first screen; warm it up
- Forgetting to unplug from external displays when you walk off

## Prompt recipes

```
Before the demo: use playwright mcp to run the full flow five times with the sample
PDFs from tests/fixtures/. Confirm no 5xx responses, no unhandled client errors in the
console, and response times under 8 seconds per call. Report any regression.
```

```
Record a 60-second screen capture of the golden path. Save as docs/demo/golden-path.mp4.
Narration: upload → processing → results → one accordion expanded → application pre-fill.
No cuts; single take.
```
