import { expect, test } from "@playwright/test";

import { createRateLimiter } from "../../src/mcp/rate-limit";
import { MCP_PATH } from "./helpers";

test.describe("MCP rate limit", () => {
  test("permite 60 e bloqueia a 61ª no mesmo minuto (valores literais da spec)", () => {
    let now = 1_000_000;
    const limiter = createRateLimiter({ limit: 60, windowMs: 60_000, now: () => now });

    for (let i = 0; i < 60; i += 1) {
      expect(limiter.consume("10.0.0.1:probe"), `request ${i + 1}`).toEqual({ ok: true });
    }

    const blocked = limiter.consume("10.0.0.1:probe");
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.retryAfterSeconds).toBe(60);
    }

    expect(limiter.consume("10.0.0.1:other-token")).toEqual({ ok: true });

    now += 60_000;
    expect(limiter.consume("10.0.0.1:probe")).toEqual({ ok: true });
  });

  test("HTTP 429 + Retry-After após 60 pedidos no mesmo IP+token", async ({ request }) => {
    const token = "mcp-rate-limit-probe-token";
    let last: Awaited<ReturnType<typeof request.post>> | undefined;

    for (let i = 0; i < 61; i += 1) {
      last = await request.post(MCP_PATH, {
        headers: {
          Accept: "application/json, text/event-stream",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        data: { jsonrpc: "2.0", id: i, method: "ping" }
      });
    }

    expect(last).toBeTruthy();
    expect(last!.status()).toBe(429);
    expect(last!.headers()["retry-after"]).toMatch(/^[0-9]+$/);
    expect(Number(last!.headers()["retry-after"])).toBeGreaterThanOrEqual(1);
    expect(await last!.json()).toEqual({ error: "Too Many Requests" });
  });
});
