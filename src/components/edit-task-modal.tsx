"use client";

import { useEffect, useState } from "react";
import { updateTaskAction } from "@/server/actions";
import { TaskDialog } from "@/components/task-dialog";
import { TaskForm, type TaskFormState } from "@/components/task-form";
import { useIsPhone } from "@/lib/use-is-phone";
import { SYSTEM_PRIORITY_ITEMS, SYSTEM_STATUS_ITEMS } from "@/domain/catalog";
import type { CatalogItem, Project, Subtask, Tag, TaskRecurrence } from "@/domain/types";

type EditTask = {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  dueDate: string | null;
  recurrence?: TaskRecurrence;
  repeatSubtasks?: boolean;
  tags?: Tag[];
  subtasks?: Subtask[];
};

type EditTaskModalProps = {
  task: EditTask;
  projects?: Project[];
  allTags?: Tag[];
  statuses?: CatalogItem[];
  priorities?: CatalogItem[];
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
};

function stateFromTask(task: EditTask): TaskFormState {
  return {
    projectId: task.projectId,
    title: task.title,
    description: task.description || "",
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate || "",
    recurrence: task.recurrence || "none",
    repeatSubtasks: task.repeatSubtasks !== false
  };
}

export function EditTaskModal({
  task,
  projects = [],
  allTags = [],
  statuses = SYSTEM_STATUS_ITEMS,
  priorities = SYSTEM_PRIORITY_ITEMS,
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false
}: EditTaskModalProps) {
  const isPhone = useIsPhone();
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isOpen = controlledOpen ?? uncontrolledOpen;
  const setIsOpen = (next: boolean) => {
    onOpenChange?.(next);
    if (controlledOpen === undefined) setUncontrolledOpen(next);
  };
  const [isPending, setIsPending] = useState(false);
  const [state, setState] = useState<TaskFormState>(() => stateFromTask(task));

  useEffect(() => {
    if (isOpen) setState(stateFromTask(task));
  }, [isOpen, task]);

  return (
    <>
      {!hideTrigger ? (
        <button
          type="button"
          className="icon-action"
          onClick={() => {
            setState(stateFromTask(task));
            setIsOpen(true);
          }}
          aria-label={`Editar tarefa ${task.title}`}
          title="Editar tarefa"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
          </svg>
        </button>
      ) : null}

      <TaskDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        variant="edit"
        title={isPhone ? "Editar tarefa" : "Editar Tarefa"}
      >
        <TaskForm
          mode="edit"
          presentation={isPhone ? "sheet" : "modal"}
          projects={projects}
          statuses={statuses}
          priorities={priorities}
          state={state}
          onStateChange={(patch) => setState((current) => ({ ...current, ...patch }))}
          titleId={`edit-title-${task.id}`}
          descriptionId={`edit-desc-${task.id}`}
          taskId={task.id}
          allTags={allTags}
          selectedTagIds={task.tags?.map((tag) => tag.id) || []}
          subtasks={task.subtasks}
          pending={isPending}
          submitLabel={isPending ? "Salvando..." : isPhone ? "Salvar" : "Salvar Alterações"}
          onCancel={() => setIsOpen(false)}
          onSubmit={async (formData) => {
            setIsPending(true);
            try {
              formData.set("taskId", task.id);
              await updateTaskAction(formData);
              setIsOpen(false);
            } finally {
              setIsPending(false);
            }
          }}
        />
      </TaskDialog>
    </>
  );
}
