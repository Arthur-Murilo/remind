import { randomUUID } from "node:crypto";

import type { Project, Reminder, Task, TaskFilter, TaskPriority, TaskRecurrence, TaskStatus } from "@/domain/types";
import { db } from "@/lib/db";

type DashboardMetrics = {
  totalProjects: number;
  openTasks: number;
  dueSoon: number;
  overdue: number;
};

export async function getDashboardMetrics(userId: string): Promise<DashboardMetrics> {
  const sql = db();
  const [projectRow] = await sql<{ count: number }[]>`
    select count(*)::int as count
    from projects
    where owner_id = ${userId}
  `;

  const [openRow] = await sql<{ count: number }[]>`
    select count(*)::int as count
    from tasks
    where owner_id = ${userId}
      and status <> 'done'
  `;

  const [soonRow] = await sql<{ count: number }[]>`
    select count(*)::int as count
    from tasks
    where owner_id = ${userId}
      and status <> 'done'
      and due_date is not null
      and due_date between current_date and current_date + interval '3 day'
  `;

  const [overdueRow] = await sql<{ count: number }[]>`
    select count(*)::int as count
    from tasks
    where owner_id = ${userId}
      and status <> 'done'
      and due_date is not null
      and due_date < current_date
  `;

  return {
    totalProjects: projectRow?.count ?? 0,
    openTasks: openRow?.count ?? 0,
    dueSoon: soonRow?.count ?? 0,
    overdue: overdueRow?.count ?? 0
  };
}

export async function getProjects(userId: string): Promise<Project[]> {
  const sql = db();
  return sql<Project[]>`
    select
      p.id,
      p.owner_id as "ownerId",
      p.name,
      p.description,
      p.status,
      p.created_at as "createdAt",
      p.updated_at as "updatedAt",
      count(t.id)::int as "taskCount",
      count(*) filter (where t.status <> 'done')::int as "openTaskCount"
    from projects p
    left join tasks t on t.project_id = p.id
    where p.owner_id = ${userId}
    group by p.id
    order by p.updated_at desc, p.name asc
  `;
}

export async function getProjectById(userId: string, projectId: string): Promise<Project | null> {
  const sql = db();
  const rows = await sql<Project[]>`
    select
      p.id,
      p.owner_id as "ownerId",
      p.name,
      p.description,
      p.status,
      p.created_at as "createdAt",
      p.updated_at as "updatedAt"
    from projects p
    where p.owner_id = ${userId}
      and p.id = ${projectId}
    limit 1
  `;

  return rows[0] ?? null;
}

