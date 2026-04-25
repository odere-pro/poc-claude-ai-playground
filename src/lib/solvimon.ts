// Solvimon billing client. 3 s timeout on every call. Callers MUST treat
// failures as soft-fail — never let a Solvimon outage stall analysis.

import "server-only";

const BASE = "https://test.api.solvimon.com";
const TIMEOUT_MS = 3000;
const ENTITLEMENT_REFERENCE = "analyses_completed";

interface EntitlementResponse {
  readonly entitlements?: ReadonlyArray<{
    readonly reference: string;
    readonly remaining: number;
  }>;
}

function headers(): HeadersInit {
  const apiKey = process.env.SOLVIMON_API_KEY ?? "";
  return {
    "X-API-KEY": apiKey,
    "Content-Type": "application/json",
  };
}

export async function checkEntitlement(customerId: string): Promise<boolean> {
  const res = await fetch(`${BASE}/v1/customers/${encodeURIComponent(customerId)}/entitlements`, {
    headers: headers(),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (!res.ok) {
    throw new Error(`Solvimon entitlement check failed: ${res.status}`);
  }
  const data = (await res.json()) as EntitlementResponse;
  const feature = data.entitlements?.find((e) => e.reference === ENTITLEMENT_REFERENCE);
  return feature ? feature.remaining > 0 : true;
}

export async function reportUsage(customerId: string): Promise<void> {
  const res = await fetch(`${BASE}/v1/usage-events`, {
    method: "POST",
    headers: headers(),
    signal: AbortSignal.timeout(TIMEOUT_MS),
    body: JSON.stringify({
      customer_id: customerId,
      meter_reference: ENTITLEMENT_REFERENCE,
      properties: { task_type: "contract_analysis" },
      quantity: 1,
      timestamp: new Date().toISOString(),
    }),
  });
  if (!res.ok) {
    throw new Error(`Solvimon usage report failed: ${res.status}`);
  }
}
