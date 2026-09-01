"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { deleteTaskAction, patchTaskAction } from "@/server/actions";
import { formatDate, formatDurationClock, recurrenceLabel } from "@/lib/format";
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

const STORAGE_KEY = "remind-column-widths-v4";

const DEFAULT_WIDTHS = {
  check: 28,
  title: 280,
  project: 140,
  status: 120,
  priority: 100,
  due: 120,
  tags: 160,
  time: 108,
  actions: 72
};

type ColumnKey = keyof typeof DEFAULT_WIDTHS;
type WidthOverrides = Partial<Record<ColumnKey, number>>;

function measureByChars(text: string) {
  return Array.from(text).reduce((sum, character) => {
    if (/[MW@#%]/.test(character)) return sum + 10;
    if (/[A-ZÁÉÍÓÚÇ]/.test(character)) return sum + 8;
    if (/[ilI1.,:;|]/.test(character)) return sum + 4;
    return sum + 7;
  }, 0);
}

function measureText(text: string, font: string, precise: boolean) {
  if (!precise || typeof document === "undefined") {
    return measureByChars(text);
  }

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) return measureByChars(text);
  context.font = font;
  return context.measureText(text).width;
}

function estimatedWidth(
  values: string[],
  minimum: number,
  maximum: number,
  padding = 44,
  font = "500 14.7px Inter, sans-serif",
  precise = false
) {
  const contentWidth = values.reduce((largest, value) => Math.max(largest, measureText(value || "", font, precise)), 0);
  return Math.min(maximum, Math.max(minimum, Math.ceil(contentWidth + padding)));
}

function computeAutomaticWidths(
  tasks: Task[],
  projects: Project[],
  statuses: CatalogItem[],
  priorities: CatalogItem[],
  precise = false
) {
  return {
    ...DEFAULT_WIDTHS,
    title: estimatedWidth(tasks.map((task) => task.title), 220, 720, 88, "500 14.7px Inter, sans-serif", precise),
    project: estimatedWidth(projects.map((project) => project.name), 120, 280, 44, "500 14.7px Inter, sans-serif", precise),
    status: estimatedWidth(statuses.map((status) => status.label), 110, 200, 52, "500 13px Inter, sans-serif", precise),
    priority: estimatedWidth(priorities.map((priority) => priority.label), 96, 180, 52, "500 13px Inter, sans-serif", precise),
    tags: estimatedWidth(
      tasks.map((task) => (task.tags || []).map((tag) => tag.name).join("  ")),
      130,
      300,
      56,
      "500 13px Inter, sans-serif",
      precise
    ),
    time: 112
  };
}

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

function TaskTimeChip({
  totalTrackedSeconds = 0,
  runningStartedAt
}: {
  totalTrackedSeconds?: number;
  runningStartedAt?: string | null;
}) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!runningStartedAt) {
      setElapsed(0);
      return;
    }
    const tick = () => {
      setElapsed(Math.max(0, Math.floor((Date.now() - new Date(runningStartedAt).getTime()) / 1000)));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [runningStartedAt]);

  const seconds = totalTrackedSeconds + elapsed;
  if (seconds <= 0) return null;

  return (
    <span className={`task-time-chip${runningStartedAt ? " running" : ""}`}>
      {formatDurationClock(seconds)}
    </span>
  );
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
        <TaskTimeChip
          totalTrackedSeconds={task.totalTrackedSeconds}
          runningStartedAt={task.runningSession?.startedAt}
        />
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
  const [manualWidths, setManualWidths] = useState<WidthOverrides>({});
  const [measuredWidths, setMeasuredWidths] = useState<WidthOverrides>({});
  const manualWidthsRef = useRef<WidthOverrides>({});
  const [pendingDelete, setPendingDelete] = useState<Task | null>(null);
  const [isPending, startTransition] = useTransition();
  const dragRef = useRef<{ key: ColumnKey; startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as WidthOverrides;
      manualWidthsRef.current = parsed;
      setManualWidths(parsed);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    const onMove = (event: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const next = Math.max(72, drag.startWidth + (event.clientX - drag.startX));
      setManualWidths((previous) => {
        const updated = { ...previous, [drag.key]: next };
        manualWidthsRef.current = updated;
        return updated;
      });
    };
    const onUp = () => {
      if (!dragRef.current) return;
      dragRef.current = null;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(manualWidthsRef.current));
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  useEffect(() => {
    setMeasuredWidths(computeAutomaticWidths(tasks, projects, statuses, priorities, true));
  }, [priorities, projects, statuses, tasks]);

  const automaticWidths = useMemo(
    () => ({
      ...computeAutomaticWidths(tasks, projects, statuses, priorities),
      ...measuredWidths
    }),
    [measuredWidths, priorities, projects, statuses, tasks]
  );

  const widths = useMemo(
    () => ({ ...automaticWidths, ...manualWidths }),
    [automaticWidths, manualWidths]
  );

  const template = useMemo(() => {
    const cols = showProjectColumn
      ? [
          `${widths.check}px`,
          `${widths.title}px`,
          `${widths.project}px`,
          `${widths.status}px`,
          `${widths.priority}px`,
          `${widths.due}px`,
          `${widths.tags}px`,
          `${widths.time}px`,
          `${widths.actions}px`
        ]
      : [
          `${widths.check}px`,
          `${widths.title}px`,
          `${widths.status}px`,
          `${widths.priority}px`,
          `${widths.due}px`,
          `${widths.tags}px`,
          `${widths.time}px`,
          `${widths.actions}px`
        ];
    return cols.join(" ");
  }, [showProjectColumn, widths]);

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
      <div className="task-table-scroll">
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
              <div className="issue-cell col-check">
                <TaskCheckbox
                  taskId={task.id}
                  projectId={task.projectId}
                  title={task.title}
                  initialStatus={task.status}
                />
              </div>
              <TaskTitleCell task={task} onPatch={(field, value) => patch(task.id, field, value)} />

              <div className="issue-meta">
                {showProjectColumn ? (
                  <div className="issue-cell project col-project">
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

                <div className="issue-cell col-status">
                  <CatalogCell
                    kind="status"
                    ariaLabel="Alterar status"
                    value={task.status}
                    items={statuses}
                    onChange={(value) => patch(task.id, "status", value)}
                  />
                </div>

                <div className="issue-cell col-priority">
                  <CatalogCell
                    kind="priority"
                    ariaLabel="Alterar prioridade"
                    value={task.priority}
                    items={priorities}
                    onChange={(value) => patch(task.id, "priority", value)}
                  />
                </div>

                <div className="issue-cell col-due">
                  <InlineDate
                    value={task.dueDate}
                    display={formatDate(task.dueDate)}
                    onChange={(value) => patch(task.id, "dueDate", value)}
                  />
                </div>

                <div className="issue-cell col-tags">
                  <InlineTagsCell taskId={task.id} tags={task.tags || []} allTags={allTags} />
                </div>

                <div className="issue-cell col-time">
                  <TaskTimer
                    taskId={task.id}
                    runningStartedAt={task.runningSession?.startedAt}
                    totalTrackedSeconds={task.totalTrackedSeconds}
                  />
                </div>
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
