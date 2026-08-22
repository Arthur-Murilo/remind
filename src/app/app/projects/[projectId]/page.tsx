import { notFound } from "next/navigation";

import { requireCurrentUser } from "@/server/auth";
import { getTaskFilterFromSearchParams } from "@/server/filters";
import { getProjectById, getProjects, getTasks, getTags, getCatalogs } from "@/server/remind-service";
import { QuickCreateTask } from "@/components/new-task-modal";
import { FilterBar } from "@/components/filter-bar";
import { TaskTable } from "@/components/task-table";

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

  const [tasks, allTags, projects, catalogs] = await Promise.all([
    getTasks(user.id, filter),
    getTags(user.id),
    getProjects(user.id),
    getCatalogs(user.id)
  ]);

  return (
    <div className="issues-view">
      <div className="issues-toolbar">
        <div>
          <h1>{project.name}</h1>
          {project.description ? <p className="muted" style={{ margin: "4px 0 0" }}>{project.description}</p> : null}
        </div>
        <div className="issues-toolbar-actions">
          <QuickCreateTask
            projects={[project]}
            defaultProjectId={project.id}
            statuses={catalogs.statuses}
            priorities={catalogs.priorities}
          />
        </div>
      </div>

      <FilterBar
        showProjectSelect={false}
        filter={filter}
        basePath={`/app/projects/${project.id}`}
        statuses={catalogs.statuses}
        priorities={catalogs.priorities}
      />

      <TaskTable
        tasks={tasks}
        projects={projects}
        allTags={allTags}
        statuses={catalogs.statuses}
        priorities={catalogs.priorities}
        showProjectColumn={false}
      />
    </div>
  );
}
