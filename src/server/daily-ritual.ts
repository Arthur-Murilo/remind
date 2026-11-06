import { projectColor } from "@/domain/project-colors";
import { db } from "@/lib/db";

/**
 * Ritual diário (inspirado em Sunsama/Akiflow): planejar de manhã contra a meta de foco
 * e encerrar à noite com estimado × realizado e destaques. Tudo derivado de tarefas,
 * sessões de trabalho e da tabela daily_notes (uma linha por usuário e dia).
 */

export type RitualTask = {
  id: string;
  title: string;
  projectId: string;
  projectName: string;
  projectColor: string;
  priority: string;
  dueDate: string | null;
  status: string;
  estimateMinutes: number | null;
  trackedTodaySeconds: number;
  trackedTotalSeconds: number;
  completedToday: boolean;
};

export type DayLoad = {
  goalSeconds: number;
  trackedTodaySeconds: number;
  /** Soma do que falta das estimativas das tarefas abertas da pauta (estimativa − já registrado). */
  remainingEstimateSeconds: number;
  /** Registrado hoje + restante estimado: quanto o dia vai somar se o plano for cumprido. */
  projectedSeconds: number;
  plannedCount: number;
  withoutEstimateCount: number;
};

export type DayNote = {
  intention: string;
  highlights: string[];
  plannedAt: string | null;
  closedAt: string | null;
  /** HH:MM no fuso do app. */
  closedTime: string | null;
};

export type DayRitual = {
  today: string;
  tomorrow: string;
  hour: number;
  note: DayNote;
  load: DayLoad;
  agenda: RitualTask[];
  suggestions: RitualTask[];
  completed: RitualTask[];
  workedOpen: RitualTask[];
};

type Row = Omit<RitualTask, "projectColor"> & { colorIndex: number };

function taskSelect(userId: string) {
  const sql = db();
  return sql`
    select
      t.id,
      t.title,
      t.project_id as "projectId",
      p.name as "projectName",
      (
        select count(*)::int from projects older
        where older.owner_id = p.owner_id and (older.created_at, older.id) < (p.created_at, p.id)
      ) as "colorIndex",
      t.priority,
      t.due_date::text as "dueDate",
      t.status,
      t.estimate_minutes as "estimateMinutes",
      coalesce((
        select sum(greatest(0, extract(epoch from (
          least(coalesce(ws.ended_at, now()), date_trunc('day', now()) + interval '1 day') - greatest(ws.started_at, date_trunc('day', now()))
        ))))
        from work_sessions ws
        where ws.task_id = t.id
          and ws.started_at < date_trunc('day', now()) + interval '1 day'
          and coalesce(ws.ended_at, now()) > date_trunc('day', now())
      ), 0)::int as "trackedTodaySeconds",
      coalesce((
        select sum(case when ws.ended_at is null
          then greatest(1, floor(extract(epoch from (now() - ws.started_at)))::int)
          else ws.duration_seconds end)
        from work_sessions ws
        where ws.task_id = t.id
      ), 0)::int as "trackedTotalSeconds",
      (t.completed_at is not null and t.completed_at >= date_trunc('day', now())) as "completedToday"
    from tasks t
    join projects p on p.id = t.project_id
    where t.owner_id = ${userId}
  `;
}

function withColor(rows: Row[]): RitualTask[] {
  return rows.map(({ colorIndex, ...row }) => ({ ...row, projectColor: projectColor(colorIndex) }));
}

export function computeLoad(agenda: RitualTask[], goalSeconds: number, trackedTodaySeconds: number): DayLoad {
  const open = agenda.filter((task) => task.status !== "done");
  const remainingEstimateSeconds = open.reduce(
    (sum, task) => sum + (task.estimateMinutes ? Math.max(0, task.estimateMinutes * 60 - task.trackedTotalSeconds) : 0),
    0
  );
  return {
    goalSeconds,
    trackedTodaySeconds,
    remainingEstimateSeconds,
    projectedSeconds: trackedTodaySeconds + remainingEstimateSeconds,
    plannedCount: open.length,
    withoutEstimateCount: open.filter((task) => !task.estimateMinutes).length
  };
}