export async function getTasks(userId: string, filter: TaskFilter = {}): Promise<Task[]> {
  const sql = db();
  const values: Array<string> = [userId];
  const conditions = ["t.owner_id = $1"];

  if (filter.projectId) {
    values.push(filter.projectId);
    conditions.push(`t.project_id = $${values.length}`);
  }

  if (filter.status && filter.status !== "all") {
    values.push(filter.status);
    conditions.push(`t.status = $${values.length}`);
  }

  if (filter.priority && filter.priority !== "all") {
    values.push(filter.priority);
    conditions.push(`t.priority = $${values.length}`);
  }

  if (filter.search) {
    values.push(`%${filter.search}%`);
    const index = values.length;
    conditions.push(`(
      t.title ilike $${index}
      or coalesce(t.description, '') ilike $${index}
      or p.name ilike $${index}
    )`);
  }

  if (filter.due === "overdue") {
    conditions.push("t.due_date is not null and t.due_date < current_date");
  }

  if (filter.due === "soon") {
    conditions.push("t.due_date is not null and t.due_date between current_date and current_date + interval '3 day'");
  }

  if (filter.due === "none") {
    conditions.push("t.due_date is null");
  }

  const query = `
    select
      t.id,
      t.project_id as "projectId",
      t.owner_id as "ownerId",
      p.name as "projectName",
      t.title,
      t.description,
      t.status,
      t.priority,
      t.due_date::text as "dueDate",
      t.recurrence,
      t.repeat_subtasks as "repeatSubtasks",
      t.created_at as "createdAt",
      t.updated_at as "updatedAt"
    from tasks t
    join projects p on p.id = t.project_id
    where ${conditions.join(" and ")}
    order by
      case t.priority when 'high' then 1 when 'medium' then 2 else 3 end,
      t.due_date asc nulls last,
      t.updated_at desc
  `;

  const rawTasks = await sql.unsafe<Task[]>(query, values);
  if (!rawTasks.length) return [];

  const taskIds = rawTasks.map((t) => t.id);

  const [tagsRows, subtaskRows] = await Promise.all([
    sql<{ taskId: string; id: string; userId: string; name: string; color: string; createdAt: string }[]>`
      select tt.task_id as "taskId", t.id, t.user_id as "userId", t.name, t.color, t.created_at as "createdAt"
      from task_tags tt
      join tags t on t.id = tt.tag_id
      where tt.task_id in ${sql(taskIds)}
      order by t.name asc
    `,
    sql<{ id: string; taskId: string; ownerId: string; title: string; completed: boolean; createdAt: string; updatedAt: string }[]>`
      select id, task_id as "taskId", owner_id as "ownerId", title, completed, created_at as "createdAt", updated_at as "updatedAt"
      from subtasks
      where task_id in ${sql(taskIds)}
      order by created_at asc
    `
  ]);

  const tagsByTaskId = new Map<string, Array<any>>();
  for (const r of tagsRows) {
    const list = tagsByTaskId.get(r.taskId) || [];
    list.push({ id: r.id, userId: r.userId, name: r.name, color: r.color, createdAt: r.createdAt });
    tagsByTaskId.set(r.taskId, list);
  }

  const subtasksByTaskId = new Map<string, Array<any>>();
  for (const r of subtaskRows) {
    const list = subtasksByTaskId.get(r.taskId) || [];
    list.push({ id: r.id, taskId: r.taskId, ownerId: r.ownerId, title: r.title, completed: r.completed, createdAt: r.createdAt, updatedAt: r.updatedAt });
    subtasksByTaskId.set(r.taskId, list);
  }

  return rawTasks.map((task) => ({
    ...task,
    tags: tagsByTaskId.get(task.id) || [],
    subtasks: subtasksByTaskId.get(task.id) || []
  }));
}

export async function getTaskById(userId: string, taskId: string): Promise<Task | null> {
  const sql = db();
  const rows = await sql<Task[]>`
    select
      t.id,
      t.project_id as "projectId",
      t.owner_id as "ownerId",
      p.name as "projectName",
      t.title,
      t.description,
      t.status,
      t.priority,
      t.due_date::text as "dueDate",
      t.created_at as "createdAt",
      t.updated_at as "updatedAt"
    from tasks t
    join projects p on p.id = t.project_id
    where t.owner_id = ${userId}
      and t.id = ${taskId}
    limit 1
  `;

  return rows[0] ?? null;
}

export async function getReminders(userId: string): Promise<Reminder[]> {
  const sql = db();
  return sql<Reminder[]>`
    select
      r.id,
      r.task_id as "taskId",
      r.user_id as "userId",
      r.kind,
      r.remind_at as "remindAt",
      r.read_at as "readAt",
      t.title as "taskTitle",
      p.name as "projectName",
      t.due_date::text as "dueDate"
    from reminders r
    join tasks t on t.id = r.task_id
    join projects p on p.id = t.project_id
    where r.user_id = ${userId}
      and r.read_at is null
      and t.status <> 'done'
    order by r.remind_at asc
    limit 8
  `;
}

export async function createProject(input: {
  userId: string;
  name: string;
  description?: string;
}) {
  const sql = db();
  const [project] = await sql<Project[]>`
    insert into projects (id, owner_id, name, description, status)
    values (${randomUUID()}, ${input.userId}, ${input.name}, ${input.description || null}, ${"active"})
    returning
      id,
      owner_id as "ownerId",
      name,
      description,
      status,
      created_at as "createdAt",
      updated_at as "updatedAt"
  `;

  return project;
}

function calculateNextDueDate(currentDueDateStr: string | null, recurrence: TaskRecurrence): string {
  const baseDate = currentDueDateStr ? new Date(`${currentDueDateStr}T09:00:00Z`) : new Date();
  const validDate = isNaN(baseDate.getTime()) ? new Date() : baseDate;

  if (recurrence === "daily") {
    validDate.setUTCDate(validDate.getUTCDate() + 1);
  } else if (recurrence === "weekly") {
    validDate.setUTCDate(validDate.getUTCDate() + 7);
  } else if (recurrence === "monthly") {
    validDate.setUTCMonth(validDate.getUTCMonth() + 1);
  }

  return validDate.toISOString().slice(0, 10);
}

