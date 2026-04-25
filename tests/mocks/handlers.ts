import { http, HttpResponse } from "msw";
import { mockClaudeAnalyzeStream } from "./mock-stream";

// Default MSW handlers for integration tests. Override per-suite via
// `server.use(...)` to simulate Solvimon outages, Anthropic errors, etc.

export const handlers = [
  // Anthropic Messages API — streaming. Each handler returns a fresh stream.
  http.post("https://api.anthropic.com/v1/messages", () =>
    HttpResponse.text(mockClaudeAnalyzeStream(), {
      headers: { "Content-Type": "text/event-stream" },
    }),
  ),

  // Solvimon entitlement check — happy path.
  http.get("https://test.api.solvimon.com/v1/customers/:customerId/entitlements", () =>
    HttpResponse.json({
      entitlements: [{ reference: "analyses_completed", remaining: 10 }],
    }),
  ),

  // Solvimon usage report — happy path.
  http.post("https://test.api.solvimon.com/v1/usage-events", () => HttpResponse.json({ ok: true })),
];
