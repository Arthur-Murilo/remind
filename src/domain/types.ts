export const taskStatuses = ["todo", "in_progress", "done"] as const;
export const taskPriorities = ["low", "medium", "high"] as const;
export const taskRecurrences = ["none", "daily", "weekly", "monthly"] as const;
export const dueFilters = ["all", "myday", "overdue", "soon", "none"] as const;

export type TaskStatus = string;
export type TaskPriority = string;
export type TaskRecurrence = (typeof taskRecurrences)[number];
export type DueFilter = (typeof dueFilters)[number];
export type TimePeriod = "day" | "week" | "month";
export type WorkSessionSource = "timer" | "manual";

export type CatalogItem = {
  key: string;
  label: string;
  color: string;
  system: boolean;
  id?: string;
  sortOrder?: number;
};

export type WorkSession = {
  id: string;
  taskId: string;
  ownerId: string;
  taskTitle: string;
  projectId: string;
  projectName: string;
  startedAt: string;
  endedAt: string | null;
  durationSeconds: number;
  source: WorkSessionSource;
};

export type User = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

export type Project = {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  taskCount?: number;
  openTaskCount?: number;
};

export type Tag = {
  id: string;
  userId: string;
  name: string;
  color: string;
  createdAt: string;
};

export type Subtask = {
  id: string;
  taskId: string;
  ownerId: string;
  title: string;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Task = {
  id: string;
  projectId: string;
  ownerId: string;
  projectName?: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  recurrence?: TaskRecurrence;
  repeatSubtasks?: boolean;
  tags?: Tag[];
  subtasks?: Subtask[];
  runningSession?: { id: string; startedAt: string } | null;
  totalTrackedSeconds?: number;
  createdAt: string;
  updatedAt: string;
};

export type Reminder = {
  id: string;
  taskId: string;
  userId: string;
  kind: string;
  remindAt: string;
  readAt: string | null;
  taskTitle: string;
  projectName: string;
  dueDate: string | null;
};

export type TaskFilter = {
  projectId?: string;
  status?: TaskStatus | "all";
  priority?: TaskPriority | "all";
  due?: DueFilter;
  search?: string;
};

export type TimeReportFilter = {
  projectId?: string;
  period: TimePeriod;
};