export async function createTask(input: {
  userId: string;
  projectId: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string | null;
  recurrence?: TaskRecurrence;
  repeatSubtasks?: boolean;
}) {
  const sql = db();
  const recurrence = input.recurrence || "none";
  const repeatSubtasks = input.repeatSubtasks ?? true;

  const [task] = await sql<Task[]>`
    insert into tasks (id, project_id, owner_id, title, description, status, priority, due_date, recurrence, repeat_subtasks)
    values (
      ${randomUUID()},
      ${input.projectId},
      ${input.userId},
      ${input.title},
      ${input.description || null},
      ${input.status},
      ${input.priority},
      ${input.dueDate || null},
      ${recurrence},
      ${repeatSubtasks}
    )
    returning
      id,
      project_id as "projectId",
      owner_id as "ownerId",
      title,
      description,
      status,
      priority,
      due_date::text as "dueDate",
      recurrence,
      repeat_subtasks as "repeatSubtasks",
      created_at as "createdAt",
      updated_at as "updatedAt"
  `;

  await syncReminder(input.userId, task.id, input.dueDate || null, input.status);

  return task;
}

export async function updateTask(input: {
  userId: string;
  taskId: string;
  projectId: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string | null;
  recurrence?: TaskRecurrence;
  repeatSubtasks?: boolean;
}) {
  const sql = db();
  const recurrence = input.recurrence || "none";
  const repeatSubtasks = input.repeatSubtasks ?? true;

  const [task] = await sql<Task[]>`
    update tasks
    set
      project_id = ${input.projectId},
      title = ${input.title},
      description = ${input.description || null},
      priority = ${input.priority},
      status = ${input.status},
      due_date = ${input.dueDate || null},
      recurrence = ${recurrence},
      repeat_subtasks = ${repeatSubtasks},
      updated_at = now()
    where id = ${input.taskId}
      and owner_id = ${input.userId}
    returning
      id,
      project_id as "projectId",
      owner_id as "ownerId",
      title,
      description,
      status,
      priority,
      due_date::text as "dueDate",
      recurrence,
      repeat_subtasks as "repeatSubtasks",
      created_at as "createdAt",
      updated_at as "updatedAt"
  `;

  await syncReminder(input.userId, input.taskId, input.dueDate || null, input.status);

  return task;
}

export async function markReminderAsRead(userId: string, reminderId: string) {
  const sql = db();
  await sql`
    update reminders
    set read_at = now(), updated_at = now()
    where id = ${reminderId}
      and user_id = ${userId}
  `;
}

async function syncReminder(userId: string, taskId: string, dueDate: string | null, status: TaskStatus) {
  const sql = db();

  if (!dueDate || status === "done") {
    await sql`delete from reminders where task_id = ${taskId}`;
    return;
  }

  const remindAt = new Date(`${dueDate}T09:00:00Z`).toISOString();
  await sql`
    insert into reminders (id, task_id, user_id, kind, remind_at, updated_at)
    values (${randomUUID()}, ${taskId}, ${userId}, ${"task_due"}, ${remindAt}, now())
    on conflict (task_id) do update
      set remind_at = excluded.remind_at,
          read_at = null,
          updated_at = now()
  `;
}

export async function toggleTaskStatus(userId: string, taskId: string, status: TaskStatus) {
  const sql = db();
  let nextStatus = status;
  let nextDueDate: string | null = null;

  const [existing] = await sql<{ dueDate: string | null; recurrence: string; repeatSubtasks: boolean }[]>`
    select due_date::text as "dueDate", recurrence, repeat_subtasks as "repeatSubtasks"
    from tasks
    where id = ${taskId} and owner_id = ${userId}
    limit 1
  `;

  if (status === "done" && existing?.recurrence && existing.recurrence !== "none") {
    nextStatus = "todo";
    nextDueDate = calculateNextDueDate(existing.dueDate, existing.recurrence as TaskRecurrence);

    if (existing.repeatSubtasks) {
      await sql`
        update subtasks
        set completed = false, updated_at = now()
        where task_id = ${taskId} and owner_id = ${userId}
      `;
    }
  }

  const [task] = await sql<Task[]>`
    update tasks
    set
      status = ${nextStatus},
      due_date = coalesce(${nextDueDate}, due_date),
      updated_at = now()
    where id = ${taskId} and owner_id = ${userId}
    returning
      id,
      project_id as "projectId",
      owner_id as "ownerId",
      title,
      description,
      status,
      priority,
      due_date::text as "dueDate",
      recurrence,
      repeat_subtasks as "repeatSubtasks",
      created_at as "createdAt",
      updated_at as "updatedAt"
  `;

  if (task) {
    await syncReminder(userId, taskId, task.dueDate || null, task.status);
  }

  return task;
}

