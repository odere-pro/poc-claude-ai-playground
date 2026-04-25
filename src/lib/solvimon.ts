/**
 * Thin wrapper around Solvimon's billing API.
 *
 * Soft-fail policy: if Solvimon is down or slow, the user must still be able
 * to analyze their contract. `checkEntitlement` returns `{ allowed: true }`
 * on any error/timeout. `reportUsage` is fire-and-forget.
 *
 * The 3s timeout is intentional — Solvimon should not be on the hot path.
 */

const TIMEOUT_MS = 3_000;
const BASE_URL = "https://api.solvimon.com/v1";

export interface EntitlementResult {
  readonly allowed: boolean;
  /** Where to redirect the user when blocked. Solvimon-issued. */
  readonly checkoutUrl?: string;
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error("solvimon-timeout")), ms);
    promise.then(
      (v) => {
        clearTimeout(t);
        resolve(v);
      },
      (e: unknown) => {
        clearTimeout(t);
        reject(e instanceof Error ? e : new Error(String(e)));
      },
    );
  });
}

export async function checkEntitlement(customerId: string | undefined): Promise<EntitlementResult> {
  // Anonymous flow: spec demo allows one analysis without a customer record.
  if (!customerId) return { allowed: true };

  const apiKey = process.env.SOLVIMON_API_KEY;
  if (!apiKey) {
    // Misconfigured — soft-fail to keep the demo working without billing.
    return { allowed: true };
  }

  try {
    const res = await withTimeout(
      fetch(`${BASE_URL}/entitlements?customerId=${encodeURIComponent(customerId)}`, {
        headers: { Authorization: `Bearer ${apiKey}` },
      }),
      TIMEOUT_MS,
    );
    if (!res.ok) return { allowed: true };
    const body = (await res.json()) as { allowed?: boolean; checkoutUrl?: string };
    return {
      allowed: body.allowed !== false,
      checkoutUrl: body.checkoutUrl,
    };
  } catch {
    // Soft-fail. Logging a warning here would leak customer ids — skip.
    return { allowed: true };
  }
}

export async function reportUsage(customerId: string | undefined): Promise<void> {
  if (!customerId) return;
  const apiKey = process.env.SOLVIMON_API_KEY;
  if (!apiKey) return;

  try {
    await withTimeout(
      fetch(`${BASE_URL}/usage`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ customerId, event: "analysis", quantity: 1 }),
      }),
      TIMEOUT_MS,
    );
  } catch {
    // Fire-and-forget. Usage drift is recoverable.
  }
}

export const __test__ = { TIMEOUT_MS, BASE_URL };
