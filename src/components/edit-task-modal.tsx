"use client";

import { useState } from "react";
import { updateTaskAction } from "@/server/actions";
import { Modal } from "@/components/modal";
import { TagSelector } from "@/components/tag-selector";
import { SelectPopover, DateField, CustomCheckbox } from "@/components/ui-controls";
import { CatalogBadge } from "@/components/catalog-badge";
import { SYSTEM_PRIORITY_ITEMS, SYSTEM_STATUS_ITEMS } from "@/domain/catalog";
import type { CatalogItem, Project, Tag, TaskRecurrence } from "@/domain/types";

type EditTaskModalProps = {
  task: {
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
  };
  projects?: Project[];
  allTags?: Tag[];
  statuses?: CatalogItem[];
  priorities?: CatalogItem[];
};

export function EditTaskModal({
  task,
  projects = [],
  allTags = [],
  statuses = SYSTEM_STATUS_ITEMS,
  priorities = SYSTEM_PRIORITY_ITEMS
}: EditTaskModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [projectId, setProjectId] = useState(task.projectId);
  const [status, setStatus] = useState(task.status);
  const [priority, setPriority] = useState(task.priority);
  const [dueDate, setDueDate] = useState(task.dueDate || "");
  const [recurrence, setRecurrence] = useState(task.recurrence || "none");
  const [repeatSubtasks, setRepeatSubtasks] = useState(task.repeatSubtasks !== false);

  const syncFromTask = () => {
    setProjectId(task.projectId);
    setStatus(task.status);
    setPriority(task.priority);
    setDueDate(task.dueDate || "");
    setRecurrence(task.recurrence || "none");
    setRepeatSubtasks(task.repeatSubtasks !== false);
  };

  return (
    <>
      <button
        type="button"
        className="icon-action"
        onClick={() => {
          syncFromTask();
          setIsOpen(true);
        }}
        aria-label={`Editar tarefa ${task.title}`}
        title="Editar tarefa"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
        </svg>
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Editar Tarefa">
        <form
          action={async (formData) => {
            setIsPending(true);
            try {
              formData.set("projectId", projectId);
              formData.set("status", status);
              formData.set("priority", priority);
              formData.set("dueDate", dueDate);
              formData.set("recurrence", recurrence);
              if (recurrence !== "none") {
                formData.set("repeatSubtasks", repeatSubtasks ? "on" : "false");
              }
              await updateTaskAction(formData);
              setIsOpen(false);
            } finally {
              setIsPending(false);
            }
          }}
          className="form-grid"
        >
          <input type="hidden" name="taskId" value={task.id} />

          {projects.length > 0 ? (
            <div className="field">
              <label>Projeto</label>
              <SelectPopover
                name="projectId"
                ariaLabel="Projeto"
                value={projectId}
                onChange={setProjectId}
                options={projects.map((p) => ({ value: p.id, label: p.name }))}
              />
            </div>
          ) : (
            <input type="hidden" name="projectId" value={projectId} />
          )}

          <div className="field">
            <label htmlFor={`edit-title-${task.id}`}>Título</label>
            <input
              id={`edit-title-${task.id}`}
              name="title"
              defaultValue={task.title}
              required
              placeholder="Título da tarefa"
            />
          </div>

          <div className="field">
            <label htmlFor={`edit-desc-${task.id}`}>Descrição</label>
            <textarea
              id={`edit-desc-${task.id}`}
              name="description"
              defaultValue={task.description || ""}
              placeholder="Detalhes opcionais..."
              rows={3}
            />
          </div>

          <div className="form-row">
            <div className="field">
              <label>Status</label>
              <SelectPopover
                name="status"
                ariaLabel="Status"
                value={status}
                onChange={setStatus}
                options={statuses.map((item) => ({ value: item.key, label: item.label }))}
                renderValue={(option) => {
                  const item = statuses.find((entry) => entry.key === option?.value);
                  return item ? <CatalogBadge item={item} /> : option?.label;
                }}
              />
            </div>

            <div className="field">
              <label>Prioridade</label>
              <SelectPopover
                name="priority"
                ariaLabel="Prioridade"
                value={priority}
                onChange={setPriority}
                options={priorities.map((item) => ({ value: item.key, label: item.label }))}
                renderValue={(option) => {
                  const item = priorities.find((entry) => entry.key === option?.value);
                  return item ? <CatalogBadge item={item} /> : option?.label;
                }}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="field">
              <label>Prazo</label>
              <DateField name="dueDate" value={dueDate || null} onChange={setDueDate} />
            </div>

            <div className="field">
              <label>Repetir (Rotina)</label>
              <SelectPopover
                name="recurrence"
                ariaLabel="Repetir"
                value={recurrence}
                onChange={(v) => setRecurrence(v as TaskRecurrence)}
                options={[
                  { value: "none", label: "Não repete" },
                  { value: "daily", label: "Diariamente" },
                  { value: "weekly", label: "Semanalmente" },
                  { value: "monthly", label: "Mensalmente" }
                ]}
              />
            </div>
          </div>

          {recurrence !== "none" ? (
            <CustomCheckbox
              checked={repeatSubtasks}
              onChange={setRepeatSubtasks}
              label="Repetir subtarefas a cada ciclo"
            />
          ) : null}

          <TagSelector
            key={`tags-${task.id}-${isOpen}-${(task.tags || []).map((t) => t.id).join(",")}`}
            allTags={allTags}
            selectedTagIds={task.tags?.map((t) => t.id) || []}
          />

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px" }}>
            <button type="button" className="button-secondary compact" onClick={() => setIsOpen(false)} disabled={isPending}>
              Cancelar
            </button>
            <button type="submit" className="button compact" disabled={isPending}>
              {isPending ? "Salvando..." : "Salvar Alterações"}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
