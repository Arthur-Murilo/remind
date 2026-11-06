"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { createTaskAction } from "@/server/actions";
import { TaskDialog } from "@/components/task-dialog";
import { TaskForm, type TaskFormState } from "@/components/task-form";
import { SelectPopover } from "@/components/ui-controls";
import { useIsPhone } from "@/lib/use-is-phone";
import { SYSTEM_PRIORITY_ITEMS, SYSTEM_STATUS_ITEMS } from "@/domain/catalog";
import type { CatalogItem, Project, Tag } from "@/domain/types";
import { parseQuickTask } from "@/domain/quick-parse";
import { QuickPreview, QUICK_SYNTAX_HINT, quickTaskFormData } from "@/components/quick-preview";
import { todayIsoDate } from "@/lib/format";

type NewTaskModalProps = {
  projects: Project[];
  defaultProjectId?: string;
  defaultDueDate?: string;
  initialTitle?: string;
  buttonText?: string;
  buttonClass?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
  statuses?: CatalogItem[];
  priorities?: CatalogItem[];
};

function initialState(
  projects: Project[],
  defaultProjectId?: string,
  defaultDueDate?: string,
  initialTitle = ""
): TaskFormState {
  return {
    projectId: defaultProjectId || projects[0]?.id || "",
    title: initialTitle,
    description: "",
    status: "todo",
    priority: "medium",
    dueDate: defaultDueDate || "",
    recurrence: "none",
    repeatSubtasks: true,
    estimate: ""
  };
}

export function NewTaskModal({
  projects = [],
  defaultProjectId,
  defaultDueDate,
  initialTitle = "",
  buttonText = "+ Nova tarefa",
  buttonClass = "button compact",
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
  statuses = SYSTEM_STATUS_ITEMS,
  priorities = SYSTEM_PRIORITY_ITEMS
}: NewTaskModalProps) {
  const isPhone = useIsPhone();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isOpen = controlledOpen ?? uncontrolledOpen;
  const setIsOpen = (next: boolean) => {
    onOpenChange?.(next);
    if (controlledOpen === undefined) setUncontrolledOpen(next);
  };

  const [state, setState] = useState<TaskFormState>(() =>
    initialState(projects, defaultProjectId, defaultDueDate, initialTitle)
  );

  const reset = (projectOverride?: string, titleOverride?: string) => {
    setState(initialState(projects, projectOverride || defaultProjectId, defaultDueDate, titleOverride ?? initialTitle));
  };

  useEffect(() => {
    if (isOpen) reset(defaultProjectId, initialTitle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, defaultProjectId, initialTitle]);

  return (
    <>
      {!hideTrigger ? (
        <button
          type="button"
          className={buttonClass}
          onClick={() => {
            reset();
            setIsOpen(true);
          }}
        >
          {buttonText}
        </button>
      ) : null}

      <TaskDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        variant="create"
        title={isPhone ? "Nova tarefa" : "Criar Nova Tarefa"}
      >
        <TaskForm
          mode="create"
          presentation={isPhone ? "sheet" : "modal"}
          projects={projects}
          statuses={statuses}
          priorities={priorities}
          state={state}
          onStateChange={(patch) => setState((current) => ({ ...current, ...patch }))}
          titleId="new-task-title"
          descriptionId="new-task-description"
          submitLabel={isPhone ? "Criar" : "Criar Tarefa"}
          onCancel={() => setIsOpen(false)}
          onSubmit={async (formData) => {
            await createTaskAction(formData);
            setIsOpen(false);
            reset("", "");
          }}
        />
      </TaskDialog>
    </>
  );
}

type QuickCreateProps = {
  projects: Project[];
  defaultProjectId?: string;
  defaultDueDate?: string;
  statuses?: CatalogItem[];
  priorities?: CatalogItem[];
  tags?: Tag[];
};

export function QuickCreateTask({
  projects,
  defaultProjectId,
  defaultDueDate,
  statuses,
  priorities = SYSTEM_PRIORITY_ITEMS,
  tags = []
}: QuickCreateProps) {
  const [title, setTitle] = useState("");
  const parsed = useMemo(
    () =>
      parseQuickTask(title, {
        today: todayIsoDate(),
        projects: defaultProjectId ? [] : projects,
        tags,
        priorities
      }),
    [title, projects, tags, priorities, defaultProjectId]
  );
  const [projectId, setProjectId] = useState(defaultProjectId || projects[0]?.id || "");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (defaultProjectId) setProjectId(defaultProjectId);
  }, [defaultProjectId]);

  if (!projects.length) return null;

  const submitQuick = () => {
    if (!parsed.title || !projectId) return;
    startTransition(async () => {
      await createTaskAction(quickTaskFormData(parsed, { projectId, dueDate: defaultDueDate }));
      setTitle("");
    });
  };

  const createOrOpenDetails = () => {
    if (!title.trim()) {
      setDetailsOpen(true);
      return;
    }
    submitQuick();
  };

  return (
    <div className="quick-create">
      <input
        type="text"
        className="quick-create-input"
        placeholder="Nova tarefa… Enter para criar"
        value={title}
        disabled={isPending}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            createOrOpenDetails();
          }
        }}
        aria-label="Título da nova tarefa"
        aria-describedby="quick-create-preview"
        title={`Atalhos: ${QUICK_SYNTAX_HINT}`}
      />
      <QuickPreview result={parsed} id="quick-create-preview" />
      <div className="quick-create-row">
        {!defaultProjectId ? (
          <SelectPopover
            ariaLabel="Projeto da nova tarefa"
            value={parsed.projectId || projectId}
            onChange={setProjectId}
            triggerClassName="quick-create-project"
            options={projects.map((p) => ({ value: p.id, label: p.name }))}
          />
        ) : null}
        <button
          type="button"
          className="button compact"
          disabled={isPending}
          onClick={createOrOpenDetails}
        >
          Criar
        </button>
        <button type="button" className="button-ghost compact" onClick={() => setDetailsOpen(true)}>
          Detalhes
        </button>
      </div>
      <NewTaskModal
        projects={projects}
        defaultProjectId={projectId || defaultProjectId}
        defaultDueDate={defaultDueDate}
        initialTitle={title}
        hideTrigger
        statuses={statuses}
        priorities={priorities}
        open={detailsOpen}
        onOpenChange={(open) => {
          setDetailsOpen(open);
          if (!open) setTitle("");
        }}
      />
    </div>
  );
}
