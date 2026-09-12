import { expect, test } from "@playwright/test";

import {
  createSubtaskSchema,
  createTaskSchema,
  getTimeReportSchema,
  listTasksSchema,
  MCP_DESCRIPTION_MAX,
  MCP_LIST_LIMIT_DEFAULT,
  MCP_LIST_LIMIT_MAX,
  MCP_SEARCH_MAX,
  MCP_TITLE_MAX
} from "../../src/mcp/schemas";
import { mcpCall, mcpInitialize, parseMcpJson, postMcp } from "./helpers";

const PROJECT_ID = "11111111-1111-4111-8111-111111111111";
const TASK_ID = "22222222-2222-4222-8222-222222222222";

test.describe("MCP schemas", () => {
  test("list_tasks: default/max de limit e rejeita chaves desconhecidas", () => {
    expect(listTasksSchema.parse({}).limit).toBeUndefined();
    expect(MCP_LIST_LIMIT_DEFAULT).toBe(50);
    expect(MCP_LIST_LIMIT_MAX).toBe(100);
    expect(listTasksSchema.parse({ limit: 100 }).limit).toBe(100);
    expect(listTasksSchema.safeParse({ limit: 101 }).success).toBe(false);
    expect(listTasksSchema.safeParse({ foo: true }).success).toBe(false);
    expect(listTasksSchema.safeParse({ search: "a".repeat(MCP_SEARCH_MAX + 1) }).success).toBe(false);
    expect(listTasksSchema.safeParse({ search: "a".repeat(MCP_SEARCH_MAX) }).success).toBe(true);
  });

  test("create_task: título 1..200, descrição ≤5000, dueDate YYYY-MM-DD, strict", () => {
    expect(MCP_TITLE_MAX).toBe(200);
    expect(MCP_DESCRIPTION_MAX).toBe(5000);
    expect(createTaskSchema.safeParse({ projectId: PROJECT_ID, title: "" }).success).toBe(false);
    expect(createTaskSchema.safeParse({ projectId: PROJECT_ID, title: "a".repeat(201) }).success).toBe(false);
    expect(createTaskSchema.safeParse({ projectId: PROJECT_ID, title: "Ok" }).success).toBe(true);
    expect(
      createTaskSchema.safeParse({
        projectId: PROJECT_ID,
        title: "Ok",
        description: "d".repeat(5001)
      }).success
    ).toBe(false);
    expect(createTaskSchema.safeParse({ projectId: PROJECT_ID, title: "Ok", dueDate: "2026-09-11" }).success).toBe(true);
    expect(createTaskSchema.safeParse({ projectId: PROJECT_ID, title: "Ok", dueDate: "11/09/2026" }).success).toBe(false);
    expect(createTaskSchema.safeParse({ projectId: PROJECT_ID, title: "Ok", extra: 1 }).success).toBe(false);
    expect(createTaskSchema.safeParse({ projectId: "not-a-uuid", title: "Ok" }).success).toBe(false);
  });

  test("create_subtask e get_time_report rejeitam chaves extras e enums inválidos", () => {
    expect(createSubtaskSchema.safeParse({ taskId: TASK_ID, title: "Passo" }).success).toBe(true);
    expect(createSubtaskSchema.safeParse({ taskId: TASK_ID, title: "Passo", note: "x" }).success).toBe(false);
    expect(getTimeReportSchema.safeParse({ period: "week" }).success).toBe(true);
    expect(getTimeReportSchema.safeParse({ period: "year" }).success).toBe(false);
    expect(getTimeReportSchema.safeParse({ period: "day", projectId: PROJECT_ID, extra: true }).success).toBe(false);
  });
});

