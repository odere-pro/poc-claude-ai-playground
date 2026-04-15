# Frontend Guide

Everything UI, routing, and client behavior lives here. Server Components by default; `"use client"` is an opt-in, not a default.

## Stack

- Next.js 16 App Router
- React 19
- TypeScript strict
- Tailwind v4 + shadcn/ui (New York / Zinc)
- `lucide-react` for icons

## Route layout

```
src/app/
  page.tsx              # landing + upload
  results/page.tsx      # results dashboard
  api/
    extract/route.ts    # doc → structured data
    match/route.ts      # structured data → per-bank result
```

Never reach into API routes from client code directly — use `fetch("/api/...")` with `Response.json()` and a typed wrapper in `src/lib/api.ts` (create when you first need it).

## Components

Base shadcn components installed:
`button`, `card`, `badge`, `accordion`, `progress`, `alert`.

Add more as needed:

```bash
npx shadcn@latest add dialog tabs separator sheet toast
```

### Composition rules

- Co-locate one-off subcomponents in the same file until they reach ~60 lines, then split into a sibling file.
- Shared components go to `src/components/<feature>/`. Keep `src/components/ui/` for shadcn originals only.
- Props: declare explicit types (`type Props = { ... }`). No `React.FC`.
- Keep components pure; push side effects to hooks.

## State

| Scope                        | Use                                                        |
| ---------------------------- | ---------------------------------------------------------- |
| URL (shareable)              | Search params via `useSearchParams`                        |
| Server                       | Server Components + `revalidateTag`                        |
| Session-local UI             | `useState` / `useReducer`                                  |
| Cross-component client state | React context (sparingly)                                  |
| Async server data on client  | `fetch` + cache — skip React Query unless lists grow large |

## Forms

Single source of truth: uncontrolled inputs + `FormData` on submit. Validate server-side with zod in the route handler. For richer UX add `react-hook-form` only when needed.

## Upload UI (feature spec for the landing page)

- Drop zone _or_ click-to-browse
- Accepts `application/pdf`, `image/png`, `image/jpeg`
- Max 5 files, 10 MB each
- Show filename + progress + cancel
- After upload, call `/api/extract`; show per-file status
- Persist selection in `sessionStorage` so a refresh doesn't wipe progress

## Styling

- Tailwind utility-first. No component-scoped CSS unless animation demands it.
- Dark mode via `class="dark"` on `<html>`; shadcn handles the palette.
- Spacing scale: stick to `p-*`, `gap-*`, `space-*` — no arbitrary values unless unavoidable.
- Motion: `tw-animate-css` for quick polish; prefer subtle transitions over bouncy ones.

## Client/server boundary

- Default to Server Components. Mark a file `"use client"` only if it uses `useState`, `useEffect`, event handlers, or browser APIs.
- Never import `fs`, `crypto`, or the Anthropic client from a client component. Use `import "server-only";` at the top of server-only modules to enforce.

## Testing (UI)

- Happy path + one error path per flow in `tests/e2e/`.
- Prefer `getByRole` / `getByLabel` over `getByTestId`.
- Use `page.screenshot()` in tests for visual regression during demo prep.

## Prompt recipes

```
Build the document upload component using shadcn/ui Card, Button, and a drop zone.
Max 5 files, 10 MB each. Show filename, progress bar, and cancel per file.
After upload call /api/extract and display per-file status with Badge.
Layout like Vercel's file-upload pattern. Server Component wrapper, client dropzone.
```

```
Add a sortable, filterable results table using shadcn/ui Table and Badge.
Columns: bank, status (ready/missing/ineligible), missing-docs count, action.
Rows are paginated; click opens an Accordion with the details for that bank.
```
