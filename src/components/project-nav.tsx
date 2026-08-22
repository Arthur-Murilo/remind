"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { deleteProjectAction, renameProjectAction } from "@/server/actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { MoreIcon, RenameIcon, TrashIcon } from "@/components/icons";

type Project = {
  id: string;
  name: string;
  openTaskCount?: number;
  taskCount?: number;
};

type ProjectNavProps = {
  projects: Project[];
};

function projectDotClass(index: number) {
  return `project-dot c${index % 6}`;
}

export function ProjectNav({ projects }: ProjectNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuFor, setMenuFor] = useState<Project | null>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [pendingDelete, setPendingDelete] = useState<Project | null>(null);
  const [renaming, setRenaming] = useState<Project | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [isPending, startTransition] = useTransition();
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuFor) return;
    const btn = buttonRefs.current[menuFor.id];
    const rect = btn?.getBoundingClientRect();
    if (rect) {
      setCoords({ top: rect.bottom + 4, left: Math.min(rect.left, window.innerWidth - 220) });
    }
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (btn?.contains(target) || menuRef.current?.contains(target)) return;
      setMenuFor(null);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuFor(null);
    };
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [menuFor]);

  if (!projects.length) {
    return <div className="empty-compact">Nenhum projeto ainda.</div>;
  }

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const project = pendingDelete;
    const wasViewing = pathname === `/app/projects/${project.id}`;
    setPendingDelete(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("projectId", project.id);
      await deleteProjectAction(formData);
      if (wasViewing) {
        router.push("/app");
      } else {
        router.refresh();
      }
    });
  };

  const saveRename = () => {
    if (!renaming) return;
    const name = renameValue.trim();
    if (!name || name === renaming.name) {
      setRenaming(null);
      return;
    }
    const projectId = renaming.id;
    setRenaming(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("projectId", projectId);
      formData.append("name", name);
      await renameProjectAction(formData);
    });
  };

  return (
    <>
      {projects.map((project, index) => {
        const active = pathname === `/app/projects/${project.id}`;
        const isRenaming = renaming?.id === project.id;
        const menuOpen = menuFor?.id === project.id;

        return (
          <div key={project.id} className={`nav-project-row${active ? " active" : ""}${menuOpen ? " menu-open" : ""}`}>
            {isRenaming ? (
              <input
                className="project-rename-input"
                value={renameValue}
                autoFocus
                onChange={(e) => setRenameValue(e.target.value)}
                onBlur={saveRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveRename();
                  if (e.key === "Escape") setRenaming(null);
                }}
                aria-label={`Renomear projeto ${project.name}`}
              />
            ) : (
              <Link className={`nav-link${active ? " active" : ""}`} href={`/app/projects/${project.id}`}>
                <span className={projectDotClass(index)} aria-hidden="true" />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {project.name}
                </span>
              </Link>
            )}
            <button
              ref={(el) => {
                buttonRefs.current[project.id] = el;
              }}
              type="button"
              className="nav-more-btn"
              title="Opções do projeto"
              aria-label={`Opções do projeto ${project.name}`}
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              disabled={isPending}
              onClick={() => setMenuFor((current) => (current?.id === project.id ? null : project))}
            >
              <MoreIcon />
            </button>
          </div>
        );
      })}

      {menuFor && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              className="inline-menu polished project-menu"
              style={{ top: coords.top, left: coords.left }}
              role="menu"
              aria-label={`Opções de ${menuFor.name}`}
            >
              <button
                type="button"
                className="inline-menu-item"
                role="menuitem"
                onClick={() => {
                  setRenameValue(menuFor.name);
                  setRenaming(menuFor);
                  setMenuFor(null);
                }}
              >
                <RenameIcon size={14} />
                Renomear
              </button>
              <button
                type="button"
                className="inline-menu-item danger-item"
                role="menuitem"
                onClick={() => {
                  setPendingDelete(menuFor);
                  setMenuFor(null);
                }}
              >
                <TrashIcon size={14} />
                Excluir projeto
              </button>
            </div>,
            document.body
          )
        : null}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Excluir este projeto?"
        description={
          pendingDelete
            ? `Excluir o projeto “${pendingDelete.name}” e todas as ${pendingDelete.taskCount ?? pendingDelete.openTaskCount ?? 0} tarefas? Isso não pode ser desfeito.`
            : ""
        }
        confirmLabel="Excluir projeto"
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </>
  );
}
