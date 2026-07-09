import Link from "next/link";
import { notFound } from "next/navigation";

import { updateTaskAction } from "@/server/actions";
import { requireCurrentUser } from "@/server/auth";
import { getProjects, getTaskById } from "@/server/remind-service";

type EditTaskPageProps = {
  params: Promise<{ taskId: string }>;
};

export default async function EditTaskPage({ params }: EditTaskPageProps) {
  const user = await requireCurrentUser();
  const { taskId } = await params;

  const [task, projects] = await Promise.all([getTaskById(user.id, taskId), getProjects(user.id)]);

  if (!task) {
    notFound();
  }

  return (
    <div className="issues-view">
      <div className="issues-toolbar">
        <div>
          <h1>Editar tarefa</h1>
          <p className="muted" style={{ margin: "4px 0 0" }}>
            {task.title}
          </p>
        </div>
        <div className="issues-toolbar-actions">
          <Link className="button-ghost compact" href={`/app/projects/${task.projectId}`}>
            Voltar ao projeto
          </Link>
        </div>
      </div>

      <div className="page-section">
        <section className="form-panel">
          <form action={updateTaskAction} className="form-grid">
            <input type="hidden" name="taskId" value={task.id} />

            <div className="field">
              <label htmlFor="projectId">Projeto</label>
              <select id="projectId" name="projectId" defaultValue={task.projectId}>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="title">Titulo</label>
              <input id="title" name="title" defaultValue={task.title} required />
            </div>

            <div className="field">
              <label htmlFor="description">Descricao</label>
              <textarea id="description" name="description" defaultValue={task.description || ""} />
            </div>

            <div className="form-row">
              <div className="field">
                <label htmlFor="status">Status</label>
                <select id="status" name="status" defaultValue={task.status}>
                  <option value="todo">A fazer</option>
                  <option value="in_progress">Em andamento</option>
                  <option value="done">Concluida</option>
                </select>
              </div>

              <div className="field">
                <label htmlFor="priority">Prioridade</label>
                <select id="priority" name="priority" defaultValue={task.priority}>
                  <option value="high">Alta</option>
                  <option value="medium">Media</option>
                  <option value="low">Baixa</option>
                </select>
              </div>
            </div>

            <div className="field">
              <label htmlFor="dueDate">Prazo</label>
              <input id="dueDate" name="dueDate" type="date" defaultValue={task.dueDate || ""} />
            </div>

            <div className="actions">
              <button className="button" type="submit">
                Salvar
              </button>
              <Link className="button-secondary" href={`/app/projects/${task.projectId}`}>
                Cancelar
              </Link>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