export async function getDayRitual(userId: string): Promise<DayRitual> {
  const sql = db();

  const [[meta], agendaRows, suggestionRows, workedRows, noteRows] = await Promise.all([
    sql<{ today: string; tomorrow: string; hour: number; goalMinutes: number; trackedToday: number }[]>`
      select
        to_char(now(), 'YYYY-MM-DD') as today,
        to_char(now() + interval '1 day', 'YYYY-MM-DD') as tomorrow,
        extract(hour from now())::int as hour,
        (select daily_focus_goal_minutes from users where id = ${userId}) as "goalMinutes",
        (
          select coalesce(sum(greatest(0, extract(epoch from (
            least(coalesce(ended_at, now()), date_trunc('day', now()) + interval '1 day') - greatest(started_at, date_trunc('day', now()))
          )))), 0)::int
          from work_sessions
          where owner_id = ${userId}
            and started_at < date_trunc('day', now()) + interval '1 day'
            and coalesce(ended_at, now()) > date_trunc('day', now())
        ) as "trackedToday"
    `,
    sql<Row[]>`
      select * from (${taskSelect(userId)}) x
      where x.status <> 'done' and x."dueDate"::date <= current_date
      order by x."dueDate" asc, x.title asc
    `,
    sql<Row[]>`
      select * from (${taskSelect(userId)}) x
      where x.status <> 'done'
        and (x."dueDate" is null or x."dueDate"::date between current_date + 1 and current_date + 7)
      order by x."dueDate" asc nulls last, x.title asc
      limit 8
    `,
    sql<Row[]>`
      select * from (${taskSelect(userId)}) x
      where x."completedToday" or x."trackedTodaySeconds" > 0
      order by x."completedToday" desc, x."trackedTodaySeconds" desc
    `,
    sql<{ intention: string | null; highlights: string[]; plannedAt: Date | null; closedAt: Date | null; closedTime: string | null }[]>`
      select intention, highlights, planned_at as "plannedAt", closed_at as "closedAt", to_char(closed_at, 'HH24:MI') as "closedTime"
      from daily_notes
      where user_id = ${userId} and day = current_date
    `
  ]);

  const agenda = withColor(agendaRows);
  const worked = withColor(workedRows);
  const note = noteRows[0];
  const goalSeconds = (meta?.goalMinutes ?? 240) * 60;

  return {
    today: meta.today,
    tomorrow: meta.tomorrow,
    hour: meta.hour,
    note: {
      intention: note?.intention ?? "",
      highlights: note?.highlights ?? [],
      plannedAt: note?.plannedAt ? new Date(note.plannedAt).toISOString() : null,
      closedAt: note?.closedAt ? new Date(note.closedAt).toISOString() : null,
      closedTime: note?.closedTime ?? null
    },
    load: computeLoad(agenda, goalSeconds, meta.trackedToday),
    agenda,
    suggestions: withColor(suggestionRows),
    completed: worked.filter((task) => task.completedToday),
    workedOpen: worked.filter((task) => !task.completedToday && task.status !== "done")
  };
}

/** Carga do dia para o Meu dia (sem montar o ritual inteiro). */
export async function getDayLoad(userId: string, goalMinutes: number, trackedTodaySeconds: number) {
  const sql = db();
  const rows = await sql<Row[]>`
    select * from (${taskSelect(userId)}) x
    where x.status <> 'done' and x."dueDate"::date <= current_date
  `;
  return computeLoad(withColor(rows), goalMinutes * 60, trackedTodaySeconds);
}

export async function getDayStatus(userId: string) {
  const sql = db();
  const [row] = await sql<{ plannedAt: Date | null; closedAt: Date | null; hour: number }[]>`
    select n.planned_at as "plannedAt", n.closed_at as "closedAt", extract(hour from now())::int as hour
    from (select 1) one
    left join daily_notes n on n.user_id = ${userId} and n.day = current_date
  `;
  return { planned: Boolean(row?.plannedAt), closed: Boolean(row?.closedAt), hour: row?.hour ?? 0 };
}

export async function saveDayIntention(userId: string, intention: string, markPlanned: boolean) {
  const sql = db();
  const text = intention.trim().slice(0, 280) || null;
  await sql`
    insert into daily_notes (user_id, day, intention, planned_at, updated_at)
    values (${userId}, current_date, ${text}, ${markPlanned ? new Date() : null}, now())
    on conflict (user_id, day) do update set
      intention = excluded.intention,
      planned_at = coalesce(daily_notes.planned_at, excluded.planned_at),
      updated_at = now()
  `;
}

export async function closeDay(userId: string, highlights: string[]) {
  const sql = db();
  const clean = highlights.map((item) => item.trim().slice(0, 200)).filter(Boolean).slice(0, 3);
  await sql`
    insert into daily_notes (user_id, day, highlights, closed_at, updated_at)
    values (${userId}, current_date, ${clean}, now(), now())
    on conflict (user_id, day) do update set
      highlights = excluded.highlights,
      closed_at = now(),
      updated_at = now()
  `;
}

export async function setTaskEstimate(userId: string, taskId: string, minutes: number | null) {
  const sql = db();
  await sql`
    update tasks set estimate_minutes = ${minutes}, updated_at = now()
    where id = ${taskId} and owner_id = ${userId}
  `;
}
