"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { deleteTaskAction, toggleTaskStatusAction } from "@/server/actions";
import { dueDateTone, formatDueChip, todayIsoDate } from "@/lib/format";
import { TaskCheckbox } from "@/components/task-checkbox";
import { EditTaskModal } from "@/components/edit-task-modal";
import { NewTaskModal } from "@/components/new-task-modal";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { OverflowIcon } from "@/components/icons";
import type { CatalogItem, Project, Tag, Task } from "@/domain/types";

type TaskDayListProps = {
  tasks: Task[];
  projects: Project[];
  allTags: Tag[];
  statuses: CatalogItem[];
  priorities: CatalogItem[];
  defaultDueDate?: string;
  grouped?: boolean;
  emptyTitle?: string;
  emptyHint?: string;
  emptyCta?: string;
};

function projectChipClass(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash + name.charCodeAt(i) * (i + 1)) % 6;
  }
  return `project-dot c${hash}`;
}

function subtaskHint(task: Task) {
  const total = task.subtasks?.length ?? 0;
  if (!total) return null;
  const done = task.subtasks?.filter((item) => item.completed).length ?? 0;
  return done > 0 ? `${done}/${total}` : String(total);
}

export function TaskDayList({
  tasks,
  projects,
  allTags,
  statuses,
  priorities,
  defaultDueDate,
  grouped = false,
  emptyTitle = "Nada para hoje",
  emptyHint = "Quando criar tarefas com prazo de hoje, elas aparecem aqui.",
  emptyCta = "Nova tarefa"
}: TaskDayListProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null);
  const [menuFor, setMenuFor] = useState<Task | null>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [isPending, startTransition] = useTransition();
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const menuRef = useRef<HTMLDivElement>(null);
  const today = todayIsoDate();

  const overdue = useMemo(
    () => (grouped ? tasks.filter((task) => dueDateTone(task.dueDate, today) === "overdue") : []),
    [grouped, tasks, today]
  );
  const todayTasks = useMemo(
    () => (grouped ? tasks.filter((task) => dueDateTone(task.dueDate, today) !== "overdue") : tasks),
    [grouped, tasks, today]
  );

  useEffect(() => {
    if (!menuFor) return;
    const button = buttonRefs.current[menuFor.id];
    const rect = button?.getBoundingClientRect();
    if (rect) {
      setCoords({
        top: Math.min(rect.bottom + 4, window.innerHeight - 180),
        left: Math.max(12, Math.min(rect.right - 200, window.innerWidth - 212))
      });
    }
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (button?.contains(target) || menuRef.current?.contains(target)) return;
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

  const completeTask = (task: Task) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("taskId", task.id);
      formData.append("status", task.status === "done" ? "todo" : "done");
      await toggleTaskStatusAction(formData);
    });
  };

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const task = pendingDelete;
    setPendingDelete(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("taskId", task.id);
      formData.append("projectId", task.projectId);
      await deleteTaskAction(formData);
    });
  };

  const renderCard = (task: Task) => {
    const priority = priorities.find((item) => item.key === task.priority);
    const tone = dueDateTone(task.dueDate, today);
    const hint = subtaskHint(task);

    return (
      <article className="task-card" key={task.id}>
        <div className="task-card-check">
          <TaskCheckbox
            taskId={task.id}
            projectId={task.projectId}
            title={task.title}
            initialStatus={task.status}
          />
        </div>
        <div className="task-card-body">
          <strong className="task-card-title">{task.title}</strong>
          <div className="task-card-meta">
            {priority ? (
              <span className="task-card-priority">
                <span className="task-card-priority-dot" style={{ background: priority.color }} aria-hidden="true" />
                {priority.label}
              </span>
            ) : null}
            <span aria-hidden="true">·</span>
            <span className={`task-card-due${tone ? ` due-${tone}` : ""}`}>{formatDueChip(task.dueDate, today)}</span>
          </div>
          <div className="task-card-footer">
            {task.projectName ? (
              <span className="task-card-project">
                <span className={projectChipClass(task.projectName)} aria-hidden="true" />
                {task.projectName}
              </span>
            ) : null}
            {hint ? <span className="task-card-subtasks">☰ {hint}</span> : null}
          </div>
        </div>
        <button
          ref={(node) => {
            buttonRefs.current[task.id] = node;
          }}
          type="button"
          className="task-card-overflow"
          aria-label={`Mais ações para ${task.title}`}
          aria-haspopup="menu"
          aria-expanded={menuFor?.id === task.id}
          onClick={() => setMenuFor((current) => (current?.id === task.id ? null : task))}
        >
          <OverflowIcon />
        </button>
      </article>
    );
  };

  return (
    <div className="task-day-list" aria-label="Lista de tarefas">
      {tasks.length === 0 ? (
        <div className="task-empty">
          <strong>{emptyTitle}</strong>
          <p>{emptyHint}</p>
          {projects.length > 0 ? (
            <button type="button" className="button task-empty-cta" onClick={() => setCreateOpen(true)}>
              {emptyCta}
            </button>
          ) : null}
        </div>
      ) : grouped ? (
        <>
          {overdue.length > 0 ? (
            <section className="task-day-group">
              <h2 className="task-day-heading">Atrasadas</h2>
              {overdue.map(renderCard)}
            </section>
          ) : null}
          {todayTasks.length > 0 ? (
            <section className="task-day-group">
              <h2 className="task-day-heading">Hoje</h2>
              {todayTasks.map(renderCard)}
            </section>
          ) : null}
        </>
      ) : (
        <section className="task-day-group">{tasks.map(renderCard)}</section>
      )}

      {projects.length > 0 ? (
        <>
          <button
            type="button"
            className="task-fab"
            onClick={() => setCreateOpen(true)}
            aria-label="Nova tarefa"
          >
            +
          </button>
          <NewTaskModal
            projects={projects}
            statuses={statuses}
            priorities={priorities}
            defaultDueDate={defaultDueDate}
            hideTrigger
            open={createOpen}
            onOpenChange={setCreateOpen}
          />
        </>
      ) : null}

      {editing ? (
        <EditTaskModal
          key={editing.id}
          task={editing}
          projects={projects}
          allTags={allTags}
          statuses={statuses}
          priorities={priorities}
          hideTrigger
          open
          onOpenChange={(open) => {
            if (!open) setEditing(null);
          }}
        />
      ) : null}

      {menuFor && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              className="inline-menu polished task-overflow-menu"
              style={{ top: coords.top, left: coords.left }}
              role="menu"
              aria-label={`Ações de ${menuFor.title}`}
            >
              <button
                type="button"
                className="inline-menu-item"
                role="menuitem"
                onClick={() => {
                  setEditing(menuFor);
                  setMenuFor(null);
                }}
              >
                Editar
              </button>
              <button
                type="button"
                className="inline-menu-item"
                role="menuitem"
                disabled={isPending}
                onClick={() => {
                  completeTask(menuFor);
                  setMenuFor(null);
                }}
              >
                {menuFor.status === "done" ? "Reabrir" : "Concluir"}
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
                Excluir
              </button>
            </div>,
            document.body
          )
        : null}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Excluir esta tarefa?"
        description={
          pendingDelete
            ? `A tarefa “${pendingDelete.title}” será removida permanentemente, junto com subtarefas e lembretes.`
            : ""
        }
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
