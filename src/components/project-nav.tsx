"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Project = {
  id: string;
  name: string;
  openTaskCount?: number;
};

type ProjectNavProps = {
  projects: Project[];
};

function projectDotClass(index: number) {
  return `project-dot c${index % 6}`;
}

export function ProjectNav({ projects }: ProjectNavProps) {
  const pathname = usePathname();

  if (!projects.length) {
    return <div className="empty-compact">Nenhum projeto ainda.</div>;
  }

  return (
    <>
      {projects.map((project, index) => {
        const href = `/app/projects/${project.id}` as const;
        const active = pathname === `/app/projects/${project.id}`;

        return (
          <Link
            key={project.id}
            className={`nav-link${active ? " active" : ""}`}
            href={`/app/projects/${project.id}`}
          >
            <span className={projectDotClass(index)} aria-hidden="true" />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {project.name}
            </span>
            <span className="nav-count">{project.openTaskCount ?? 0}</span>
          </Link>
        );
      })}
    </>
  );
}
