import "server-only";
import type { NextRequest } from "next/server";

// In-memory token bucket per IP. Sufficient for single-instance demo.
// Production should swap this for Upstash Redis or Vercel KV — multiple
// Vercel function instances do not share this map.

interface Bucket {
  tokens: number;
  lastRefill: number;
}

interface Limit {
  readonly capacity: number;
  readonly refillPerSec: number;
}

const buckets = new Map<string, Bucket>();

function clientIp(req: NextRequest): string {
  // Prefer `x-real-ip` (Vercel sets this to the actual client). Fall
  // back to the LAST entry in `x-forwarded-for` — the platform appends
  // the real IP last, while earlier entries are client-controlled and
  // trivially spoofable.
  const real = req.headers.get("x-real-ip");
  if (real) return real.trim();
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const parts = forwarded.split(",");
    return parts[parts.length - 1].trim();
  }
  return "anonymous";
}

export function rateLimit(req: NextRequest, key: string, limit: Limit): boolean {
  const id = `${key}:${clientIp(req)}`;
  const now = Date.now();
  let bucket = buckets.get(id);
  if (!bucket) {
    bucket = { tokens: limit.capacity, lastRefill: now };
    buckets.set(id, bucket);
  } else {
    const elapsed = (now - bucket.lastRefill) / 1000;
    bucket.tokens = Math.min(limit.capacity, bucket.tokens + elapsed * limit.refillPerSec);
    bucket.lastRefill = now;
  }
  if (bucket.tokens < 1) return false;
  bucket.tokens -= 1;
  return true;
}

// Sweep stale buckets every 5 minutes to bound memory.
const SWEEP_INTERVAL_MS = 5 * 60_000;
const STALE_THRESHOLD_MS = 30 * 60_000;

if (typeof globalThis.setInterval === "function") {
  setInterval(() => {
    const now = Date.now();
    for (const [id, b] of buckets) {
      if (now - b.lastRefill > STALE_THRESHOLD_MS) buckets.delete(id);
    }
  }, SWEEP_INTERVAL_MS).unref?.();
}
