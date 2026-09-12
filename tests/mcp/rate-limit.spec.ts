import { expect, test } from "@playwright/test";

import { createRateLimiter } from "../../src/mcp/rate-limit";

test.describe("MCP rate limit", () => {
  test("permite 60 e bloqueia a 61ª no mesmo IP no mesmo minuto (valores literais da spec)", () => {
    let now = 1_000_000;
    const limiter = createRateLimiter({ limit: 60, windowMs: 60_000, now: () => now });

    for (let i = 0; i < 60; i += 1) {
      expect(limiter.consume("10.0.0.1"), `request ${i + 1}`).toEqual({ ok: true });
    }

    const blocked = limiter.consume("10.0.0.1");
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) {
      expect(blocked.retryAfterSeconds).toBe(60);
    }

    expect(limiter.consume("10.0.0.2")).toEqual({ ok: true });

    now += 60_000;
    expect(limiter.consume("10.0.0.1")).toEqual({ ok: true });
  });
});
