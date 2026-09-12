import Link from "next/link";
import { requireCurrentUser } from "@/server/auth";
import { getProjects } from "@/server/remind-service";
import { NewProjectModal } from "@/components/new-project-modal";

export default async function ProjetosPage() {
  const user = await requireCurrentUser();
  const projects = await getProjects(user.id);

  return (
    <div className="phone-index-view">
      <div className="phone-index-toolbar desktop-only">
        <h1>Projetos</h1>
      </div>

      {projects.length === 0 ? (
        <div className="task-empty">
          <strong>Nenhum projeto ainda</strong>
          <p>Crie um projeto para organizar as tarefas.</p>
          <NewProjectModal />
        </div>
      ) : (
        <ul className="project-card-list">
          {projects.map((project) => (
            <li key={project.id}>
              <Link className="project-card-link" href={`/app/projects/${project.id}`}>
                <span className="project-card-name">{project.name}</span>
                <span className="project-card-count">
                  {project.openTaskCount ?? 0} abertas
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {projects.length > 0 ? (
        <div className="phone-index-create">
          <NewProjectModal />
        </div>
      ) : null}
    </div>
  );
}
