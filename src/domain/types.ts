export const taskStatuses = ["todo", "in_progress", "done"] as const;
export const taskPriorities = ["low", "medium", "high"] as const;
export const taskRecurrences = ["none", "daily", "weekly", "monthly"] as const;
export const dueFilters = ["all", "overdue", "soon", "none"] as const;

export type TaskStatus = (typeof taskStatuses)[number];
export type TaskPriority = (typeof taskPriorities)[number];
export type TaskRecurrence = (typeof taskRecurrences)[number];
export type DueFilter = (typeof dueFilters)[number];

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
