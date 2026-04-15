# Backend Guide

API routes, model calls, data shape, persistence. Server-side only.

## Stack

- Next.js API routes (App Router — `route.ts`)
- Anthropic SDK (provider-abstracted in `src/lib/anthropic.ts`)
- Optional: AWS SDK (S3, DynamoDB) for persistence extensions
- zod for boundary validation (add when first needed)

## Route responsibilities

| Route               | Purpose                                             | Latency target                     |
| ------------------- | --------------------------------------------------- | ---------------------------------- |
| `POST /api/extract` | file(s) → `ExtractedDocument[]`                     | < 8 s (Vercel free) / < 60 s (Pro) |
| `POST /api/match`   | `ExtractedDocument[]` + user opts → `MatchResult[]` | < 1 s (pure local logic)           |

Keep routes thin. Business logic lives in `src/lib/*`. Routes validate input, call lib, wrap response.

## Model client (`src/lib/anthropic.ts`)

- Single instance, `MODEL = "claude-sonnet-4-5"` constant.
- `ANTHROPIC_BEDROCK=true` switches to Bedrock (same interface).
- Never log prompts or responses that contain user doc content.
- Set `max_tokens` tight (4k for extraction, 1k for classification) to stay under function timeouts.

## Extraction prompt pattern

Use structured output (JSON mode / tool use) — not free-form. Example contract in a single call:

```
input: one PDF page or image
output: { type: DocumentType, fields: Record<string, string|number|boolean>, confidence: number }
```

For multi-page PDFs, split pages client-side or on a worker before the call; don't send full PDFs if they exceed ~5 pages.

## Matching engine (`src/lib/matching.ts`)

Already implemented. Pure function `matchBank(rules, docs, opts) → MatchResult`. No IO, no model calls. Deterministic.

Extend by:

1. Adding new fields to `BankRules` in `src/lib/types.ts`.
2. Updating `data/bank-rules/*.json` to populate them.
3. Teaching `matchBank` how to consume the new field.

## Data contracts

Shared types in `src/lib/types.ts`:

- `BankRules` — one per bank, loaded from `data/bank-rules/*.json`
- `ExtractedDocument` — output of `/api/extract`
- `MatchResult` — output of `/api/match` (per bank)

If you change a shape, update the type first. The compiler will walk you through remaining fixups.

## Errors

- Throw typed errors from `src/lib/*` (`class ExtractionError extends Error { name = "ExtractionError" }`).
- Routes translate errors to HTTP status codes — never leak stack traces to the client.
- Every user-visible error is logged with a correlation id, not the input.

## Rate limiting

- Add a simple in-memory limiter (per IP, per minute) on `/api/extract`. Swap to Upstash Redis if you deploy behind shared infrastructure.
- Return `429` with `Retry-After` on breach.

## Persistence (optional, AWS path)

- S3: store raw documents only if the user opts in. Bucket is private, SSE-S3 on, 30-day lifecycle.
- DynamoDB: `user_id#timestamp` → match result JSON. TTL 30 days.
- All keys & credentials via environment variables.

## Observability

- Sentry `@sentry/nextjs` if `SENTRY_DSN` is set. Initialize in `instrumentation.ts`.
- Log structured JSON to stdout: `{ ts, level, event, correlation_id }`. Vercel pipes to its log UI; Sentry catches unhandled errors.

## Testing

- Unit test `matching.ts` with plain `node --test` or vitest (add when introducing the first unit test).
- Integration test routes via Playwright fixtures that POST against `http://localhost:3000/api/*`.

## Prompt recipes

```
Implement POST /api/extract. Accept multipart/form-data with up to 5 files (PDF/PNG/JPEG).
Validate MIME and size. For each file, call the Anthropic client with a structured-output
prompt that returns { type, fields, confidence }. Aggregate into ExtractedDocument[].
Return 200 + JSON on success, 4xx on validation, 5xx on model error. No logging of file
contents. Stub model call behind src/lib/extract.ts so tests can mock.
```

```
Implement POST /api/match. Body: { documents: ExtractedDocument[], permit?, employed?, nonEu? }.
Load all JSON files from data/bank-rules/, map each through matchBank(). Return MatchResult[].
Validate body with zod. Correlation id header on every response.
```
