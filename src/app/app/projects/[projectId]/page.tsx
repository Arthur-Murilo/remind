import Link from "next/link";
import { notFound } from "next/navigation";

import { createTaskAction } from "@/server/actions";
import { requireCurrentUser } from "@/server/auth";
import { getTaskFilterFromSearchParams } from "@/server/filters";
import { formatDate, priorityLabel, statusLabel } from "@/lib/format";
import { getProjectById, getTasks } from "@/server/remind-service";

type ProjectDetailPageProps = {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ProjectDetailPage({ params, searchParams }: ProjectDetailPageProps) {
  const user = await requireCurrentUser();
  const { projectId } = await params;
  const resolvedSearchParams = await searchParams;
  const project = await getProjectById(user.id, projectId);

  if (!project) {
    notFound();
  }

  const filter = getTaskFilterFromSearchParams({
    ...resolvedSearchParams,
    projectId
  });

  const tasks = await getTasks(user.id, filter);

  return (
    <div className="issues-view">
      <div className="issues-toolbar">
        <div>
          <h1>{project.name}</h1>
          {project.description ? <p className="muted" style={{ margin: "4px 0 0" }}>{project.description}</p> : null}
        </div>
        <div className="issues-toolbar-actions">
          <span className="topbar-meta">{tasks.length} tarefas</span>
          <Link className="button-ghost compact" href="/app">
            Meu dia
          </Link>
        </div>
      </div>

      <div className="split-layout page-section">
        <section>
          <form className="filter-bar" method="get" style={{ padding: "0 0 12px", border: 0 }}>
            <input name="search" defaultValue={filter.search || ""} placeholder="Buscar..." aria-label="Buscar tarefa" />

            <select name="status" defaultValue={filter.status || "all"} aria-label="Filtrar por status">
              <option value="all">Status</option>
              <option value="todo">A fazer</option>
              <option value="in_progress">Em andamento</option>
              <option value="done">Concluida</option>
            </select>

            <select name="priority" defaultValue={filter.priority || "all"} aria-label="Filtrar por prioridade">
              <option value="all">Prioridade</option>
              <option value="high">Alta</option>
              <option value="medium">Media</option>
              <option value="low">Baixa</option>
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
            <Link className="button-ghost compact" href={`/app/projects/${project.id}`}>
              Limpar
            </Link>
          </form>

          <div className="issue-head" aria-hidden="true" style={{ paddingLeft: 0, paddingRight: 0 }}>
            <span />
            <span>Tarefa</span>
            <span className="hide-md">Projeto</span>
            <span>Status</span>
            <span>Prioridade</span>
            <span>Prazo</span>
            <span />
          </div>

          <div className="issue-list" aria-label="Tarefas do projeto">
            {tasks.length ? (
              tasks.map((task) => (
                <article className="issue-row" key={task.id} style={{ paddingLeft: 0, paddingRight: 0 }}>
                  <div className="issue-check" aria-hidden="true" />
                  <div className="issue-title">
                    <strong>{task.title}</strong>
                    {task.description ? <span>{task.description}</span> : null}
                  </div>
                  <div className="issue-cell project">
                    <span className="project-dot c0" aria-hidden="true" />
                    {project.name}
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
              <div className="empty-state" style={{ margin: "16px 0" }}>
                <strong>Nenhuma tarefa neste projeto.</strong>
                <span>Use o formulario ao lado para criar a primeira.</span>
              </div>
            )}
          </div>
        </section>

        <aside className="composer">
          <h2>Nova tarefa</h2>
          <form action={createTaskAction} className="form-grid">
            <input type="hidden" name="projectId" value={project.id} />

            <div className="field">
              <label htmlFor="task-title">Titulo</label>
              <input id="task-title" name="title" required placeholder="Ex.: Fechar backlog" />
            </div>

            <div className="field">
              <label htmlFor="task-description">Descricao</label>
              <textarea id="task-description" name="description" placeholder="Contexto curto" />
            </div>

            <div className="form-row">
              <div className="field">
                <label htmlFor="task-status">Status</label>
                <select id="task-status" name="status" defaultValue="todo">
                  <option value="todo">A fazer</option>
                  <option value="in_progress">Em andamento</option>
                  <option value="done">Concluida</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="task-priority">Prioridade</label>
                <select id="task-priority" name="priority" defaultValue="medium">
                  <option value="high">Alta</option>
                  <option value="medium">Media</option>
                  <option value="low">Baixa</option>
                </select>
              </div>
            </div>

            <div className="field">
              <label htmlFor="task-dueDate">Prazo</label>
              <input id="task-dueDate" name="dueDate" type="date" />
            </div>

            <button className="button" type="submit">
              Criar tarefa
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
