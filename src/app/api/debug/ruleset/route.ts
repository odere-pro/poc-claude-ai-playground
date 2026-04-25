import "server-only";
import type { NextRequest } from "next/server";
import type { Jurisdiction, Ruleset } from "@/lib/types";

export const runtime = "nodejs";

// Dev-only endpoint used by E2E authenticity-guard tests to verify that
// every citation rendered to the user references a real article in the
// loaded ruleset. Disabled in production to avoid leaking the full
// ruleset to clients.

export async function GET(req: NextRequest): Promise<Response> {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "Not found." }, { status: 404 });
  }

  const url = new URL(req.url);
  const jurisdiction: Jurisdiction = url.searchParams.get("jurisdiction") === "se" ? "se" : "nl";

  const mod =
    jurisdiction === "se"
      ? await import("@/../data/se-labor-law.json")
      : await import("@/../data/nl-labor-law.json");
  const ruleset = mod.default as unknown as Ruleset;
  return Response.json(ruleset);
}
