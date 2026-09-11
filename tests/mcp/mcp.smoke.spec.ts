import { expect, test } from "@playwright/test";

import { MCP_MAX_BODY_BYTES } from "../../src/mcp/errors";
import { mcpCall, mcpHeaders, mcpInitialize, MCP_PATH, parseMcpJson, postMcp } from "./helpers";

test.describe("MCP smoke", () => {
  test("initialize Streamable HTTP e lista só as quatro tools", async ({ request }) => {
    const init = await mcpInitialize(request);
    expect(init.status()).toBe(200);
    const initPayload = (await parseMcpJson(init)) as {
      result?: { serverInfo?: { name?: string }; capabilities?: { tools?: unknown } };
    };
    expect(initPayload.result?.serverInfo?.name).toBe("remind");
    expect(initPayload.result?.capabilities).toHaveProperty("tools");

    const listed = await postMcp(request, { jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
    expect(listed.status()).toBe(200);
    const toolsPayload = (await parseMcpJson(listed)) as { result?: { tools?: Array<{ name: string }> } };
    const names = (toolsPayload.result?.tools ?? []).map((tool) => tool.name);
    expect(names).toHaveLength(4);
    expect(names.sort()).toEqual(["create_subtask", "create_task", "get_time_report", "list_tasks"]);
  });

  test("list_tasks e get_time_report respondem autenticados com Cache-Control no-store", async ({ request }) => {
    const tasks = await mcpCall(request, "list_tasks", { myday: false, limit: 5 });
    expect(tasks.response.status()).toBe(200);
    expect(tasks.response.headers()["cache-control"]).toBe("no-store");
    expect(tasks.isError).toBe(false);

    const report = await mcpCall(request, "get_time_report", { period: "day" });
    expect(report.response.status()).toBe(200);
    expect(report.data.period).toBe("day");
    expect(typeof report.data.totalSeconds).toBe("number");
  });

  test("corpo acima de 64 KiB é recusado com 413", async ({ request }) => {
    expect(MCP_MAX_BODY_BYTES).toBe(65536);
    const response = await request.post(MCP_PATH, {
      headers: {
        ...mcpHeaders(),
        "Content-Length": String(MCP_MAX_BODY_BYTES + 1)
      },
      data: "x".repeat(MCP_MAX_BODY_BYTES + 1)
    });
    expect(response.status()).toBe(413);
    expect(await response.json()).toEqual({ error: "Payload Too Large" });
  });
});
