import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { checkEntitlement, reportUsage } from "./solvimon";

describe("checkEntitlement", () => {
  const originalKey = process.env.SOLVIMON_API_KEY;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.SOLVIMON_API_KEY = "test-key";
  });

  afterEach(() => {
    process.env.SOLVIMON_API_KEY = originalKey;
  });

  it("returns allowed: true when no customerId is given (anonymous flow)", async () => {
    const result = await checkEntitlement(undefined);
    expect(result.allowed).toBe(true);
  });

  it("returns allowed: true when SOLVIMON_API_KEY is missing", async () => {
    process.env.SOLVIMON_API_KEY = "";
    const result = await checkEntitlement("cus_1");
    expect(result.allowed).toBe(true);
  });

  it("returns allowed: false when Solvimon explicitly denies", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ allowed: false, checkoutUrl: "https://pay.example/x" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    const result = await checkEntitlement("cus_1");
    expect(result.allowed).toBe(false);
    expect(result.checkoutUrl).toBe("https://pay.example/x");
  });

  it("soft-fails to allowed: true on network error", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNRESET")));
    const result = await checkEntitlement("cus_1");
    expect(result.allowed).toBe(true);
  });

  it("soft-fails to allowed: true on non-2xx HTTP status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("", { status: 502 })));
    const result = await checkEntitlement("cus_1");
    expect(result.allowed).toBe(true);
  });

  it("denies when Solvimon returns allowed: null (only explicit true grants)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ allowed: null }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    const result = await checkEntitlement("cus_1");
    expect(result.allowed).toBe(false);
  });

  it("denies when Solvimon omits the allowed field entirely", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({}), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      ),
    );
    const result = await checkEntitlement("cus_1");
    expect(result.allowed).toBe(false);
  });
});

describe("reportUsage", () => {
  const originalKey = process.env.SOLVIMON_API_KEY;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.SOLVIMON_API_KEY = "test-key";
  });

  afterEach(() => {
    process.env.SOLVIMON_API_KEY = originalKey;
  });

  it("posts a usage event when customerId is present", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("", { status: 204 }));
    vi.stubGlobal("fetch", fetchMock);
    await reportUsage("cus_1");
    expect(fetchMock).toHaveBeenCalledOnce();
    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe("POST");
    expect(JSON.parse(init.body as string)).toMatchObject({
      customerId: "cus_1",
      event: "analysis",
    });
  });

  it("is a no-op without customerId", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await reportUsage(undefined);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("does not throw on network failure", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("boom")));
    await expect(reportUsage("cus_1")).resolves.toBeUndefined();
  });
});
