import Link from "next/link";

import { todayIsoDate } from "@/lib/format";
import { FocusGoal } from "@/components/focus-goal";
import { getDayLoad, getDayStatus } from "@/server/daily-ritual";
import { formatDuration } from "@/lib/format";
import { requireCurrentUser } from "@/server/auth";
import { getTaskFilterFromSearchParams } from "@/server/filters";
import { getDashboardMetrics, getProjects, getTasks, getTags, getCatalogs } from "@/server/remind-service";
import { QuickCreateTask } from "@/components/new-task-modal";
import { FilterBar } from "@/components/filter-bar";
import { TaskTable } from "@/components/task-table";
import { TaskDayList } from "@/components/task-day-list";

type DashboardPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await requireCurrentUser();
  const resolvedSearchParams = await searchParams;
  const filter = getTaskFilterFromSearchParams(resolvedSearchParams);
  if (resolvedSearchParams.due === undefined) {
    filter.due = "myday";
  }

  const [metrics, projects, tasks, allTags, catalogs] = await Promise.all([
    getDashboardMetrics(user.id),
    getProjects(user.id),
    getTasks(user.id, filter),
    getTags(user.id),
    getCatalogs(user.id)
  ]);

  const [dayLoad, dayStatus] = await Promise.all([
    getDayLoad(user.id, metrics.focusGoalMinutes, metrics.trackedSecondsToday),
    getDayStatus(user.id)
  ]);
  const ritualClosing = dayStatus.hour >= 17 && !dayStatus.closed;
  const ritualLabel = !dayStatus.planned && !ritualClosing ? "Planejar o dia" : ritualClosing ? "Encerrar o dia" : "Carga";
  const ritualHref = ritualClosing ? "/app/dia?modo=encerrar" : "/app/dia?modo=planejar";
  const overload = dayLoad.projectedSeconds > dayLoad.goalSeconds && dayLoad.plannedCount > 0;

  const isRemindersView = filter.due === "soon" || filter.due === "overdue";
  const isMyDayView = filter.due === "myday";
  const isPlainMyDay =
    isMyDayView &&
    !filter.search &&
    (!filter.status || filter.status === "all") &&
    (!filter.priority || filter.priority === "all") &&
    !filter.projectId;

  const heading = isRemindersView ? "Lembretes" : filter.due === "all" ? "Todas as tarefas" : "Meu dia";

  return (
    <div className={`issues-view${isPlainMyDay ? " my-day-view" : ""}`}>
      <div className="issues-toolbar desktop-toolbar">
        <div>
          <h1>{heading}</h1>
        </div>
        <div className="issues-toolbar-actions">
          {projects.length > 0 ? (
            <QuickCreateTask
              projects={projects}
              statuses={catalogs.statuses}
              priorities={catalogs.priorities}
              tags={allTags}
              defaultDueDate={todayIsoDate()}
            />
          ) : null}
        </div>
      </div>

      <div className="metrics-strip desktop-toolbar" aria-label="Resumo operacional">
        <Link className="metric-pill" href="/app?due=all">
          <span className="metric-pill-label">Abertas</span>
          <strong className="metric-pill-value">{metrics.openTasks}</strong>
        </Link>

        <Link className={`metric-pill accent-soon${metrics.dueSoon > 0 ? " hot" : ""}`} href="/app?due=soon">
          <span className="metric-pill-label">Hoje</span>
          <strong className="metric-pill-value">{metrics.dueSoon}</strong>
        </Link>

        <Link className={`metric-pill accent-overdue${metrics.overdue > 0 ? " hot" : ""}`} href="/app?due=overdue">
          <span className="metric-pill-label">Atrasadas</span>
          <strong className="metric-pill-value">{metrics.overdue}</strong>
        </Link>

        <div className="metric-pill accent-projects">
          <span className="metric-pill-label">Projetos</span>
          <strong className="metric-pill-value">{metrics.totalProjects}</strong>
        </div>

        <FocusGoal trackedSeconds={metrics.trackedSecondsToday} goalMinutes={metrics.focusGoalMinutes} />

        <Link
          className={`metric-pill ritual-pill${overload ? " over" : ""}${!dayStatus.planned || ritualClosing ? " cta" : ""}`}
          href={ritualHref as never}
          title={`Previsto ${formatDuration(dayLoad.projectedSeconds)} para a meta de ${formatDuration(dayLoad.goalSeconds)}`}
        >
          <span className="metric-pill-label">{ritualLabel}</span>
          <strong className="metric-pill-value">
            {formatDuration(dayLoad.projectedSeconds)}
            <span className="focus-goal-of"> previstas</span>
          </strong>
        </Link>
      </div>

      <div className="desktop-toolbar">
        <FilterBar
          projects={projects}
          filter={filter}
          statuses={catalogs.statuses}
          priorities={catalogs.priorities}
        />
      </div>

      <div className="desktop-only">
        <TaskTable
          tasks={tasks}
          projects={projects}
          allTags={allTags}
          statuses={catalogs.statuses}
          priorities={catalogs.priorities}
          showProjectColumn
          emptyTitle={isPlainMyDay ? "Nenhuma tarefa para hoje." : undefined}
          emptyHint={
            isPlainMyDay
              ? "O Meu dia mostra só o que vence hoje ou já atrasou. O restante fica nos projetos."
              : undefined
          }
        />
      </div>

      <div className="phone-only">
        {isPlainMyDay ? (
          <div className="phone-focus-goal">
            <FocusGoal trackedSeconds={metrics.trackedSecondsToday} goalMinutes={metrics.focusGoalMinutes} variant="card" />
            <Link className={`phone-ritual-link${overload ? " over" : ""}`} href={ritualHref as never}>
              {ritualLabel === "Carga" ? "Ver plano do dia" : ritualLabel} · {formatDuration(dayLoad.projectedSeconds)} previstas
            </Link>
          </div>
        ) : null}
        <TaskDayList
          tasks={tasks}
          projects={projects}
          allTags={allTags}
          statuses={catalogs.statuses}
          priorities={catalogs.priorities}
          defaultDueDate={todayIsoDate()}
          grouped={isMyDayView}
          emptyTitle={isPlainMyDay ? "Nada para hoje" : "Nenhuma tarefa nessa visão."}
          emptyHint={
            isPlainMyDay
              ? "Quando criar tarefas com prazo de hoje, elas aparecem aqui."
              : "Limpe os filtros ou crie uma tarefa dentro de um projeto."
          }
        />
      </div>
    </div>
  );
}
