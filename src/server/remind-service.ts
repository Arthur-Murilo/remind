import { randomUUID } from "node:crypto";

import type { Project, Reminder, Task, TaskFilter, TaskRecurrence, TimePeriod, WorkSession } from "@/domain/types";
import { SYSTEM_PRIORITY_ITEMS, SYSTEM_STATUS_ITEMS, mergeCatalog, slugifyCatalogKey, sortCatalogItems } from "@/domain/catalog";
import { db } from "@/lib/db";

type DashboardMetrics = {
  totalProjects: number;
  openTasks: number;
  dueSoon: number;
  overdue: number;
  trackedSecondsToday: number;
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
      and due_date = current_date
  `;

  const [overdueRow] = await sql<{ count: number }[]>`
    select count(*)::int as count
    from tasks
    where owner_id = ${userId}
      and status <> 'done'
      and due_date is not null
      and due_date < current_date
  `;

  const [trackedRow] = await sql<{ seconds: number }[]>`
    select coalesce(sum(
      case
        when ended_at is null then greatest(1, floor(extract(epoch from (now() - started_at)))::int)
        else duration_seconds
      end
    ), 0)::int as seconds
    from work_sessions
    where owner_id = ${userId}
      and started_at >= date_trunc('day', now())
  `;

  return {
    totalProjects: projectRow?.count ?? 0,
    openTasks: openRow?.count ?? 0,
    dueSoon: soonRow?.count ?? 0,
    overdue: overdueRow?.count ?? 0,
    trackedSecondsToday: trackedRow?.seconds ?? 0
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
    conditions.push("t.status <> 'done'");
  }

  if (filter.due === "soon") {
    conditions.push("t.due_date is not null and t.due_date = current_date");
    conditions.push("t.status <> 'done'");
  }

  if (filter.due === "myday") {
    conditions.push("t.due_date is not null and t.due_date <= current_date");
    conditions.push("(t.status <> 'done' or t.due_date = current_date)");
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
      coalesce((
        select sum(ws.duration_seconds)
        from work_sessions ws
        where ws.task_id = t.id
          and ws.owner_id = t.owner_id
          and ws.ended_at is not null
      ), 0)::int as "totalTrackedSeconds",
      t.created_at as "createdAt",
      t.updated_at as "updatedAt"
    from tasks t
    join projects p on p.id = t.project_id
    left join custom_priorities cp
      on cp.user_id = t.owner_id and cp.key = t.priority
    where ${conditions.join(" and ")}
    order by
      coalesce(
        cp.sort_order,
        case t.priority
          when 'high' then 0
          when 'medium' then 1
          when 'low' then 2
          else 100
        end
      ) asc,
      t.due_date asc nulls last,
      t.updated_at desc
  `;

  const rawTasks = await sql.unsafe<Task[]>(query, values);
  if (!rawTasks.length) return [];

  const taskIds = rawTasks.map((t) => t.id);

  const [tagsRows, subtaskRows, runningRows] = await Promise.all([
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
    `,
    sql<{ id: string; taskId: string; startedAt: string }[]>`
      select id, task_id as "taskId", started_at as "startedAt"
      from work_sessions
      where owner_id = ${userId}
        and ended_at is null
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
    totalTrackedSeconds: Number(task.totalTrackedSeconds || 0),
    tags: tagsByTaskId.get(task.id) || [],
    subtasks: subtasksByTaskId.get(task.id) || [],
    runningSession: runningRows.find((row) => row.taskId === task.id) || null
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
      and t.due_date is not null
      and t.due_date <= current_date
    order by
      case when t.due_date < current_date then 0 else 1 end,
      t.due_date asc,
      r.remind_at asc
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

export async function renameProject(userId: string, projectId: string, name: string) {
  const sql = db();
  const [project] = await sql<Project[]>`
    update projects
    set name = ${name}, updated_at = now()
    where id = ${projectId} and owner_id = ${userId}
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
  priority: string;
  status: string;
  dueDate?: string | null;
  recurrence?: TaskRecurrence;
  repeatSubtasks?: boolean;
}) {
  const project = await getProjectById(input.userId, input.projectId);
  if (!project) {
    return null;
  }

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
  priority: string;
  status: string;
  dueDate?: string | null;
  recurrence?: TaskRecurrence;
  repeatSubtasks?: boolean;
}) {
  const project = await getProjectById(input.userId, input.projectId);
  if (!project) {
    return null;
  }

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
  if (task && input.status === "done") {
    await completeAllSubtasks(input.userId, input.taskId);
  }

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

async function syncReminder(userId: string, taskId: string, dueDate: string | null, status: string) {
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

export async function toggleTaskStatus(userId: string, taskId: string, status: string) {
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
    if (task.status === "done") {
      await completeAllSubtasks(userId, taskId);
    }
  }

  return task;
}

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
  const [owned] = await sql<{ id: string }[]>`
    select id from tasks where id = ${taskId} and owner_id = ${userId} limit 1
  `;
  if (!owned) {
    return null;
  }

  const [subtask] = await sql`
    insert into subtasks (id, task_id, owner_id, title, completed)
    values (${randomUUID()}, ${taskId}, ${userId}, ${title}, false)
    returning id, task_id as "taskId", owner_id as "ownerId", title, completed, created_at as "createdAt", updated_at as "updatedAt"
  `;
  return subtask;
}

export async function toggleSubtask(userId: string, subtaskId: string, completed: boolean) {
  const sql = db();
  // Concluir subtarefas nunca fecha a tarefa pai, mesmo se todas estiverem feitas.
  await sql`
    update subtasks
    set completed = ${completed}, updated_at = now()
    where id = ${subtaskId} and owner_id = ${userId}
  `;
}

async function completeAllSubtasks(userId: string, taskId: string) {
  const sql = db();
  await sql`
    update subtasks
    set completed = true, updated_at = now()
    where task_id = ${taskId}
      and owner_id = ${userId}
      and completed = false
  `;
}

export async function deleteSubtask(userId: string, subtaskId: string) {
  const sql = db();
  await sql`
    delete from subtasks
    where id = ${subtaskId} and owner_id = ${userId}
  `;
}

export async function updateSubtaskTitle(userId: string, subtaskId: string, title: string) {
  const sql = db();
  await sql`
    update subtasks
    set title = ${title}, updated_at = now()
    where id = ${subtaskId} and owner_id = ${userId}
  `;
}

export async function deleteTask(userId: string, taskId: string) {
  const sql = db();
  await sql`
    delete from tasks
    where id = ${taskId} and owner_id = ${userId}
  `;
}

export async function deleteProject(userId: string, projectId: string) {
  const sql = db();
  await sql`
    delete from projects
    where id = ${projectId} and owner_id = ${userId}
  `;
}

export async function patchTask(
  userId: string,
  taskId: string,
  patch: {
    status?: string;
    priority?: string;
    dueDate?: string | null;
    projectId?: string;
    title?: string;
  }
) {
  const sql = db();
  const [existing] = await sql<Task[]>`
    select
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
    from tasks
    where id = ${taskId} and owner_id = ${userId}
    limit 1
  `;

  if (!existing) {
    return null;
  }

  if (patch.projectId) {
    const project = await getProjectById(userId, patch.projectId);
    if (!project) {
      return null;
    }
  }

  const nextStatus = patch.status ?? existing.status;
  const nextPriority = patch.priority ?? existing.priority;
  const nextDueDate = patch.dueDate !== undefined ? patch.dueDate : existing.dueDate;
  const nextProjectId = patch.projectId ?? existing.projectId;
  const nextTitle = patch.title?.trim() || existing.title;

  const [task] = await sql<Task[]>`
    update tasks
    set
      project_id = ${nextProjectId},
      title = ${nextTitle},
      status = ${nextStatus},
      priority = ${nextPriority},
      due_date = ${nextDueDate},
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
    if (task.status === "done") {
      await completeAllSubtasks(userId, taskId);
    }
  }

  return task;
}

export async function setTaskTagsForOwner(userId: string, taskId: string, tagIds: string[]) {
  const sql = db();
  const [owned] = await sql<{ id: string }[]>`
    select id from tasks where id = ${taskId} and owner_id = ${userId} limit 1
  `;
  if (!owned) {
    return;
  }

  const limited = tagIds.slice(0, 5);
  let ownedTagIds: string[] = [];
  if (limited.length > 0) {
    const rows = await sql<{ id: string }[]>`
      select id from tags
      where user_id = ${userId}
        and id in ${sql(limited)}
    `;
    ownedTagIds = rows.map((row) => row.id);
  }

  await setTaskTags(taskId, ownedTagIds);
}

export async function updateTag(userId: string, tagId: string, patch: { name?: string; color?: string }) {
  const sql = db();
  const [existing] = await sql<{ id: string; name: string; color: string }[]>`
    select id, name, color from tags where id = ${tagId} and user_id = ${userId} limit 1
  `;
  if (!existing) return null;

  const name = patch.name?.trim() || existing.name;
  const color = patch.color || existing.color;
  const [tag] = await sql`
    update tags
    set name = ${name}, color = ${color}
    where id = ${tagId} and user_id = ${userId}
    returning id, user_id as "userId", name, color, created_at as "createdAt"
  `;
  return tag;
}

export async function deleteTag(userId: string, tagId: string) {
  const sql = db();
  await sql`delete from tags where id = ${tagId} and user_id = ${userId}`;
}

type CatalogKind = "status" | "priority";

function systemItemsFor(kind: CatalogKind) {
  return kind === "status" ? SYSTEM_STATUS_ITEMS : SYSTEM_PRIORITY_ITEMS;
}

function uniqueCatalogKey(label: string, reserved: Set<string>) {
  let key = slugifyCatalogKey(label);
  if (reserved.has(key)) {
    key = `${key}_${randomUUID().slice(0, 6)}`;
  }
  return key;
}

export async function createCustomStatus(userId: string, label: string, color: string = "#5b6cff") {
  const sql = db();
  const key = uniqueCatalogKey(label, new Set(SYSTEM_STATUS_ITEMS.map((item) => item.key)));
  const [status] = await sql`
    insert into custom_statuses (id, user_id, key, label, color)
    values (${randomUUID()}, ${userId}, ${key}, ${label}, ${color})
    on conflict (user_id, key) do nothing
    returning id, user_id as "userId", key, label, color, created_at as "createdAt"
  `;
  if (status) return status;
  const [retry] = await sql`
    insert into custom_statuses (id, user_id, key, label, color)
    values (${randomUUID()}, ${userId}, ${`${key}_${randomUUID().slice(0, 6)}`}, ${label}, ${color})
    returning id, user_id as "userId", key, label, color, created_at as "createdAt"
  `;
  return retry;
}

async function nextPrioritySortOrder(userId: string) {
  const sql = db();
  const fallback = SYSTEM_PRIORITY_ITEMS.length - 1;
  const [row] = await sql<{ next: number }[]>`
    select greatest(coalesce(max(sort_order), 0), ${fallback}) + 1 as next
    from custom_priorities
    where user_id = ${userId}
  `;
  return row?.next ?? SYSTEM_PRIORITY_ITEMS.length;
}

export async function createCustomPriority(userId: string, label: string, color: string = "#e2a336") {
  const sql = db();
  const key = uniqueCatalogKey(label, new Set(SYSTEM_PRIORITY_ITEMS.map((item) => item.key)));
  const sortOrder = await nextPrioritySortOrder(userId);
  const [priority] = await sql`
    insert into custom_priorities (id, user_id, key, label, color, sort_order)
    values (${randomUUID()}, ${userId}, ${key}, ${label}, ${color}, ${sortOrder})
    on conflict (user_id, key) do nothing
    returning id, user_id as "userId", key, label, color, sort_order as "sortOrder", created_at as "createdAt"
  `;
  if (priority) return priority;
  const [retry] = await sql`
    insert into custom_priorities (id, user_id, key, label, color, sort_order)
    values (${randomUUID()}, ${userId}, ${`${key}_${randomUUID().slice(0, 6)}`}, ${label}, ${color}, ${sortOrder + 1})
    returning id, user_id as "userId", key, label, color, sort_order as "sortOrder", created_at as "createdAt"
  `;
  return retry;
}

export async function setCatalogColor(userId: string, kind: CatalogKind, key: string, color: string) {
  const sql = db();
  const system = systemItemsFor(kind).find((item) => item.key === key);
  const label = system?.label || key;
  if (kind === "status") {
    const [row] = await sql`
      insert into custom_statuses (id, user_id, key, label, color)
      values (${randomUUID()}, ${userId}, ${key}, ${label}, ${color})
      on conflict (user_id, key) do update set color = excluded.color
      returning id, user_id as "userId", key, label, color, created_at as "createdAt"
    `;
    return row;
  }
  const systemIndex = SYSTEM_PRIORITY_ITEMS.findIndex((item) => item.key === key);
  const sortOrder = systemIndex >= 0 ? systemIndex : await nextPrioritySortOrder(userId);
  const [row] = await sql`
    insert into custom_priorities (id, user_id, key, label, color, sort_order)
    values (${randomUUID()}, ${userId}, ${key}, ${label}, ${color}, ${sortOrder})
    on conflict (user_id, key) do update set color = excluded.color
    returning id, user_id as "userId", key, label, color, sort_order as "sortOrder", created_at as "createdAt"
  `;
  return row;
}

export async function getCustomStatuses(userId: string) {
  const sql = db();
  return sql<{ id: string; userId: string; key: string; label: string; color: string; createdAt: string }[]>`
    select id, user_id as "userId", key, label, color, created_at as "createdAt"
    from custom_statuses
    where user_id = ${userId}
    order by label asc
  `;
}

export async function getCustomPriorities(userId: string) {
  const sql = db();
  return sql<{ id: string; userId: string; key: string; label: string; color: string; sortOrder: number; createdAt: string }[]>`
    select id, user_id as "userId", key, label, color, sort_order as "sortOrder", created_at as "createdAt"
    from custom_priorities
    where user_id = ${userId}
    order by sort_order asc, created_at asc
  `;
}

export async function getCatalogs(userId: string) {
  const [customStatuses, customPriorities] = await Promise.all([
    getCustomStatuses(userId),
    getCustomPriorities(userId)
  ]);
  return {
    statuses: mergeCatalog(SYSTEM_STATUS_ITEMS, customStatuses),
    priorities: sortCatalogItems(mergeCatalog(SYSTEM_PRIORITY_ITEMS, customPriorities))
  };
}

export async function reorderPriorities(userId: string, orderedKeys: string[]) {
  const catalogs = await getCatalogs(userId);
  const allowed = new Set(catalogs.priorities.map((item) => item.key));
  const keys = orderedKeys.filter((key) => allowed.has(key));
  for (const item of catalogs.priorities) {
    if (!keys.includes(item.key)) {
      keys.push(item.key);
    }
  }
  if (keys.length === 0) {
    return catalogs.priorities;
  }

  const byKey = new Map(catalogs.priorities.map((item) => [item.key, item]));
  const rows = keys.flatMap((key, index) => {
    const item = byKey.get(key);
    if (!item) return [];
    return [
      {
        id: randomUUID(),
        user_id: userId,
        key,
        label: item.label,
        color: item.color,
        sort_order: index
      }
    ];
  });
  if (rows.length === 0) {
    return catalogs.priorities;
  }

  const sql = db();
  await sql`
    insert into custom_priorities ${sql(rows, "id", "user_id", "key", "label", "color", "sort_order")}
    on conflict (user_id, key) do update
      set sort_order = excluded.sort_order,
          label = excluded.label
  `;

  return (await getCatalogs(userId)).priorities;
}

export async function deleteCatalogItem(userId: string, kind: CatalogKind, key: string) {
  const systemKeys = new Set(systemItemsFor(kind).map((item) => item.key));
  if (systemKeys.has(key)) {
    return;
  }

  const sql = db();
  if (kind === "status") {
    await sql`update tasks set status = ${"todo"}, updated_at = now() where owner_id = ${userId} and status = ${key}`;
    await sql`delete from custom_statuses where user_id = ${userId} and key = ${key}`;
    return;
  }

  await sql`update tasks set priority = ${"medium"}, updated_at = now() where owner_id = ${userId} and priority = ${key}`;
  await sql`delete from custom_priorities where user_id = ${userId} and key = ${key}`;
}

export async function isAllowedStatus(userId: string, key: string) {
  if (SYSTEM_STATUS_ITEMS.some((item) => item.key === key)) return true;
  const sql = db();
  const rows = await sql`select 1 from custom_statuses where user_id = ${userId} and key = ${key} limit 1`;
  return rows.length > 0;
}

export async function isAllowedPriority(userId: string, key: string) {
  if (SYSTEM_PRIORITY_ITEMS.some((item) => item.key === key)) return true;
  const sql = db();
  const rows = await sql`select 1 from custom_priorities where user_id = ${userId} and key = ${key} limit 1`;
  return rows.length > 0;
}

function periodBounds(period: TimePeriod) {
  const now = new Date();
  const from = new Date(now);
  from.setHours(0, 0, 0, 0);

  if (period === "week") {
    const day = from.getDay();
    const diff = day === 0 ? 6 : day - 1;
    from.setDate(from.getDate() - diff);
  } else if (period === "month") {
    from.setDate(1);
  }

  const to = new Date(now);
  to.setHours(23, 59, 59, 999);
  return { from: from.toISOString(), to: to.toISOString() };
}

async function closeOpenSessions(userId: string) {
  const sql = db();
  await sql`
    update work_sessions
    set
      ended_at = now(),
      duration_seconds = greatest(1, floor(extract(epoch from (now() - started_at)))::int),
      updated_at = now()
    where owner_id = ${userId}
      and ended_at is null
  `;
}

export async function startWorkSession(userId: string, taskId: string) {
  const task = await getTaskById(userId, taskId);
  if (!task) return null;

  const sql = db();
  await closeOpenSessions(userId);
  const [session] = await sql`
    insert into work_sessions (id, task_id, owner_id, started_at, ended_at, duration_seconds, source)
    values (${randomUUID()}, ${taskId}, ${userId}, now(), null, 0, ${"timer"})
    returning
      id,
      task_id as "taskId",
      owner_id as "ownerId",
      started_at as "startedAt",
      ended_at as "endedAt",
      duration_seconds as "durationSeconds",
      source
  `;
  return session;
}

export async function stopWorkSession(userId: string) {
  await closeOpenSessions(userId);
}

export async function createManualSession(userId: string, taskId: string, date: string, durationSeconds: number) {
  const task = await getTaskById(userId, taskId);
  if (!task) return null;

  const seconds = Math.max(60, Math.floor(durationSeconds));
  const startedAt = new Date(`${date}T12:00:00`);
  if (Number.isNaN(startedAt.getTime())) return null;
  const endedAt = new Date(startedAt.getTime() + seconds * 1000);

  const sql = db();
  const [session] = await sql`
    insert into work_sessions (id, task_id, owner_id, started_at, ended_at, duration_seconds, source)
    values (${randomUUID()}, ${taskId}, ${userId}, ${startedAt.toISOString()}, ${endedAt.toISOString()}, ${seconds}, ${"manual"})
    returning
      id,
      task_id as "taskId",
      owner_id as "ownerId",
      started_at as "startedAt",
      ended_at as "endedAt",
      duration_seconds as "durationSeconds",
      source
  `;
  return session;
}

export async function updateWorkSessionDuration(userId: string, sessionId: string, durationSeconds: number) {
  const seconds = Math.max(60, Math.floor(durationSeconds));
  const sql = db();
  await sql`
    update work_sessions
    set
      duration_seconds = ${seconds},
      ended_at = started_at + (${seconds} * interval '1 second'),
      updated_at = now()
    where id = ${sessionId}
      and owner_id = ${userId}
      and ended_at is not null
  `;
}

export async function deleteWorkSession(userId: string, sessionId: string) {
  const sql = db();
  await sql`
    delete from work_sessions
    where id = ${sessionId} and owner_id = ${userId}
  `;
}

export async function getTimeReport(userId: string, filter: { projectId?: string; period: TimePeriod }) {
  const sql = db();
  const { from, to } = periodBounds(filter.period);
  const values: string[] = [userId, from, to];
  const conditions = [
    "s.owner_id = $1",
    "s.started_at < $3",
    "(s.ended_at is null or s.ended_at > $2)"
  ];

  if (filter.projectId) {
    values.push(filter.projectId);
    conditions.push(`t.project_id = $${values.length}`);
  }

  const sessions = await sql.unsafe<WorkSession[]>(
    `select
       s.id,
       s.task_id as "taskId",
       s.owner_id as "ownerId",
       t.title as "taskTitle",
       t.project_id as "projectId",
       p.name as "projectName",
       s.started_at as "startedAt",
       s.ended_at as "endedAt",
       case
         when s.ended_at is null then greatest(1, floor(extract(epoch from (now() - s.started_at)))::int)
         else s.duration_seconds
       end as "durationSeconds",
       s.source
     from work_sessions s
     join tasks t on t.id = s.task_id
     join projects p on p.id = t.project_id
     where ${conditions.join(" and ")}
     order by s.started_at desc`,
    values
  );

  const byProject = new Map<string, { projectId: string; projectName: string; durationSeconds: number }>();
  const byTask = new Map<string, { taskId: string; taskTitle: string; projectName: string; durationSeconds: number }>();
  let totalSeconds = 0;

  for (const session of sessions) {
    totalSeconds += session.durationSeconds;

    const project = byProject.get(session.projectId) || {
      projectId: session.projectId,
      projectName: session.projectName,
      durationSeconds: 0
    };
    project.durationSeconds += session.durationSeconds;
    byProject.set(session.projectId, project);

    const task = byTask.get(session.taskId) || {
      taskId: session.taskId,
      taskTitle: session.taskTitle,
      projectName: session.projectName,
      durationSeconds: 0
    };
    task.durationSeconds += session.durationSeconds;
    byTask.set(session.taskId, task);
  }

  return {
    period: filter.period,
    from,
    to,
    totalSeconds,
    projects: [...byProject.values()].sort((a, b) => b.durationSeconds - a.durationSeconds),
    tasks: [...byTask.values()].sort((a, b) => b.durationSeconds - a.durationSeconds),
    sessions
  };
}

