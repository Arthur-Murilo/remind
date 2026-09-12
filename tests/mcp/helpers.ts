import { expect, type APIRequestContext, type APIResponse } from "@playwright/test";

export const MCP_TEST_TOKEN = process.env.MCP_API_TOKEN || "mcp-ci-test-token-not-for-production";
export const MCP_PATH = "/api/mcp";
export const UNAUTHORIZED_BODY = { error: "Unauthorized" } as const;

const ACCEPT = "application/json, text/event-stream";

export function mcpHeaders(token?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: ACCEPT,
    "Content-Type": "application/json"
  };

  if (token === undefined) {
    return headers;
  }

  if (token === null) {
    return headers;
  }

  headers.Authorization = `Bearer ${token}`;
  return headers;
}

export async function postMcp(
  request: APIRequestContext,
  body: unknown,
  options?: { token?: string | null; extraHeaders?: Record<string, string> }
): Promise<APIResponse> {
  const headers = {
    ...mcpHeaders(options?.token === undefined ? MCP_TEST_TOKEN : options.token),
    ...options?.extraHeaders
  };

  return request.post(MCP_PATH, { headers, data: body });
}

export async function parseMcpJson(response: APIResponse): Promise<unknown> {
  const contentType = response.headers()["content-type"] || "";
  const text = await response.text();

  if (contentType.includes("text/event-stream")) {
    const dataLines = text
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim())
      .filter((line) => line && line !== "[DONE]");
    const last = dataLines.at(-1);
    if (!last) {
      throw new Error("SSE vazio");
    }
    return JSON.parse(last);
  }

  return JSON.parse(text);
}

export async function mcpInitialize(request: APIRequestContext, token = MCP_TEST_TOKEN) {
  const response = await postMcp(
    request,
    {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2025-03-26",
        capabilities: {},
        clientInfo: { name: "remind-mcp-tests", version: "1.0.0" }
      }
    },
    { token }
  );

  expect(response.status()).not.toBe(401);
  return response;
}

export async function mcpCall(
  request: APIRequestContext,
  name: string,
  args: Record<string, unknown> = {},
  token = MCP_TEST_TOKEN
) {
  const response = await postMcp(
    request,
    {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: { name, arguments: args }
    },
    { token }
  );

  const payload = (await parseMcpJson(response)) as {
    result?: { content?: Array<{ text?: string }>; isError?: boolean };
    error?: { code?: number; message?: string };
  };

  const text = payload.result?.content?.[0]?.text;
  let data: any = null;
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: "invalid_input", message: text };
    }
  }
  return {
    response,
    payload,
    data,
    isError: Boolean(payload.result?.isError),
    rpcError: payload.error ?? null
  };
}

export async function expectUnauthorized(response: APIResponse) {
  expect(response.status()).toBe(401);
  expect(response.headers()["cache-control"]).toBe("no-store");
  expect(await response.json()).toEqual(UNAUTHORIZED_BODY);
}
