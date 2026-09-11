import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

import type { User } from "@/domain/types";
import {
  createSubtask,
  createTask,
  getProjectById,
  getTasks,
  getTimeReport,
  isAllowedPriority,
  isAllowedStatus
} from "@/server/remind-service";
import { invalidInputResult, jsonToolResult, notFoundResult } from "@/mcp/errors";
import {
  createSubtaskSchema,
  createTaskSchema,
  getTimeReportSchema,
  listTasksSchema,
  MCP_LIST_LIMIT_DEFAULT
} from "@/mcp/schemas";

const TOOL_NAMES = ["list_tasks", "create_task", "create_subtask", "get_time_report"] as const;

export const MCP_TOOL_NAMES: readonly string[] = TOOL_NAMES;

function parseArgs<T>(schema: { safeParse: (data: unknown) => { success: true; data: T } | { success: false } }, args: unknown) {
  return schema.safeParse(args);
}

export function createRemindMcpServer(user: User): McpServer {
  const server = new McpServer({
    name: "remind",
    version: "0.1.0"
  });

  server.registerTool(
    "list_tasks",
    {
      title: "Listar tarefas",
      description:
        "Lista um resumo das tarefas do dono. Opcionalmente filtra por Meu dia, projeto, status e busca. Não lista tarefas de outros usuários.",
      inputSchema: listTasksSchema
    },
    async (args) => {
      const parsed = parseArgs(listTasksSchema, args);
      if (!parsed.success) return invalidInputResult();

      const { myday, projectId, status, search, limit } = parsed.data;
      const tasks = await getTasks(user.id, {
        projectId,
        status,
        search,
        due: myday ? "myday" : undefined
      });

      const capped = tasks.slice(0, limit ?? MCP_LIST_LIMIT_DEFAULT).map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate,
        projectId: task.projectId,
        projectName: task.projectName,
        subtaskCount: task.subtasks?.length ?? 0
      }));

      return jsonToolResult({ count: capped.length, tasks: capped });
    }
  );

  server.registerTool(
    "create_task",
    {
      title: "Criar tarefa",
      description:
        "Cria uma Tarefa no projeto informado. projectId deve ser um projeto do dono. Escritas são diretas, sem confirmação.",
      inputSchema: createTaskSchema
    },
    async (args) => {
      const parsed = parseArgs(createTaskSchema, args);
      if (!parsed.success) return invalidInputResult();

      const input = parsed.data;
      const status = input.status ?? "todo";
      const priority = input.priority ?? "medium";

      if (!(await isAllowedStatus(user.id, status)) || !(await isAllowedPriority(user.id, priority))) {
        return invalidInputResult();
      }

      const task = await createTask({
        userId: user.id,
        projectId: input.projectId,
        title: input.title,
        description: input.description,
        status,
        priority,
        dueDate: input.dueDate ?? null
      });

      if (!task) {
        return notFoundResult("Projeto não encontrado.");
      }

      return jsonToolResult({
        id: task.id,
        projectId: task.projectId,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate
      });
    }
  );

  server.registerTool(
    "create_subtask",
    {
      title: "Criar subtarefa",
      description:
        "Cria uma Subtarefa de um único nível ligada a uma Tarefa do dono. Escritas são diretas, sem confirmação.",
      inputSchema: createSubtaskSchema
    },
    async (args) => {
      const parsed = parseArgs(createSubtaskSchema, args);
      if (!parsed.success) return invalidInputResult();

      const subtask = await createSubtask(user.id, parsed.data.taskId, parsed.data.title);
      if (!subtask) {
        return notFoundResult("Tarefa não encontrada.");
      }

      return jsonToolResult({
        id: subtask.id,
        taskId: subtask.taskId,
        title: subtask.title,
        completed: subtask.completed
      });
    }
  );

  server.registerTool(
    "get_time_report",
    {
      title: "Relatório de tempo",
      description:
        "Totais e breakdown de sessões de trabalho no período (dia, semana ou mês), opcionalmente filtrado por projeto.",
      inputSchema: getTimeReportSchema
    },
    async (args) => {
      const parsed = parseArgs(getTimeReportSchema, args);
      if (!parsed.success) return invalidInputResult();

      if (parsed.data.projectId) {
        const project = await getProjectById(user.id, parsed.data.projectId);
        if (!project) {
          return notFoundResult("Projeto não encontrado.");
        }
      }

      const report = await getTimeReport(user.id, {
        period: parsed.data.period,
        projectId: parsed.data.projectId
      });

      return jsonToolResult({
        period: report.period,
        from: report.from,
        to: report.to,
        totalSeconds: report.totalSeconds,
        projects: report.projects,
        tasks: report.tasks
      });
    }
  );

  return server;
}

export async function handleMcpTransport(
  request: Request,
  user: User,
  parsedBody?: unknown
): Promise<Response> {
  const server = createRemindMcpServer(user);
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true
  });

  await server.connect(transport);

  try {
    const response = await transport.handleRequest(
      request,
      parsedBody === undefined ? undefined : { parsedBody }
    );
    const headers = new Headers(response.headers);
    headers.set("Cache-Control", "no-store");
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers
    });
  } finally {
    await transport.close();
    await server.close();
  }
}
