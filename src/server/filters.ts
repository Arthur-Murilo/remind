import { dueFilters, taskPriorities, taskStatuses, type TaskFilter } from "@/domain/types";

type SearchParamsValue = string | string[] | undefined;

function pickSingle(value: SearchParamsValue) {
  return Array.isArray(value) ? value[0] : value;
}

export function getTaskFilterFromSearchParams(input: Record<string, SearchParamsValue>): TaskFilter {
  const status = pickSingle(input.status);
  const priority = pickSingle(input.priority);
  const due = pickSingle(input.due);
  const projectId = pickSingle(input.projectId);
  const search = pickSingle(input.search)?.trim();

  return {
    projectId: projectId || undefined,
    status: taskStatuses.includes(status as (typeof taskStatuses)[number]) ? (status as TaskFilter["status"]) : "all",
    priority: taskPriorities.includes(priority as (typeof taskPriorities)[number]) ? (priority as TaskFilter["priority"]) : "all",
    due: dueFilters.includes(due as (typeof dueFilters)[number]) ? (due as TaskFilter["due"]) : "all",
    search: search || undefined
  };
}
