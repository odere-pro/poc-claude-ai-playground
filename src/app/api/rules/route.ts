import "server-only";

import { type NextRequest } from "next/server";
import { rulesQuerySchema } from "@/lib/schemas";
import { loadRulesForType, listContractTypes } from "@/lib/ruleLoader";

export const runtime = "nodejs";

function jsonError(status: number, message: string): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

/** GET /api/rules?type=nl-hsm&jurisdiction=nl */
export async function GET(req: NextRequest): Promise<Response> {
  const params = Object.fromEntries(req.nextUrl.searchParams.entries());
  const parsed = rulesQuerySchema.safeParse(params);
  if (!parsed.success) {
    return jsonError(400, "Required query params: type, jurisdiction (nl|se)");
  }

  const { type, jurisdiction } = parsed.data;

  try {
    const ruleSet = await loadRulesForType(type, jurisdiction);
    return new Response(JSON.stringify(ruleSet), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("ENOENT") || msg.includes("no such file")) {
      const available = await listContractTypes();
      const ids = available.map((t) => t.id);
      return jsonError(404, `Unknown contract type '${type}'. Available: ${ids.join(", ")}`);
    }
    return jsonError(500, "Failed to load rules");
  }
}
