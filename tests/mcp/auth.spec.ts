import { expect, test } from "@playwright/test";

import { extractBearerToken, tokensMatch } from "../../src/mcp/auth";
import { expectUnauthorized, mcpInitialize, MCP_PATH, postMcp } from "./helpers";

test.describe("MCP auth", () => {
  test("compara tokens por digestos SHA-256 de 32 bytes e não lança em tamanhos diferentes", () => {
    expect(tokensMatch("mcp-ci-test-token-not-for-production", "mcp-ci-test-token-not-for-production")).toBe(true);
    expect(tokensMatch("abc", "xyz")).toBe(false);
    expect(() => tokensMatch("short", "a-much-longer-token")).not.toThrow();
    expect(tokensMatch("short", "a-much-longer-token")).toBe(false);
    expect(tokensMatch("", "secret")).toBe(false);
  });

  test("extractBearerToken só aceita o esquema Bearer com token não vazio", () => {
    expect(extractBearerToken(null)).toBeNull();
    expect(extractBearerToken("Basic abc")).toBeNull();
    expect(extractBearerToken("Bearer")).toBeNull();
    expect(extractBearerToken("Bearer ")).toBeNull();
    expect(extractBearerToken("Bearer   ")).toBeNull();
    expect(extractBearerToken("Token secret")).toBeNull();
    expect(extractBearerToken("Bearer secret-value")).toBe("secret-value");
  });

  test("header ausente → 401 genérico", async ({ request }) => {
    const response = await postMcp(request, { jsonrpc: "2.0", id: 1, method: "initialize", params: {} }, { token: null });
    await expectUnauthorized(response);
  });

  test("Bearer malformado → 401 genérico", async ({ request }) => {
    const response = await request.post(MCP_PATH, {
      headers: {
        Accept: "application/json, text/event-stream",
        "Content-Type": "application/json",
        Authorization: "Basic not-a-bearer"
      },
      data: { jsonrpc: "2.0", id: 1, method: "ping" }
    });
    await expectUnauthorized(response);
  });

  test("Bearer vazio → 401 genérico", async ({ request }) => {
    const response = await request.post(MCP_PATH, {
      headers: {
        Accept: "application/json, text/event-stream",
        "Content-Type": "application/json",
        Authorization: "Bearer "
      },
      data: { jsonrpc: "2.0", id: 1, method: "ping" }
    });
    await expectUnauthorized(response);
  });

  test("token curto → 401 genérico", async ({ request }) => {
    const response = await postMcp(request, { jsonrpc: "2.0", id: 1, method: "ping" }, { token: "x" });
    await expectUnauthorized(response);
  });

  test("token longo errado → 401 genérico", async ({ request }) => {
    const response = await postMcp(
      request,
      { jsonrpc: "2.0", id: 1, method: "ping" },
      { token: "x".repeat(400) }
    );
    await expectUnauthorized(response);
  });

  test("token errado → 401 genérico", async ({ request }) => {
    const response = await postMcp(
      request,
      { jsonrpc: "2.0", id: 1, method: "ping" },
      { token: "mcp-wrong-token-not-for-production" }
    );
    await expectUnauthorized(response);
  });

  test("token na query string não autentica", async ({ request }) => {
    const response = await request.post(`${MCP_PATH}?token=mcp-ci-test-token-not-for-production`, {
      headers: {
        Accept: "application/json, text/event-stream",
        "Content-Type": "application/json"
      },
      data: { jsonrpc: "2.0", id: 1, method: "initialize", params: {} }
    });
    await expectUnauthorized(response);
  });

  test("token correto passa da auth (não 401)", async ({ request }) => {
    const response = await mcpInitialize(request);
    expect(response.status()).toBe(200);
    expect(response.headers()["cache-control"]).toBe("no-store");
  });
});
