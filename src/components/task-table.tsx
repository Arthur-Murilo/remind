"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { deleteTaskAction, patchTaskAction } from "@/server/actions";
import { formatDate, recurrenceLabel } from "@/lib/format";
import { TaskCheckbox } from "@/components/task-checkbox";
import { EditTaskModal } from "@/components/edit-task-modal";
import { SubtaskList } from "@/components/subtask-list";
import { InlineMenu, InlineDate } from "@/components/inline-controls";
import { InlineTagsCell } from "@/components/inline-tags-cell";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { CatalogCell } from "@/components/catalog-cell";
import { TaskTimer } from "@/components/task-timer";
import { TrashIcon } from "@/components/icons";
import type { CatalogItem, Project, Tag, Task } from "@/domain/types";

const STORAGE_KEY = "remind-column-widths-v2";

const DEFAULT_WIDTHS = {
  check: 28,
  title: 280,
  project: 140,
  status: 120,
  priority: 100,
  due: 120,
  tags: 160,
  time: 92,
  actions: 72
};

type ColumnKey = keyof typeof DEFAULT_WIDTHS;

type TaskTableProps = {
  tasks: Task[];
  projects: Project[];
  allTags: Tag[];
  statuses: CatalogItem[];
  priorities: CatalogItem[];
  showProjectColumn?: boolean;
};

function projectDotClass(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash + name.charCodeAt(i) * (i + 1)) % 6;
  }
  return `project-dot c${hash}`;
}

function TaskTitleCell({ task, onPatch }: { task: Task; onPatch: (field: string, value: string) => void }) {
  const [expanded, setExpanded] = useState((task.subtasks?.length ?? 0) > 0);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(task.title);

  useEffect(() => {
    setDraft(task.title);
  }, [task.title]);

  const save = () => {
    const next = draft.trim();
    setEditing(false);
    if (!next || next === task.title) {
      setDraft(task.title);
      return;
    }
    onPatch("title", next);
  };

  return (
    <div className="issue-title">
      <div className="issue-title-main">
        <button
          type="button"
          className="asana-caret-btn"
          aria-label={expanded ? "Ocultar subtarefas" : "Mostrar subtarefas"}
          aria-expanded={expanded}
          onClick={() => setExpanded((value) => !value)}
        >
          <span className={`asana-caret ${expanded ? "open" : ""}`} aria-hidden="true" />
        </button>
        {editing ? (
          <input
            className="issue-title-input"
            value={draft}
            autoFocus
            aria-label="Editar título da tarefa"
            onChange={(event) => setDraft(event.target.value)}
            onBlur={save}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                save();
              }
              if (event.key === "Escape") {
                setDraft(task.title);
                setEditing(false);
              }
            }}
          />
        ) : (
          <strong onDoubleClick={() => setEditing(true)} title="Clique duas vezes para editar">
            {task.title}
          </strong>
        )}
      </div>
      {task.description ? <span>{task.description}</span> : null}
      {recurrenceLabel(task.recurrence) ? (
        <span className="recurrence-inline">{recurrenceLabel(task.recurrence)}</span>
      ) : null}
      <SubtaskList taskId={task.id} subtasks={task.subtasks} expanded={expanded} />
    </div>
  );
}

