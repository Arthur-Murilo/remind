"use client";

import { TagSelector } from "@/components/tag-selector";
import { SelectPopover, DateField, CustomCheckbox } from "@/components/ui-controls";
import { CatalogBadge } from "@/components/catalog-badge";
import { SubtaskList } from "@/components/subtask-list";
import { formatDueChip } from "@/lib/format";
import type { CatalogItem, Project, Subtask, Tag, TaskRecurrence } from "@/domain/types";

export type TaskFormMode = "create" | "edit";
export type TaskFormPresentation = "modal" | "sheet";

export type TaskFormState = {
  projectId: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  dueDate: string;
  recurrence: string;
  repeatSubtasks: boolean;
};

type TaskFormProps = {
  mode: TaskFormMode;
  presentation: TaskFormPresentation;
  projects: Project[];
  statuses: CatalogItem[];
  priorities: CatalogItem[];
  state: TaskFormState;
  onStateChange: (patch: Partial<TaskFormState>) => void;
  titleId: string;
  descriptionId: string;
  taskId?: string;
  allTags?: Tag[];
  selectedTagIds?: string[];
  subtasks?: Subtask[];
  pending?: boolean;
  submitLabel: string;
  cancelLabel?: string;
  onCancel: () => void;
  onSubmit: (formData: FormData) => void | Promise<void>;
};

