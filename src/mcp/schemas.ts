import { z } from "zod";

export const MCP_TITLE_MAX = 200;
export const MCP_DESCRIPTION_MAX = 5000;
export const MCP_SEARCH_MAX = 200;
export const MCP_STATUS_PRIORITY_MAX = 64;
export const MCP_LIST_LIMIT_DEFAULT = 50;
export const MCP_LIST_LIMIT_MAX = 100;

const uuid = z.string().uuid();
const dueDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const title = z.string().trim().min(1).max(MCP_TITLE_MAX);
const statusOrPriority = z.string().trim().min(1).max(MCP_STATUS_PRIORITY_MAX);

export const listTasksSchema = z
  .object({
    myday: z.boolean().optional(),
    projectId: uuid.optional(),
    status: statusOrPriority.optional(),
    search: z.string().trim().min(1).max(MCP_SEARCH_MAX).optional(),
    limit: z.number().int().min(1).max(MCP_LIST_LIMIT_MAX).optional()
  })
  .strict();

export const createTaskSchema = z
  .object({
    projectId: uuid,
    title,
    description: z.string().max(MCP_DESCRIPTION_MAX).optional(),
    priority: statusOrPriority.optional(),
    status: statusOrPriority.optional(),
    dueDate: dueDate.optional()
  })
  .strict();

export const createSubtaskSchema = z
  .object({
    taskId: uuid,
    title
  })
  .strict();

export const getTimeReportSchema = z
  .object({
    period: z.enum(["day", "week", "month"]),
    projectId: uuid.optional()
  })
  .strict();

export type ListTasksInput = z.infer<typeof listTasksSchema>;
export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type CreateSubtaskInput = z.infer<typeof createSubtaskSchema>;
export type GetTimeReportInput = z.infer<typeof getTimeReportSchema>;
