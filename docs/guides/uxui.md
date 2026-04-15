# UX/UI Guide

Judges spend 30 seconds on your UI before deciding if they care. Make those seconds count.

## Design stance

**Opinionated, not decorative.** Every screen should have one primary action. Everything else fades back. Clarity beats novelty.

- Minimal chrome, generous whitespace
- One primary color (Zinc + a single accent — pick brand color day 1)
- Typography scale: 12 / 14 / 16 / 20 / 24 / 32. No arbitrary sizes.
- Corners: consistent `rounded-lg` or `rounded-xl` repo-wide
- Shadows: flat cards > layered drop shadows (unless dark mode)

## Component library strategy

Default to **shadcn/ui primitives + shadcn blocks** (via the MCP). Compose, don't customize, until you've shipped the feature once.

Workflow:

1. Ask Claude Code to suggest a layout: "Build a dashboard like Linear's issues view using shadcn/ui."
2. Start with a block from the MCP library if one fits (hero, pricing, data table, auth).
3. Trim to essentials; kill anything that doesn't serve the user's goal.

## autoVerify — ship with visual QA built in

Claude Code has a built-in screenshot→fix→verify loop. Use it:

> "Start the dev server, use playwright mcp to screenshot http://localhost:3000 at desktop + mobile widths, identify any visual issues, fix them, and verify again."

Run this **twice per feature** — once when the feature lands, once before the demo.

## Visual hierarchy

- Primary metric / CTA = 2–3× the size of secondary
- Use `text-muted-foreground` for secondary copy; don't grey out active elements
- Badges convey state; don't overload with >3 variants on one screen
- Loading: `Progress` or skeleton — never a raw spinner on a full page

## Micro-interactions (the polish judges notice)

- Buttons: `transition-colors duration-150` on hover
- Cards: subtle `hover:shadow-md` + `hover:-translate-y-0.5` on interactive ones
- Sheets / dialogs: fade + slight scale; use shadcn defaults
- Use `tw-animate-css` for any custom motion

## Accessibility (don't lose points on this)

- All interactive elements reachable via keyboard (Tab order sane)
- `aria-label` on icon-only buttons
- Contrast: `text-foreground` on `bg-background` — verify in dark mode too
- Skip "click here" in copy; button labels are verbs: "Upload", "See results", "Try another"

## Dark mode

Ships for free with shadcn. Add a toggle in the nav using `next-themes` when polishing. Verify every new screen in both modes before calling a feature done.

## Empty / error / loading

Three states to design for every component that fetches data:

| State   | Pattern                                                       |
| ------- | ------------------------------------------------------------- |
| Empty   | Friendly copy + primary action ("Upload your first document") |
| Error   | Red `Alert` with retry button + correlation id for support    |
| Loading | `Skeleton` matching the final layout                          |

## Responsive

Design mobile-first. shadcn defaults are already responsive, but:

- Drawer instead of sidebar under `md`
- Stack cards vertically under `sm`
- Touch targets ≥ 44×44

## Design-to-code (when a designer joins)

1. Add Figma MCP: `claude mcp add figma -- npx figma-developer-mcp`
2. Designer shares a frame URL
3. Prompt: "Translate this Figma frame into a React component using shadcn/ui primitives and Tailwind tokens that match our theme."
4. Expect 70% fidelity; refine with follow-up prompts.

## Prompt recipes

```
Build the landing page. Hero with one-sentence value prop, a single primary CTA
("Upload your documents"), and a short 3-step explainer below using shadcn/ui Cards.
Minimal, editorial, lots of whitespace, layout hierarchy like Linear's marketing page.
Dark mode must look equally good. Use autoVerify to screenshot and fix.
```

```
Polish pass on the results dashboard: review the spacing scale, unify corner radii,
add subtle hover transitions to cards, ensure empty/error/loading states exist,
verify keyboard navigation, and screenshot at 375px, 768px, 1440px to confirm.
```