function PriorityField({
  priorities,
  value,
  onChange
}: {
  priorities: CatalogItem[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="field">
      <label>Prioridade</label>
      <SelectPopover
        name="priority"
        ariaLabel="Prioridade"
        value={value}
        onChange={onChange}
        options={priorities.map((item) => ({ value: item.key, label: item.label }))}
        renderValue={(option) => {
          const item = priorities.find((entry) => entry.key === option?.value);
          return item ? <CatalogBadge item={item} /> : option?.label;
        }}
      />
    </div>
  );
}

export function TaskForm({
  mode,
  presentation,
  projects,
  statuses,
  priorities,
  state,
  onStateChange,
  titleId,
  descriptionId,
  taskId,
  allTags = [],
  selectedTagIds = [],
  subtasks,
  pending = false,
  submitLabel,
  cancelLabel = "Cancelar",
  onCancel,
  onSubmit
}: TaskFormProps) {
  const sheetCreate = presentation === "sheet" && mode === "create";
  const sheetEdit = presentation === "sheet" && mode === "edit";
  const showProject = projects.length > 0 && (!sheetCreate || projects.length > 1);
  const titleLabel = mode === "create" && presentation === "modal" ? "Título da Tarefa" : "Título";
  const descriptionLabel = sheetEdit ? "Notas" : mode === "create" ? "Descrição (Opcional)" : "Descrição";

  return (
    <form
      action={async (formData) => {
        formData.set("projectId", state.projectId);
        formData.set("title", state.title.trim());
        formData.set("status", state.status);
        formData.set("priority", state.priority);
        formData.set("dueDate", state.dueDate);
        formData.set("description", state.description);
        formData.set("recurrence", state.recurrence);
        if (state.recurrence !== "none") {
          formData.set("repeatSubtasks", state.repeatSubtasks ? "on" : "false");
        }
        await onSubmit(formData);
      }}
      className={`form-grid task-form task-form--${presentation}`}
    >
      <div className="task-form-fields">
        {showProject && !sheetEdit ? (
          <div className="field">
            <label>Projeto</label>
            <SelectPopover
              name="projectId"
              ariaLabel="Projeto"
              value={state.projectId}
              onChange={(value) => onStateChange({ projectId: value })}
              options={projects.map((project) => ({ value: project.id, label: project.name }))}
            />
          </div>
        ) : showProject ? null : (
          <input type="hidden" name="projectId" value={state.projectId} />
        )}

        <div className="field">
          <label htmlFor={titleId}>{titleLabel}</label>
          <input
            id={titleId}
            name="title"
            required
            value={state.title}
            onChange={(event) => onStateChange({ title: event.target.value })}
            placeholder={presentation === "sheet" ? "O que precisa ser feito?" : "Ex.: Implementar funcionalidade..."}
            autoFocus
          />
        </div>

        {sheetCreate ? (
          <>
            <div className="field">
              <label>Prazo</label>
              <DateField
                name="dueDate"
                value={state.dueDate || null}
                display={formatDueChip(state.dueDate || null)}
                onChange={(value) => onStateChange({ dueDate: value })}
              />
            </div>
            <PriorityField
              priorities={priorities}
              value={state.priority}
              onChange={(value) => onStateChange({ priority: value })}
            />
          </>
        ) : null}

        {sheetEdit ? (
          <>
            <div className="field">
              <label>Prazo</label>
              <DateField
                name="dueDate"
                value={state.dueDate || null}
                display={formatDueChip(state.dueDate || null)}
                onChange={(value) => onStateChange({ dueDate: value })}
              />
            </div>
            <PriorityField
              priorities={priorities}
              value={state.priority}
              onChange={(value) => onStateChange({ priority: value })}
            />
            {projects.length > 0 ? (
              <div className="field">
                <label>Projeto</label>
                <SelectPopover
                  name="projectId"
                  ariaLabel="Projeto"
                  value={state.projectId}
                  onChange={(value) => onStateChange({ projectId: value })}
                  options={projects.map((project) => ({ value: project.id, label: project.name }))}
                />
              </div>
            ) : (
              <input type="hidden" name="projectId" value={state.projectId} />
            )}
            <div className="field">
              <label htmlFor={descriptionId}>{descriptionLabel}</label>
              <textarea
                id={descriptionId}
                name="description"
                value={state.description}
                onChange={(event) => onStateChange({ description: event.target.value })}
                placeholder="Notas opcionais…"
                rows={4}
              />
            </div>
            {taskId ? (
              <div className="field task-form-subtasks">
                <label>Subtarefas</label>
                <SubtaskList taskId={taskId} subtasks={subtasks} expanded />
              </div>
            ) : null}
          </>
        ) : null}

        {presentation === "modal" ? (
          <>
            <div className="field">
              <label htmlFor={descriptionId}>{descriptionLabel}</label>
              <textarea
                id={descriptionId}
                name="description"
                value={state.description}
                onChange={(event) => onStateChange({ description: event.target.value })}
                placeholder="Contexto curto ou detalhes adicionais..."
                rows={3}
              />
            </div>

            <div className="form-row">
              <div className="field">
                <label>Status</label>
                <SelectPopover
                  name="status"
                  ariaLabel="Status"
                  value={state.status}
                  onChange={(value) => onStateChange({ status: value })}
                  options={statuses.map((item) => ({ value: item.key, label: item.label }))}
                  renderValue={(option) => {
                    const item = statuses.find((entry) => entry.key === option?.value);
                    return item ? <CatalogBadge item={item} /> : option?.label;
                  }}
                />
              </div>
              <PriorityField
                priorities={priorities}
                value={state.priority}
                onChange={(value) => onStateChange({ priority: value })}
              />
            </div>

            <div className="form-row">
              <div className="field">
                <label>Prazo</label>
                <DateField name="dueDate" value={state.dueDate || null} onChange={(value) => onStateChange({ dueDate: value })} />
              </div>
              <div className="field">
                <label>Repetir (Rotina)</label>
                <SelectPopover
                  name="recurrence"
                  ariaLabel="Repetir"
                  value={state.recurrence}
                  onChange={(value) => onStateChange({ recurrence: value as TaskRecurrence })}
                  options={[
                    { value: "none", label: "Não repete" },
                    { value: "daily", label: "Diariamente" },
                    { value: "weekly", label: "Semanalmente" },
                    { value: "monthly", label: "Mensalmente" }
                  ]}
                />
              </div>
            </div>

            {state.recurrence !== "none" ? (
              <CustomCheckbox
                checked={state.repeatSubtasks}
                onChange={(checked) => onStateChange({ repeatSubtasks: checked })}
                label="Repetir subtarefas a cada ciclo"
              />
            ) : null}

            {mode === "edit" ? (
              <TagSelector
                key={`tags-${taskId}-${selectedTagIds.join(",")}`}
                allTags={allTags}
                selectedTagIds={selectedTagIds}
              />
            ) : null}
          </>
        ) : null}
      </div>

      <div className="task-form-actions">
        <button type="submit" className="button compact task-form-submit" disabled={pending}>
          {submitLabel}
        </button>
        <button type="button" className="button-secondary compact task-form-cancel" onClick={onCancel} disabled={pending}>
          {cancelLabel}
        </button>
      </div>
    </form>
  );
}
