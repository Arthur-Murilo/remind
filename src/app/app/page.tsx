import Link from "next/link";

import { formatDuration } from "@/lib/format";
import { requireCurrentUser } from "@/server/auth";
import { getTaskFilterFromSearchParams } from "@/server/filters";
import { getDashboardMetrics, getProjects, getTasks, getTags, getCatalogs } from "@/server/remind-service";
import { QuickCreateTask } from "@/components/new-task-modal";
import { FilterBar } from "@/components/filter-bar";
import { TaskTable } from "@/components/task-table";

type DashboardPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await requireCurrentUser();
  const resolvedSearchParams = await searchParams;
  const filter = getTaskFilterFromSearchParams(resolvedSearchParams);

  const [metrics, projects, tasks, allTags, catalogs] = await Promise.all([
    getDashboardMetrics(user.id),
    getProjects(user.id),
    getTasks(user.id, filter),
    getTags(user.id),
    getCatalogs(user.id)
  ]);

  const isRemindersView = filter.due === "soon" || filter.due === "overdue";

  return (
    <div className="issues-view">
      <div className="issues-toolbar">
        <div>
          <h1>{isRemindersView ? "Lembretes" : "Meu dia"}</h1>
        </div>
        <div className="issues-toolbar-actions">
          {projects.length > 0 ? (
            <QuickCreateTask
              projects={projects}
              statuses={catalogs.statuses}
              priorities={catalogs.priorities}
            />
          ) : null}
        </div>
      </div>

      <div className="metrics-strip" aria-label="Resumo operacional">
        <Link className="metric-pill" href="/app">
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

        <Link className="metric-pill" href={"/app/tempo" as any}>
          <span className="metric-pill-label">Tempo hoje</span>
          <strong className="metric-pill-value">{formatDuration(metrics.trackedSecondsToday)}</strong>
        </Link>
      </div>

      <FilterBar
        projects={projects}
        filter={filter}
        statuses={catalogs.statuses}
        priorities={catalogs.priorities}
      />

      <TaskTable
        tasks={tasks}
        projects={projects}
        allTags={allTags}
        statuses={catalogs.statuses}
        priorities={catalogs.priorities}
        showProjectColumn
      />
    </div>
  );
}
