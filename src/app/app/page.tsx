import Link from "next/link";

import { formatDate, priorityLabel, statusLabel, recurrenceLabel } from "@/lib/format";
import { requireCurrentUser } from "@/server/auth";
import { getTaskFilterFromSearchParams } from "@/server/filters";
import { getDashboardMetrics, getProjects, getTasks, getTags } from "@/server/remind-service";
import { TaskCheckbox } from "@/components/task-checkbox";
import { EditTaskModal } from "@/components/edit-task-modal";
import { NewTaskModal } from "@/components/new-task-modal";
import { SubtaskList } from "@/components/subtask-list";
import { FilterBar } from "@/components/filter-bar";

type DashboardPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function projectDotClass(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash + name.charCodeAt(i) * (i + 1)) % 6;
  }
  return `project-dot c${hash}`;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await requireCurrentUser();
  const resolvedSearchParams = await searchParams;
  const filter = getTaskFilterFromSearchParams(resolvedSearchParams);

  const [metrics, projects, tasks, allTags] = await Promise.all([
    getDashboardMetrics(user.id),
    getProjects(user.id),
    getTasks(user.id, filter),
    getTags(user.id)
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
            <NewTaskModal projects={projects} allTags={allTags} />
          ) : null}
        </div>
      </div>

      <div className="metrics-banner" aria-label="Resumo operacional">
        <Link className="metric-card accent-open" href="/app">
          <div className="metric-card-header">
            <span>Tarefas abertas</span>
            <span aria-hidden="true">📋</span>
          </div>
          <div className="metric-value">{metrics.openTasks}</div>
        </Link>

        <Link className="metric-card accent-soon" href="/app?due=soon">
          <div className="metric-card-header">
            <span>Vencendo em breve</span>
            <span aria-hidden="true">⏳</span>
          </div>
          <div className="metric-value">{metrics.dueSoon}</div>
        </Link>

        <Link className="metric-card accent-overdue" href="/app?due=overdue">
          <div className="metric-card-header">
            <span>Atrasadas</span>
            <span aria-hidden="true">⚠️</span>
          </div>
          <div className="metric-value">{metrics.overdue}</div>
        </Link>

        <div className="metric-card accent-projects">
          <div className="metric-card-header">
            <span>Projetos ativos</span>
            <span aria-hidden="true">📁</span>
          </div>
          <div className="metric-value">{metrics.totalProjects}</div>
        </div>
      </div>

      <FilterBar projects={projects} filter={filter} />

      <div className="issue-head" aria-hidden="true">
        <span />
        <span>Tarefa</span>
        <span className="hide-md">Projeto</span>
        <span>Status</span>
        <span>Prioridade</span>
        <span>Prazo</span>
        <span />
      </div>

      <div className="issue-list" aria-label="Lista de tarefas">
        {tasks.length ? (
          tasks.map((task) => (
            <article className="issue-row" key={task.id}>
              <TaskCheckbox taskId={task.id} projectId={task.projectId} title={task.title} initialStatus={task.status} />
              <div className="issue-title">
                <strong>{task.title}</strong>
                {task.description ? <span>{task.description}</span> : null}

                {task.tags && task.tags.length > 0 && (
                  <div className="tag-list-inline">
                    {task.tags.slice(0, 5).map((t) => (
                      <span key={t.id} className="tag-badge">
                        <span className="tag-dot" style={{ backgroundColor: t.color || "var(--primary)" }} />
                        {t.name}
                      </span>
                    ))}
                  </div>
                )}

                <SubtaskList taskId={task.id} subtasks={task.subtasks} />
              </div>
              <div className="issue-cell project">
                <span className={projectDotClass(task.projectName || "")} aria-hidden="true" />
                {task.projectName}
              </div>
              <div className="issue-cell">
                <span className={`badge ${task.status}`}>{statusLabel(task.status)}</span>
                {recurrenceLabel(task.recurrence) && (
                  <span className="badge" style={{ marginLeft: "4px", background: "var(--surface-hover)", border: "1px solid var(--line-strong)" }}>
                    {recurrenceLabel(task.recurrence)}
                  </span>
                )}
              </div>
              <div className="issue-cell">
                <span className={`badge priority-${task.priority}`}>{priorityLabel(task.priority)}</span>
              </div>
              <div className="issue-cell">{formatDate(task.dueDate)}</div>
              <div className="issue-cell">
                <EditTaskModal task={task} projects={projects} allTags={allTags} />
              </div>
            </article>
          ))
        ) : (
          <div className="empty-state">
            <strong>Nenhuma tarefa nessa visão.</strong>
            <span>Limpe os filtros ou crie uma tarefa dentro de um projeto.</span>
          </div>
        )}
      </div>
    </div>
  );
}
