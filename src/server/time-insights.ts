import type { TimePeriod, WorkSessionSource } from "@/domain/types";
import { projectColor } from "@/domain/project-colors";
import { db } from "@/lib/db";
import { formatDuration } from "@/lib/format";

/** Sessões a partir deste tamanho contam como bloco de foco (referência: um pomodoro). */
export const DEEP_WORK_MIN_SECONDS = 25 * 60;
const HEATMAP_DAYS = 56;
const WEEKDAY_SHORT = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];
const WEEKDAY_LONG = ["segundas", "terças", "quartas", "quintas", "sextas", "sábados", "domingos"];
const UNIT_LABEL: Record<TimePeriod, { current: string; previous: string }> = {
  day: { current: "hoje", previous: "ontem" },
  week: { current: "nesta semana", previous: "na semana anterior" },
  month: { current: "neste mês", previous: "no mês anterior" }
};

export type TimeInsightSession = {
  id: string;
  taskId: string;
  taskTitle: string;
  projectId: string;
  projectName: string;
  projectColor: string;
  startedAt: string;
  endedAt: string | null;
  day: string;
  startTime: string;
  endTime: string | null;
  durationSeconds: number;
  source: WorkSessionSource;
};

export type TimeShare = {
  id: string;
  label: string;
  detail?: string;
  color: string;
  seconds: number;
  share: number;
};

export type TimelineBucket = {
  key: string;
  label: string;
  longLabel: string;
  isCurrent: boolean;
  isFuture: boolean;
  totalSeconds: number;
  segments: Array<{ projectId: string; seconds: number }>;
};

export type EstimateRow = {
  taskId: string;
  taskTitle: string;
  projectName: string;
  color: string;
  status: string;
  estimateSeconds: number;
  trackedSeconds: number;
};

export type TimeInsightsFilter = {
  period: TimePeriod;
  offset?: number;
  projectId?: string;
};

export type TimeInsights = {
  period: TimePeriod;
  offset: number;
  rangeLabel: string;
  from: string;
  to: string;
  isCurrent: boolean;
  today: string;
  totalSeconds: number;
  previousSeconds: number;
  deltaRatio: number | null;
  activeDays: number;
  elapsedDays: number;
  averagePerActiveDay: number;
  sessionCount: number;
  averageSessionSeconds: number;
  longestSession: { seconds: number; taskTitle: string; day: string } | null;
  deepWorkSeconds: number;
  deepWorkShare: number;
  streakDays: number;
  completedTaskCount: number;
  projects: TimeShare[];
  tasks: TimeShare[];
  tags: TimeShare[];
  legend: Array<{ id: string; label: string; color: string }>;
  timeline: { unit: "hour" | "day"; buckets: TimelineBucket[]; maxSeconds: number };
  heatmap: { cells: number[][]; maxSeconds: number; days: number };
  insights: string[];
  sessions: TimeInsightSession[];
  focusGoalSeconds: number;
  goalDaysHit: number;
  estimates: EstimateRow[];
  /** Mediana de realizado/estimado entre tarefas concluídas com estimativa (null se < 2). */
  estimateRatio: number | null;
};

type Bounds = { from: Date; to: Date; prevFrom: Date; now: Date; today: string; elapsedEnd: Date };

const STEP: Record<TimePeriod, string> = { day: "1 day", week: "1 week", month: "1 month" };

async function resolveBounds(period: TimePeriod, offset: number): Promise<Bounds> {
  const sql = db();
  const step = STEP[period];
  const [row] = await sql<Bounds[]>`
    select
      f as "from",
      f + ${step}::interval as "to",
      f - ${step}::interval as "prevFrom",
      now() as "now",
      least(now(), f + ${step}::interval) as "elapsedEnd",
      to_char(now(), 'YYYY-MM-DD') as "today"
    from (
      select date_trunc(${period}, now()) + (${offset}::int * ${step}::interval) as f
    ) bounds
  `;
  return row;
}

function clampOffset(offset: number | undefined) {
  if (!offset || !Number.isFinite(offset)) return 0;
  return Math.max(-120, Math.min(0, Math.trunc(offset)));
}

function formatDayLabel(day: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("pt-BR", { ...options, timeZone: "UTC" }).format(new Date(`${day}T12:00:00Z`));
}