/* ——— Tag & Subtask Services ——— */

export async function getTags(userId: string) {
  const sql = db();
  return sql<{ id: string; userId: string; name: string; color: string; createdAt: string }[]>`
    select id, user_id as "userId", name, color, created_at as "createdAt"
    from tags
    where user_id = ${userId}
    order by name asc
  `;
}

export async function createTag(userId: string, name: string, color: string = "#5b6cff") {
  const sql = db();
  const [tag] = await sql<{ id: string; userId: string; name: string; color: string; createdAt: string }[]>`
    insert into tags (id, user_id, name, color)
    values (${randomUUID()}, ${userId}, ${name}, ${color})
    returning id, user_id as "userId", name, color, created_at as "createdAt"
  `;
  return tag;
}

export async function setTaskTags(taskId: string, tagIds: string[]) {
  const sql = db();
  const limitedTagIds = tagIds.slice(0, 5); // Max 5 tags limit constraint

  await sql`delete from task_tags where task_id = ${taskId}`;

  if (limitedTagIds.length > 0) {
    const rows = limitedTagIds.map((tagId) => ({ task_id: taskId, tag_id: tagId }));
    await sql`
      insert into task_tags ${sql(rows, "task_id", "tag_id")}
    `;
  }
}

export async function createSubtask(userId: string, taskId: string, title: string) {
  const sql = db();
  const [subtask] = await sql`
    insert into subtasks (id, task_id, owner_id, title, completed)
    values (${randomUUID()}, ${taskId}, ${userId}, ${title}, false)
    returning id, task_id as "taskId", owner_id as "ownerId", title, completed, created_at as "createdAt", updated_at as "updatedAt"
  `;
  return subtask;
}

export async function toggleSubtask(userId: string, subtaskId: string, completed: boolean) {
  const sql = db();
  await sql`
    update subtasks
    set completed = ${completed}, updated_at = now()
    where id = ${subtaskId} and owner_id = ${userId}
  `;
}

export async function deleteSubtask(userId: string, subtaskId: string) {
  const sql = db();
  await sql`
    delete from subtasks
    where id = ${subtaskId} and owner_id = ${userId}
  `;
}

/* ——— Custom Statuses & Priorities ——— */

export async function getCustomStatuses(userId: string) {
  const sql = db();
  return sql<{ id: string; userId: string; key: string; label: string; color: string; createdAt: string }[]>`
    select id, user_id as "userId", key, label, color, created_at as "createdAt"
    from custom_statuses
    where user_id = ${userId}
    order by label asc
  `;
}

export async function createCustomStatus(userId: string, label: string, color: string = "#5b6cff") {
  const sql = db();
  const key = label.toLowerCase().trim().replace(/\s+/g, "_");
  const [status] = await sql`
    insert into custom_statuses (id, user_id, key, label, color)
    values (${randomUUID()}, ${userId}, ${key}, ${label}, ${color})
    returning id, user_id as "userId", key, label, color, created_at as "createdAt"
  `;
  return status;
}

export async function getCustomPriorities(userId: string) {
  const sql = db();
  return sql<{ id: string; userId: string; key: string; label: string; color: string; createdAt: string }[]>`
    select id, user_id as "userId", key, label, color, created_at as "createdAt"
    from custom_priorities
    where user_id = ${userId}
    order by label asc
  `;
}

export async function createCustomPriority(userId: string, label: string, color: string = "#e2a336") {
  const sql = db();
  const key = label.toLowerCase().trim().replace(/\s+/g, "_");
  const [priority] = await sql`
    insert into custom_priorities (id, user_id, key, label, color)
    values (${randomUUID()}, ${userId}, ${key}, ${label}, ${color})
    returning id, user_id as "userId", key, label, color, created_at as "createdAt"
  `;
  return priority;
}