export function TaskTable({
  tasks,
  projects,
  allTags,
  statuses,
  priorities,
  showProjectColumn = true
}: TaskTableProps) {
  const [widths, setWidths] = useState(DEFAULT_WIDTHS);
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null);
  const [isPending, startTransition] = useTransition();
  const dragRef = useRef<{ key: ColumnKey; startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as Partial<typeof DEFAULT_WIDTHS>;
      setWidths((prev) => ({ ...prev, ...parsed }));
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const next = Math.max(72, drag.startWidth + (event.clientX - drag.startX));
      setWidths((prev) => ({ ...prev, [drag.key]: next }));
    };
    const onUp = () => {
      if (!dragRef.current) return;
      dragRef.current = null;
      setWidths((current) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
        return current;
      });
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const template = useMemo(() => {
    const cols = showProjectColumn
      ? [
          `${widths.check}px`,
          `minmax(140px, ${widths.title}px)`,
          `${widths.project}px`,
          `${widths.status}px`,
          `${widths.priority}px`,
          `${widths.due}px`,
          `minmax(120px, ${widths.tags}px)`,
          `${widths.time}px`,
          `${widths.actions}px`
        ]
      : [
          `${widths.check}px`,
          `minmax(140px, ${widths.title}px)`,
          `${widths.status}px`,
          `${widths.priority}px`,
          `${widths.due}px`,
          `minmax(120px, ${widths.tags}px)`,
          `${widths.time}px`,
          `${widths.actions}px`
        ];
    return cols.join(" ");
  }, [widths, showProjectColumn]);

  const startResize = (key: ColumnKey, event: React.MouseEvent) => {
    event.preventDefault();
    dragRef.current = { key, startX: event.clientX, startWidth: widths[key] };
  };

  const patch = (taskId: string, field: string, value: string) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("taskId", taskId);
      formData.append("field", field);
      formData.append("value", value);
      await patchTaskAction(formData);
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

  const resizeHandle = (key: ColumnKey) => (
    <span
      className="col-resize-handle"
      onMouseDown={(e) => startResize(key, e)}
      role="separator"
      aria-orientation="vertical"
    />
  );

  return (
    <>
      <div className="issue-head resizable-head" style={{ gridTemplateColumns: template }} aria-hidden="true">
        <span />
        <span className="col-head">
          Tarefa
          {resizeHandle("title")}
        </span>
        {showProjectColumn ? (
          <span className="col-head hide-md">
            Projeto
            {resizeHandle("project")}
          </span>
        ) : null}
        <span className="col-head">
          Status
          {resizeHandle("status")}
        </span>
        <span className="col-head">
          Prioridade
          {resizeHandle("priority")}
        </span>
        <span className="col-head">
          Prazo
          {resizeHandle("due")}
        </span>
        <span className="col-head">
          Etiqueta
          {resizeHandle("tags")}
        </span>
        <span className="col-head">
          Tempo
          {resizeHandle("time")}
        </span>
        <span />
      </div>

      <div className="issue-list" aria-label="Lista de tarefas">
        {tasks.length ? (
          tasks.map((task) => (
            <article className="issue-row" key={task.id} style={{ gridTemplateColumns: template }}>
              <TaskCheckbox
                taskId={task.id}
                projectId={task.projectId}
                title={task.title}
                initialStatus={task.status}
              />
              <TaskTitleCell task={task} onPatch={(field, value) => patch(task.id, field, value)} />

              {showProjectColumn ? (
                <div className="issue-cell project">
                  <InlineMenu
                    ariaLabel="Alterar projeto"
                    value={task.projectId}
                    label={
                      <>
                        <span className={projectDotClass(task.projectName || "")} aria-hidden="true" />
                        {task.projectName}
                      </>
                    }
                    options={projects.map((p) => ({ value: p.id, label: p.name }))}
                    onChange={(value) => patch(task.id, "projectId", value)}
                  />
                </div>
              ) : null}

              <div className="issue-cell">
                <CatalogCell
                  kind="status"
                  ariaLabel="Alterar status"
                  value={task.status}
                  items={statuses}
                  onChange={(value) => patch(task.id, "status", value)}
                />
              </div>

              <div className="issue-cell">
                <CatalogCell
                  kind="priority"
                  ariaLabel="Alterar prioridade"
                  value={task.priority}
                  items={priorities}
                  onChange={(value) => patch(task.id, "priority", value)}
                />
              </div>

              <div className="issue-cell">
                <InlineDate
                  value={task.dueDate}
                  display={formatDate(task.dueDate)}
                  onChange={(value) => patch(task.id, "dueDate", value)}
                />
              </div>

              <div className="issue-cell">
                <InlineTagsCell taskId={task.id} tags={task.tags || []} allTags={allTags} />
              </div>

              <div className="issue-cell">
                <TaskTimer taskId={task.id} runningStartedAt={task.runningSession?.startedAt} />
              </div>

              <div className="issue-cell row-actions">
                <EditTaskModal
                  task={task}
                  projects={projects}
                  allTags={allTags}
                  statuses={statuses}
                  priorities={priorities}
                />
                <button
                  type="button"
                  className="icon-action danger"
                  title="Excluir tarefa"
                  aria-label={`Excluir tarefa ${task.title}`}
                  disabled={isPending}
                  onClick={() => setPendingDelete(task)}
                >
                  <TrashIcon />
                </button>
              </div>
            </article>
          ))
        ) : (
          <div className="empty-state">
            <strong>Nenhuma tarefa nessa visão.</strong>
            <span>Limpe os filtros ou crie uma tarefa dentro de um projeto.</span>
          </div>
        )}
      </div>

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
    </>
  );
}
