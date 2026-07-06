import Link from "next/link";
import { notFound } from "next/navigation";

import { createTaskAction } from "@/server/actions";
import { requireCurrentUser } from "@/server/auth";
import { getTaskFilterFromSearchParams } from "@/server/filters";
import { formatDate, priorityLabel, statusLabel } from "@/lib/format";
import { getProjectById, getProjects, getTasks } from "@/server/remind-service";

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

  const [tasks, projects] = await Promise.all([getTasks(user.id, filter), getProjects(user.id)]);

  return (
    <div className="page-grid">
      <section className="hero">
        <div>
          <Link className="link-button" href="/app">
            Voltar ao painel
          </Link>
          <h1 style={{ marginTop: 8 }}>{project.name}</h1>
          <p className="muted">{project.description || "Sem descrição do projeto."}</p>
        </div>
      </section>

      <section className="grid-2">
        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Tarefas do projeto</h2>
              <p className="muted">Acompanhe, filtre e edite as tarefas ligadas a este projeto.</p>
            </div>
          </div>

          <form className="form-grid" method="get">
            <div className="form-row">
              <div className="field">
                <label htmlFor="search">Busca</label>
                <input id="search" name="search" defaultValue={filter.search || ""} placeholder="Título ou descrição" />
              </div>

              <div className="field">
                <label htmlFor="status">Status</label>
                <select id="status" name="status" defaultValue={filter.status || "all"}>
                  <option value="all">Todos</option>
                  <option value="todo">A fazer</option>
                  <option value="in_progress">Em andamento</option>
                  <option value="done">Concluída</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="field">
                <label htmlFor="priority">Prioridade</label>
                <select id="priority" name="priority" defaultValue={filter.priority || "all"}>
                  <option value="all">Todas</option>
                  <option value="high">Alta</option>
                  <option value="medium">Média</option>
                  <option value="low">Baixa</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="due">Prazo</label>
                <select id="due" name="due" defaultValue={filter.due || "all"}>
                  <option value="all">Todos</option>
                  <option value="overdue">Atrasadas</option>
                  <option value="soon">Vencendo em breve</option>
                  <option value="none">Sem prazo</option>
                </select>
              </div>
            </div>

            <div className="actions">
              <button className="button" type="submit">
                Filtrar
              </button>
              <Link className="button-secondary" href={`/app/projects/${project.id}`}>
                Limpar
              </Link>
            </div>
          </form>

          <div className="table-wrap" style={{ marginTop: 18 }}>
            <table className="task-table">
              <thead>
                <tr>
                  <th>Tarefa</th>
                  <th>Status</th>
                  <th>Prioridade</th>
                  <th>Prazo</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tasks.length ? (
                  tasks.map((task) => (
                    <tr key={task.id}>
                      <td>
                        <strong>{task.title}</strong>
                        <div className="muted">{task.description || "Sem descrição."}</div>
                      </td>
                      <td>
                        <span className={`badge ${task.status}`}>{statusLabel(task.status)}</span>
                      </td>
                      <td>
                        <span className={`badge priority-${task.priority}`}>{priorityLabel(task.priority)}</span>
                      </td>
                      <td>{formatDate(task.dueDate)}</td>
                      <td>
                        <Link className="link-button" href={`/app/tasks/${task.id}/edit`}>
                          Editar
                        </Link>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5}>
                      <div className="empty-state">Nenhuma tarefa encontrada neste projeto.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <h2>Nova tarefa</h2>
              <p className="muted">Cadastro direto com prioridade, status e prazo.</p>
            </div>
          </div>

          <form action={createTaskAction} className="form-grid">
            <input type="hidden" name="projectId" value={project.id} />

            <div className="field">
              <label htmlFor="task-title">Título</label>
              <input id="task-title" name="title" required placeholder="Ex.: Fechar backlog da sprint" />
            </div>

            <div className="field">
              <label htmlFor="task-description">Descrição</label>
              <textarea id="task-description" name="description" placeholder="Contexto curto da tarefa" />
            </div>

            <div className="form-row">
              <div className="field">
                <label htmlFor="task-status">Status</label>
                <select id="task-status" name="status" defaultValue="todo">
                  <option value="todo">A fazer</option>
                  <option value="in_progress">Em andamento</option>
                  <option value="done">Concluída</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="task-priority">Prioridade</label>
                <select id="task-priority" name="priority" defaultValue="medium">
                  <option value="high">Alta</option>
                  <option value="medium">Média</option>
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

          <div className="panel" style={{ marginTop: 18, boxShadow: "none" }}>
            <h3>Projetos disponíveis</h3>
            <div className="page-grid" style={{ marginTop: 12 }}>
              {projects.map((entry) => (
                <Link key={entry.id} className="project-card" href={`/app/projects/${entry.id}`}>
                  <strong>{entry.name}</strong>
                  <span className="muted">{entry.description || "Sem descrição."}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </section>
    </div>
  );
}
