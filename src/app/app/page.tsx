import Link from "next/link";

import { formatDate, priorityLabel, statusLabel } from "@/lib/format";
import { requireCurrentUser } from "@/server/auth";
import { getTaskFilterFromSearchParams } from "@/server/filters";
import { getDashboardMetrics, getProjects, getTasks } from "@/server/remind-service";
import { TaskCheckbox } from "@/components/task-checkbox";

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

  const [metrics, projects, tasks] = await Promise.all([
    getDashboardMetrics(user.id),
    getProjects(user.id),
    getTasks(user.id, filter)
  ]);

  const firstProject = projects[0];
  const isRemindersView = filter.due === "soon" || filter.due === "overdue";

  return (
    <div className="issues-view">
      <div className="issues-toolbar">
        <div>
          <h1>{isRemindersView ? "Lembretes" : "Meu dia"}</h1>
        </div>
        <div className="issues-toolbar-actions">
          <span className="topbar-meta">
            {metrics.openTasks} abertas · {metrics.dueSoon} vencendo · {metrics.overdue} atrasadas
          </span>
          {firstProject ? (
            <Link className="button compact" href={`/app/projects/${firstProject.id}`}>
              Nova tarefa
            </Link>
          ) : null}
        </div>
      </div>

      <form className="filter-bar" method="get">
        <input name="search" defaultValue={filter.search || ""} placeholder="Buscar..." aria-label="Buscar tarefa" />

        <select name="projectId" defaultValue={filter.projectId || ""} aria-label="Filtrar por projeto">
          <option value="">Todos os projetos</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>

        <select name="status" defaultValue={filter.status || "all"} aria-label="Filtrar por status">
          <option value="all">Status</option>
          <option value="todo">A fazer</option>
          <option value="in_progress">Em andamento</option>
          <option value="done">Concluida</option>
        </select>

        <select name="due" defaultValue={filter.due || "all"} aria-label="Filtrar por prazo">
          <option value="all">Prazo</option>
          <option value="overdue">Atrasadas</option>
          <option value="soon">Vencendo</option>
          <option value="none">Sem prazo</option>
        </select>

        <button className="button-secondary compact" type="submit">
          Filtrar
        </button>
        <Link className="button-ghost compact" href="/app">
          Limpar
        </Link>
      </form>

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
              </div>
              <div className="issue-cell project">
                <span className={projectDotClass(task.projectName || "")} aria-hidden="true" />
                {task.projectName}
              </div>
              <div className="issue-cell">
                <span className={`badge ${task.status}`}>{statusLabel(task.status)}</span>
              </div>
              <div className="issue-cell">
                <span className={`badge priority-${task.priority}`}>{priorityLabel(task.priority)}</span>
              </div>
              <div className="issue-cell">{formatDate(task.dueDate)}</div>
              <div className="issue-cell">
                <Link className="link-button" href={`/app/tasks/${task.id}/edit`}>
                  Editar
                </Link>
              </div>
            </article>
          ))
        ) : (
          <div className="empty-state">
            <strong>Nenhuma tarefa nessa visao.</strong>
            <span>Limpe os filtros ou crie uma tarefa dentro de um projeto.</span>
          </div>
        )}
      </div>
    </div>
  );
}