test.describe("MCP tools via HTTP", () => {
  test("tools/list expõe exatamente as quatro tools fechadas", async ({ request }) => {
    await mcpInitialize(request);
    const response = await postMcp(request, {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
      params: {}
    });
    expect(response.status()).toBe(200);
    const payload = (await parseMcpJson(response)) as { result?: { tools?: Array<{ name: string }> } };
    const names = (payload.result?.tools ?? []).map((tool) => tool.name).sort();
    expect(names).toEqual(["create_subtask", "create_task", "get_time_report", "list_tasks"]);
  });

  test("list_tasks devolve resumo das tarefas do dono", async ({ request }) => {
    const { response, data, isError } = await mcpCall(request, "list_tasks", { limit: 50 });
    expect(response.status()).toBe(200);
    expect(isError).toBe(false);
    expect(data).toEqual(
      expect.objectContaining({
        count: expect.any(Number),
        tasks: expect.any(Array)
      })
    );
    expect(data.count).toBeLessThanOrEqual(50);
    if (data.tasks.length > 0) {
      expect(data.tasks[0]).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          title: expect.any(String),
          status: expect.any(String),
          priority: expect.any(String),
          projectId: expect.any(String)
        })
      );
      expect(data.tasks[0]).not.toHaveProperty("description");
    }
  });

  test("create_task e create_subtask persistem; projeto/tarefa alheios viram not_found", async ({ request }) => {
    const listed = await mcpCall(request, "list_tasks", { limit: 1 });
    expect(listed.data.tasks.length).toBeGreaterThan(0);
    const projectId = listed.data.tasks[0].projectId as string;
    const title = `Tarefa MCP ${Date.now()}`;

    const created = await mcpCall(request, "create_task", {
      projectId,
      title,
      description: "Criada via MCP",
      dueDate: "2026-09-11"
    });
    expect(created.isError).toBe(false);
    expect(created.data.title).toBe(title);
    expect(created.data.projectId).toBe(projectId);
    expect(created.data.status).toBe("todo");
    expect(created.data.priority).toBe("medium");

    const missingProject = await mcpCall(request, "create_task", {
      projectId: PROJECT_ID,
      title: "Não deve existir"
    });
    expect(missingProject.isError).toBe(true);
    expect(missingProject.data).toEqual({
      error: "not_found",
      message: "Projeto não encontrado."
    });

    const subtaskTitle = `Subtarefa MCP ${Date.now()}`;
    const sub = await mcpCall(request, "create_subtask", {
      taskId: created.data.id,
      title: subtaskTitle
    });
    expect(sub.isError).toBe(false);
    expect(sub.data.title).toBe(subtaskTitle);
    expect(sub.data.taskId).toBe(created.data.id);
    expect(sub.data.completed).toBe(false);

    const missingTask = await mcpCall(request, "create_subtask", {
      taskId: TASK_ID,
      title: "Órfã"
    });
    expect(missingTask.isError).toBe(true);
    expect(missingTask.data).toEqual({
      error: "not_found",
      message: "Tarefa não encontrada."
    });
  });

  test("create_task rejeita chaves desconhecidas e título acima de 200", async ({ request }) => {
    const listed = await mcpCall(request, "list_tasks", { limit: 1 });
    const projectId = listed.data.tasks[0].projectId as string;

    const extraKey = await mcpCall(request, "create_task", {
      projectId,
      title: "Inválida",
      unknownField: "nope"
    });
    expect(extraKey.isError || extraKey.rpcError).toBeTruthy();
    if (extraKey.isError) {
      expect(extraKey.data.error).toBe("invalid_input");
    }

    const longTitle = await mcpCall(request, "create_task", {
      projectId,
      title: "a".repeat(201)
    });
    expect(longTitle.isError || longTitle.rpcError).toBeTruthy();
    if (longTitle.isError) {
      expect(longTitle.data.error).toBe("invalid_input");
    }
  });

  test("get_time_report devolve totais e breakdown do período", async ({ request }) => {
    const { response, data, isError } = await mcpCall(request, "get_time_report", { period: "week" });
    expect(response.status()).toBe(200);
    expect(isError).toBe(false);
    expect(data).toEqual(
      expect.objectContaining({
        period: "week",
        totalSeconds: expect.any(Number),
        projects: expect.any(Array),
        tasks: expect.any(Array)
      })
    );
    expect(data).not.toHaveProperty("sessions");
  });
});
