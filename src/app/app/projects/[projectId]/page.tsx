import Link from "next/link";
import { notFound } from "next/navigation";

import { createTaskAction } from "@/server/actions";
import { requireCurrentUser } from "@/server/auth";
import { getTaskFilterFromSearchParams } from "@/server/filters";
import { formatDate, priorityLabel, statusLabel, recurrenceLabel } from "@/lib/format";
import { getProjectById, getTasks, getTags } from "@/server/remind-service";
import { TaskCheckbox } from "@/components/task-checkbox";
import { EditTaskModal } from "@/components/edit-task-modal";
import { NewTaskModal } from "@/components/new-task-modal";
import { SubtaskList } from "@/components/subtask-list";
import { FilterBar } from "@/components/filter-bar";

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

  const [tasks, allTags] = await Promise.all([
    getTasks(user.id, filter),
    getTags(user.id)
  ]);

  return (
    <div className="issues-view">
      <div className="issues-toolbar">
        <div>
          <h1>{project.name}</h1>
          {project.description ? <p className="muted" style={{ margin: "4px 0 0" }}>{project.description}</p> : null}
        </div>
        <div className="issues-toolbar-actions">
          <span className="topbar-meta">{tasks.length} tarefas</span>
          <NewTaskModal projects={[project]} defaultProjectId={project.id} allTags={allTags} />
          <Link className="button-ghost compact" href="/app">
            Meu dia
          </Link>
        </div>
      </div>

      <FilterBar showProjectSelect={false} filter={filter} basePath={`/app/projects/${project.id}`} />

      <div className="issue-head" aria-hidden="true">
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
                <span className="project-dot c0" aria-hidden="true" />
                {project.name}
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
                <EditTaskModal task={task} allTags={allTags} />
              </div>
            </article>
          ))
        ) : (
          <div className="empty-state" style={{ margin: "16px 0" }}>
            <strong>Nenhuma tarefa neste projeto.</strong>
            <span>Clique no botão "+ Nova tarefa" acima para criar a primeira.</span>
          </div>
        )}
      </div>
    </div>
  );
}
