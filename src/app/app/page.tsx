import Link from "next/link";

import { formatDate, priorityLabel, statusLabel } from "@/lib/format";
import { createProjectAction, markReminderAsReadAction } from "@/server/actions";
import { requireCurrentUser } from "@/server/auth";
import { getTaskFilterFromSearchParams } from "@/server/filters";
import { getDashboardMetrics, getProjects, getReminders, getTasks } from "@/server/remind-service";

type DashboardPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const user = await requireCurrentUser();
  const resolvedSearchParams = await searchParams;
  const filter = getTaskFilterFromSearchParams(resolvedSearchParams);

  const [metrics, projects, reminders, tasks] = await Promise.all([
    getDashboardMetrics(user.id),
    getProjects(user.id),
    getReminders(user.id),
    getTasks(user.id, filter)
  ]);

  return (
    <div className="home-layout">
      <section className="work-surface">
        <div className="surface-head">
          <div>
            <h1>Prioridades</h1>
            <p className="muted">Tarefas abertas, prazos e projetos ativos em uma tela enxuta.</p>
          </div>

          <div className="focus-strip" aria-label="Resumo do trabalho">
            <span>
              <strong>{metrics.openTasks}</strong> abertas
            </span>
            <span>
              <strong>{metrics.dueSoon}</strong> vencendo
            </span>
            <span>
              <strong>{metrics.overdue}</strong> atrasadas
            </span>
          </div>
        </div>

        <form className="filter-bar" method="get">
          <input name="search" defaultValue={filter.search || ""} placeholder="Buscar tarefa" aria-label="Buscar tarefa" />

          <select name="projectId" defaultValue={filter.projectId || ""} aria-label="Filtrar por projeto">
            <option value="">Todos os projetos</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>

          <select name="status" defaultValue={filter.status || "all"} aria-label="Filtrar por status">
            <option value="all">Todos os status</option>
            <option value="todo">A fazer</option>
            <option value="in_progress">Em andamento</option>
            <option value="done">Concluida</option>
          </select>

          <select name="due" defaultValue={filter.due || "all"} aria-label="Filtrar por prazo">
            <option value="all">Todos os prazos</option>
            <option value="overdue">Atrasadas</option>
            <option value="soon">Vencendo</option>
            <option value="none">Sem prazo</option>
          </select>

          <button className="button compact" type="submit">
            Filtrar
          </button>
          <Link className="button-ghost compact" href="/app">
            Limpar
          </Link>
        </form>

        <div className="task-list" aria-label="Lista de tarefas">
          {tasks.length ? (
            tasks.map((task) => (
              <article className="task-row" key={task.id}>
                <div className="task-check" aria-hidden="true" />
                <div className="task-main">
                  <div className="task-title-line">
                    <h2>{task.title}</h2>
                    <Link className="link-button" href={`/app/tasks/${task.id}/edit`}>
                      Editar
                    </Link>
                  </div>
                  {task.description ? <p>{task.description}</p> : null}
                  <div className="meta">
                    <span>{task.projectName}</span>
                    <span>{formatDate(task.dueDate)}</span>
                  </div>
                </div>
                <div className="task-state">
                  <span className={`badge ${task.status}`}>{statusLabel(task.status)}</span>
                  <span className={`badge priority-${task.priority}`}>{priorityLabel(task.priority)}</span>
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
      </section>

      <aside className="side-rail">
        <section className="rail-panel" id="projects">
          <div className="rail-head">
            <div>
              <h2>Projetos</h2>
              <span>{metrics.totalProjects} ativos</span>
            </div>
          </div>

          <div className="project-list compact-list">
            {projects.length ? (
              projects.map((project) => (
                <Link key={project.id} href={`/app/projects/${project.id}`} className="project-card">
                  <span>{project.name}</span>
                  <small>{project.openTaskCount ?? 0} abertas</small>
                </Link>
              ))
            ) : (
              <div className="empty-compact">Nenhum projeto ainda.</div>
            )}
          </div>

          <details className="inline-create">
            <summary>Novo projeto</summary>
            <form action={createProjectAction} className="form-grid">
              <div className="field">
                <label htmlFor="project-name">Nome</label>
                <input id="project-name" name="name" required placeholder="Ex.: Produto pessoal" />
              </div>
              <div className="field">
                <label htmlFor="project-description">Descricao</label>
                <textarea id="project-description" name="description" placeholder="Objetivo resumido" />
              </div>
              <button className="button compact" type="submit">
                Criar
              </button>
            </form>
          </details>
        </section>

        <section className="rail-panel" id="reminders">
          <div className="rail-head">
            <div>
              <h2>Lembretes</h2>
              <span>Somente in-app</span>
            </div>
          </div>

          <div className="reminder-list">
            {reminders.length ? (
              reminders.map((reminder) => (
                <article className="reminder-card" key={reminder.id}>
                  <div>
                    <strong>{reminder.taskTitle}</strong>
                    <span>{formatDate(reminder.dueDate)}</span>
                  </div>
                  <form action={markReminderAsReadAction}>
                    <input type="hidden" name="reminderId" value={reminder.id} />
                    <button className="button-ghost compact" type="submit">
                      Visto
                    </button>
                  </form>
                </article>
              ))
            ) : (
              <div className="empty-compact">Sem lembretes pendentes.</div>
            )}
          </div>
        </section>
      </aside>
    </div>
  );
}
