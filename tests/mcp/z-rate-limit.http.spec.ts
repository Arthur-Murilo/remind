import { expect, test } from "@playwright/test";

import { MCP_PATH } from "./helpers";

// Arquivo z-* para rodar depois dos demais contratos MCP: este teste satura o
// bucket in-memory por IP do processo Next.js.
test.describe("MCP rate limit HTTP (pré-auth por IP)", () => {
  test("tokens errados distintos no mesmo IP ainda tomam 429", async ({ request }) => {
    let last: Awaited<ReturnType<typeof request.post>> | undefined;

    for (let i = 0; i < 61; i += 1) {
      last = await request.post(MCP_PATH, {
        headers: {
          Accept: "application/json, text/event-stream",
          "Content-Type": "application/json",
          Authorization: `Bearer mcp-wrong-rotated-${i}`
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