function rangeLabel(period: TimePeriod, from: string, lastDay: string) {
  if (period === "day") {
    return formatDayLabel(from, { weekday: "long", day: "numeric", month: "long" });
  }
  if (period === "month") {
    const label = formatDayLabel(from, { month: "long", year: "numeric" });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }
  const sameMonth = from.slice(0, 7) === lastDay.slice(0, 7);
  const start = formatDayLabel(from, sameMonth ? { day: "numeric" } : { day: "numeric", month: "short" });
  const end = formatDayLabel(lastDay, { day: "numeric", month: "short", year: "numeric" });
  return `${start} – ${end}`;
}

function toShares(
  map: Map<string, { label: string; detail?: string; color: string; seconds: number }>,
  total: number
): TimeShare[] {
  return [...map.entries()]
    .map(([id, value]) => ({ id, ...value, share: total > 0 ? value.seconds / total : 0 }))
    .sort((a, b) => b.seconds - a.seconds);
}

function computeStreak(days: Set<string>, today: string) {
  // Dias úteis seguidos com registro; fim de semana sem registro não quebra a sequência.
  const cursor = new Date(`${today}T12:00:00Z`);
  if (!days.has(today)) cursor.setUTCDate(cursor.getUTCDate() - 1);
  let streak = 0;
  for (let guard = 0; guard < 400; guard += 1) {
    const key = cursor.toISOString().slice(0, 10);
    const weekday = cursor.getUTCDay();
    if (days.has(key)) {
      streak += 1;
    } else if (weekday !== 0 && weekday !== 6) {
      break;
    }
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

function percent(value: number) {
  return `${Math.round(value * 100)}%`;
}

function buildInsights(report: Omit<TimeInsights, "insights">, peak: { dow: number; hour: number; seconds: number } | null) {
  const insights: string[] = [];
  const unit = UNIT_LABEL[report.period];

  if (report.totalSeconds === 0) {
    if (report.previousSeconds > 0) {
      insights.push(
        `Nenhum tempo registrado ${report.isCurrent ? unit.current : "neste período"}; ${unit.previous} até este ponto foram ${formatDuration(report.previousSeconds)}.`
      );
    }
    return insights;
  }

  if (report.deltaRatio !== null && Math.abs(report.deltaRatio) >= 0.05) {
    const direction = report.deltaRatio > 0 ? "a mais" : "a menos";
    const reference = report.isCurrent ? `${unit.previous} até este mesmo ponto` : unit.previous;
    insights.push(`${percent(Math.abs(report.deltaRatio))} ${direction} que ${reference} (${formatDuration(report.previousSeconds)}).`);
  } else if (report.deltaRatio !== null) {
    insights.push(`Ritmo estável em relação ao período anterior (${formatDuration(report.previousSeconds)}).`);
  }

  const topProject = report.projects[0];
  const runnerUp = report.projects[1];
  if (topProject && runnerUp && topProject.share >= 0.5 && topProject.seconds >= runnerUp.seconds * 1.4) {
    insights.push(`${topProject.label} concentrou ${percent(topProject.share)} do tempo.`);
  }

  if (report.sessionCount >= 3) {
    if (report.deepWorkShare >= 0.6) {
      insights.push(`${percent(report.deepWorkShare)} do tempo foi em blocos de foco de 25 min ou mais.`);
    } else if (report.averageSessionSeconds < DEEP_WORK_MIN_SECONDS) {
      insights.push(
        `Sessões fragmentadas: média de ${formatDuration(report.averageSessionSeconds)}; só ${percent(report.deepWorkShare)} do tempo em blocos de 25 min+.`
      );
    }
  }

  if (report.period !== "day" && report.elapsedDays > 1) {
    const missing = report.elapsedDays - report.activeDays;
    if (missing > 0) {
      insights.push(`Sem registro em ${missing} de ${report.elapsedDays} dias do período.`);
    }
  }

  if (peak && peak.seconds > 0) {
    insights.push(
      `Nas últimas 8 semanas, seu pico é entre ${peak.hour}h e ${peak.hour + 2}h, com destaque às ${WEEKDAY_LONG[peak.dow]}.`
    );
  }

  if (report.focusGoalSeconds > 0 && report.period !== "day" && report.elapsedDays > 1) {
    insights.push(
      `Meta diária de ${formatDuration(report.focusGoalSeconds)} batida em ${report.goalDaysHit} de ${report.elapsedDays} dias.`
    );
  } else if (report.focusGoalSeconds > 0 && report.period === "day") {
    const ratio = report.totalSeconds / report.focusGoalSeconds;
    insights.push(
      ratio >= 1
        ? `Meta diária batida (${percent(ratio)} de ${formatDuration(report.focusGoalSeconds)}).`
        : `${percent(ratio)} da meta diária; faltam ${formatDuration(report.focusGoalSeconds - report.totalSeconds)}.`
    );
  }

  if (report.estimateRatio !== null) {
    const ratio = report.estimateRatio;
    if (ratio >= 1.15) {
      insights.push(`Tarefas concluídas levaram em média ${ratio.toFixed(1).replace(".", ",")}× o estimado: vale estimar com folga.`);
    } else if (ratio <= 0.85) {
      insights.push(`Tarefas concluídas levaram ${percent(1 - ratio)} menos que o estimado.`);
    } else {
      insights.push("Suas estimativas estão batendo com o tempo real (±15%).");
    }
  }

  if (report.completedTaskCount > 0) {
    insights.push(
      `${report.completedTaskCount} ${report.completedTaskCount === 1 ? "tarefa com tempo já foi concluída" : "tarefas com tempo já foram concluídas"}.`
    );
  }

  if (report.isCurrent && report.streakDays >= 3) {
    insights.push(`Sequência atual: ${report.streakDays} dias úteis seguidos com registro.`);
  }

  return insights;
}

export async function getTimeInsights(userId: string, filter: TimeInsightsFilter): Promise<TimeInsights> {
  const sql = db();
  const period = filter.period;
  const offset = clampOffset(filter.offset);
  const projectId = filter.projectId || null;
  const bounds = await resolveBounds(period, offset);
  const { from, to, prevFrom, now, elapsedEnd } = bounds;
  const elapsedMs = Math.max(0, elapsedEnd.getTime() - from.getTime());
  // Mês anterior mais curto que o trecho decorrido (ex.: 30/03 vs fevereiro): nunca invade o período atual.
  const prevTo = new Date(Math.min(prevFrom.getTime() + elapsedMs, from.getTime()));
  const bucketUnit = period === "day" ? "hour" : "day";
  const bucketStep = period === "day" ? "1 hour" : "1 day";
  const heatmapFrom = new Date(now.getTime() - HEATMAP_DAYS * 86400000);

  const [sessionRows, previousRow, bucketRows, timelineRows, heatmapRows, dayRows] = await Promise.all([
    sql<
      Array<
        Omit<TimeInsightSession, "projectColor"> & {
          colorIndex: number;
          clippedSeconds: number;
          taskStatus: string;
        }
      >
    >`
      select
        s.id,
        s.task_id as "taskId",
        t.title as "taskTitle",
        t.status as "taskStatus",
        t.project_id as "projectId",
        p.name as "projectName",
        (
          select count(*)::int from projects older
          where older.owner_id = p.owner_id and (older.created_at, older.id) < (p.created_at, p.id)
        ) as "colorIndex",
        s.started_at as "startedAt",
        s.ended_at as "endedAt",
        to_char(s.started_at, 'YYYY-MM-DD') as "day",
        to_char(s.started_at, 'HH24:MI') as "startTime",
        to_char(s.ended_at, 'HH24:MI') as "endTime",
        case
          when s.ended_at is null then greatest(1, floor(extract(epoch from (now() - s.started_at)))::int)
          else s.duration_seconds
        end as "durationSeconds",
        greatest(0, floor(extract(epoch from (
          least(coalesce(s.ended_at, now()), ${to}::timestamptz) - greatest(s.started_at, ${from}::timestamptz)
        ))))::int as "clippedSeconds",
        s.source
      from work_sessions s
      join tasks t on t.id = s.task_id
      join projects p on p.id = t.project_id
      where s.owner_id = ${userId}
        and s.started_at < ${to}
        and coalesce(s.ended_at, now()) > ${from}
        and (${projectId}::text is null or t.project_id = ${projectId})
      order by s.started_at desc
    `,
    sql<{ seconds: number }[]>`
      select coalesce(sum(greatest(0, extract(epoch from (
        least(coalesce(s.ended_at, now()), ${prevTo}::timestamptz) - greatest(s.started_at, ${prevFrom}::timestamptz)
      )))), 0)::int as seconds
      from work_sessions s
      join tasks t on t.id = s.task_id
      where s.owner_id = ${userId}
        and s.started_at < ${prevTo}
        and coalesce(s.ended_at, now()) > ${prevFrom}
        and (${projectId}::text is null or t.project_id = ${projectId})
    `,
    sql<{ key: string; bucketStart: Date; dow: number; dayOfMonth: number; hour: number; day: string }[]>`
      select
        to_char(g, 'YYYY-MM-DD"T"HH24') as key,
        g as "bucketStart",
        extract(isodow from g)::int as dow,
        extract(day from g)::int as "dayOfMonth",
        extract(hour from g)::int as hour,
        to_char(g, 'YYYY-MM-DD') as day
      from generate_series(${from}::timestamptz, ${to}::timestamptz - interval '1 microsecond', ${bucketStep}::interval) g
    `,
    sql<{ key: string; projectId: string; seconds: number }[]>`
      select
        to_char(g, 'YYYY-MM-DD"T"HH24') as key,
        t.project_id as "projectId",
        sum(greatest(0, extract(epoch from (
          least(coalesce(s.ended_at, now()), ${to}::timestamptz, g + ${bucketStep}::interval) - greatest(s.started_at, ${from}::timestamptz, g)
        ))))::int as seconds
      from work_sessions s
      join tasks t on t.id = s.task_id
      cross join lateral generate_series(
        date_trunc(${bucketUnit}, greatest(s.started_at, ${from}::timestamptz)),
        least(coalesce(s.ended_at, now()), ${to}::timestamptz) - interval '1 microsecond',
        ${bucketStep}::interval
      ) g
      where s.owner_id = ${userId}
        and s.started_at < ${to}
        and coalesce(s.ended_at, now()) > ${from}
        and (${projectId}::text is null or t.project_id = ${projectId})
      group by 1, 2
    `,
    sql<{ dow: number; hour: number; seconds: number }[]>`
      select
        extract(isodow from h)::int as dow,
        extract(hour from h)::int as hour,
        sum(greatest(0, extract(epoch from (
          least(coalesce(s.ended_at, now()), h + interval '1 hour') - greatest(s.started_at, h)
        ))))::int as seconds
      from work_sessions s
      join tasks t on t.id = s.task_id
      cross join lateral generate_series(
        date_trunc('hour', s.started_at),
        coalesce(s.ended_at, now()) - interval '1 microsecond',
        interval '1 hour'
      ) h
      where s.owner_id = ${userId}
        and s.started_at >= ${heatmapFrom}
        and (${projectId}::text is null or t.project_id = ${projectId})
      group by 1, 2
    `,
    sql<{ day: string }[]>`
      select distinct to_char(started_at, 'YYYY-MM-DD') as day
      from work_sessions
      where owner_id = ${userId}
        and started_at >= now() - interval '400 days'
    `
  ]);

  const sessions: TimeInsightSession[] = [];
  const projectMap = new Map<string, { label: string; color: string; seconds: number }>();
  const taskMap = new Map<string, { label: string; detail: string; color: string; seconds: number; status: string }>();
  const activeDaySet = new Set<string>();
  let totalSeconds = 0;
  let deepWorkSeconds = 0;
  let longestSession: TimeInsights["longestSession"] = null;

  for (const row of sessionRows) {
    const color = projectColor(row.colorIndex);
    const { colorIndex: _colorIndex, clippedSeconds, taskStatus, ...rest } = row;
    // Cliques acidentais antigos (antes do descarte automático) não poluem a lista.
    const accidental = row.source === "timer" && row.endedAt && row.durationSeconds < 60;
    if (!accidental) sessions.push({ ...rest, projectColor: color });
    if (clippedSeconds <= 0) continue;

    totalSeconds += clippedSeconds;
    activeDaySet.add(row.day);
    if (row.durationSeconds >= DEEP_WORK_MIN_SECONDS) deepWorkSeconds += clippedSeconds;
    if (!longestSession || row.durationSeconds > longestSession.seconds) {
      longestSession = { seconds: row.durationSeconds, taskTitle: row.taskTitle, day: row.day };
    }

    const project = projectMap.get(row.projectId) || { label: row.projectName, color, seconds: 0 };
    project.seconds += clippedSeconds;
    projectMap.set(row.projectId, project);

    const task = taskMap.get(row.taskId) || {
      label: row.taskTitle,
      detail: row.projectName,
      color,
      seconds: 0,
      status: taskStatus
    };
    task.seconds += clippedSeconds;
    taskMap.set(row.taskId, task);
  }

  const taskIds = [...taskMap.keys()];
  const tagRows = taskIds.length
    ? await sql<{ taskId: string; id: string; name: string; color: string }[]>`
        select tt.task_id as "taskId", tg.id, tg.name, tg.color
        from task_tags tt
        join tags tg on tg.id = tt.tag_id
        where tt.task_id in ${sql(taskIds)}
          and tg.user_id = ${userId}
      `
    : [];

  const [goalRow] = await sql<{ minutes: number }[]>`
    select daily_focus_goal_minutes as minutes from users where id = ${userId}
  `;
  const focusGoalSeconds = (goalRow?.minutes ?? 0) * 60;

  const estimateRows = taskIds.length
    ? await sql<{ taskId: string; estimateMinutes: number; status: string; trackedSeconds: number }[]>`
        select
          t.id as "taskId",
          t.estimate_minutes as "estimateMinutes",
          t.status,
          coalesce((
            select sum(
              case when ws.ended_at is null
                then greatest(1, floor(extract(epoch from (now() - ws.started_at)))::int)
                else ws.duration_seconds end
            )
            from work_sessions ws
            where ws.task_id = t.id
          ), 0)::int as "trackedSeconds"
        from tasks t
        where t.id in ${sql(taskIds)}
          and t.owner_id = ${userId}
          and t.estimate_minutes is not null
      `
    : [];

  const estimates: EstimateRow[] = estimateRows
    .map((row) => {
      const task = taskMap.get(row.taskId);
      return {
        taskId: row.taskId,
        taskTitle: task?.label ?? "",
        projectName: task?.detail ?? "",
        color: task?.color ?? projectColor(null),
        status: row.status,
        estimateSeconds: row.estimateMinutes * 60,
        trackedSeconds: row.trackedSeconds
      };
    })
    .sort((a, b) => b.trackedSeconds / b.estimateSeconds - a.trackedSeconds / a.estimateSeconds);

  const doneRatios = estimates
    .filter((row) => row.status === "done" && row.estimateSeconds > 0 && row.trackedSeconds > 0)
    .map((row) => row.trackedSeconds / row.estimateSeconds)
    .sort((a, b) => a - b);
  const estimateRatio =
    doneRatios.length >= 2
      ? doneRatios.length % 2
        ? doneRatios[(doneRatios.length - 1) / 2]
        : (doneRatios[doneRatios.length / 2 - 1] + doneRatios[doneRatios.length / 2]) / 2
      : null;

  const tagMap = new Map<string, { label: string; color: string; seconds: number }>();
  const taggedTasks = new Set<string>();
  for (const row of tagRows) {
    const seconds = taskMap.get(row.taskId)?.seconds ?? 0;
    taggedTasks.add(row.taskId);
    const tag = tagMap.get(row.id) || { label: row.name, color: row.color, seconds: 0 };
    tag.seconds += seconds;
    tagMap.set(row.id, tag);
  }
  const untaggedSeconds = taskIds.filter((id) => !taggedTasks.has(id)).reduce((sum, id) => sum + (taskMap.get(id)?.seconds ?? 0), 0);
  if (untaggedSeconds > 0) {
    tagMap.set("__none__", { label: "Sem etiqueta", color: "#4b5160", seconds: untaggedSeconds });
  }

  const timelineIndex = new Map<string, Map<string, number>>();
  for (const row of timelineRows) {
    const bucket = timelineIndex.get(row.key) || new Map<string, number>();
    bucket.set(row.projectId, (bucket.get(row.projectId) ?? 0) + row.seconds);
    timelineIndex.set(row.key, bucket);
  }

  const projects = toShares(projectMap, totalSeconds);
  const projectOrder = projects.map((project) => project.id);
  const nowKeyHour = new Date(now);
  const buckets: TimelineBucket[] = bucketRows.map((row) => {
    const segmentsMap = timelineIndex.get(row.key) || new Map<string, number>();
    const segments = projectOrder
      .filter((id) => (segmentsMap.get(id) ?? 0) > 0)
      .map((id) => ({ projectId: id, seconds: segmentsMap.get(id) ?? 0 }));
    const totalBucket = segments.reduce((sum, segment) => sum + segment.seconds, 0);
    const bucketStart = new Date(row.bucketStart);
    const bucketEnd = new Date(bucketStart.getTime() + (bucketUnit === "hour" ? 3600000 : 86400000));
    const isCurrent = bucketStart <= nowKeyHour && nowKeyHour < bucketEnd;
    const weekday = WEEKDAY_SHORT[row.dow - 1];
    return {
      key: row.key,
      label:
        bucketUnit === "hour" ? `${row.hour}h` : period === "week" ? weekday : String(row.dayOfMonth),
      longLabel:
        bucketUnit === "hour"
          ? `${row.hour}h–${row.hour + 1}h`
          : formatDayLabel(row.day, { weekday: "long", day: "numeric", month: "short" }),
      isCurrent,
      isFuture: bucketStart > nowKeyHour,
      totalSeconds: totalBucket,
      segments
    };
  });

  const cells = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
  let heatmapMax = 0;
  for (const row of heatmapRows) {
    cells[row.dow - 1][row.hour] += row.seconds;
    heatmapMax = Math.max(heatmapMax, cells[row.dow - 1][row.hour]);
  }

  let peak: { dow: number; hour: number; seconds: number } | null = null;
  if (heatmapMax > 0) {
    let bestHour = 0;
    let bestHourSeconds = -1;
    for (let hour = 0; hour < 23; hour += 1) {
      const windowSeconds = cells.reduce((sum, day) => sum + day[hour] + day[hour + 1], 0);
      if (windowSeconds > bestHourSeconds) {
        bestHourSeconds = windowSeconds;
        bestHour = hour;
      }
    }
    const dayTotals = cells.map((day) => day.reduce((sum, value) => sum + value, 0));
    const bestDow = dayTotals.indexOf(Math.max(...dayTotals));
    peak = { dow: bestDow, hour: bestHour, seconds: bestHourSeconds };
  }

  const fromDay = bucketRows[0]?.day ?? bounds.today;
  const lastDay = bucketRows[bucketRows.length - 1]?.day ?? fromDay;
  const elapsedDays =
    period === "day" ? 1 : Math.max(1, bucketRows.filter((row) => new Date(row.bucketStart) <= now).length);
  const previousSeconds = previousRow[0]?.seconds ?? 0;
  const completedTaskCount = [...taskMap.values()].filter((task) => task.status === "done").length;

  const report: Omit<TimeInsights, "insights"> = {
    period,
    offset,
    rangeLabel: rangeLabel(period, fromDay, lastDay),
    from: from.toISOString(),
    to: to.toISOString(),
    isCurrent: offset === 0,
    today: bounds.today,
    totalSeconds,
    previousSeconds,
    deltaRatio: previousSeconds > 0 ? (totalSeconds - previousSeconds) / previousSeconds : null,
    activeDays: activeDaySet.size,
    elapsedDays,
    averagePerActiveDay: activeDaySet.size ? Math.round(totalSeconds / activeDaySet.size) : 0,
    sessionCount: sessionRows.filter(
      (row) => row.clippedSeconds > 0 && !(row.source === "timer" && row.endedAt && row.durationSeconds < 60)
    ).length,
    averageSessionSeconds: 0,
    longestSession,
    deepWorkSeconds,
    deepWorkShare: totalSeconds ? deepWorkSeconds / totalSeconds : 0,
    streakDays: computeStreak(new Set(dayRows.map((row) => row.day)), bounds.today),
    completedTaskCount,
    projects,
    tasks: toShares(
      new Map([...taskMap.entries()].map(([id, task]) => [id, { label: task.label, detail: task.detail, color: task.color, seconds: task.seconds }])),
      totalSeconds
    ),
    tags: toShares(tagMap, totalSeconds),
    legend: projects.map((project) => ({ id: project.id, label: project.label, color: project.color })),
    timeline: {
      unit: bucketUnit,
      buckets,
      maxSeconds: Math.max(0, ...buckets.map((bucket) => bucket.totalSeconds))
    },
    heatmap: { cells, maxSeconds: heatmapMax, days: HEATMAP_DAYS },
    sessions,
    focusGoalSeconds,
    goalDaysHit:
      focusGoalSeconds > 0
        ? period === "day"
          ? totalSeconds >= focusGoalSeconds
            ? 1
            : 0
          : buckets.filter((bucket) => !bucket.isFuture && bucket.totalSeconds >= focusGoalSeconds).length
        : 0,
    estimates,
    estimateRatio
  };
  report.averageSessionSeconds = report.sessionCount ? Math.round(totalSeconds / report.sessionCount) : 0;

  return { ...report, insights: buildInsights(report, peak) };
}
