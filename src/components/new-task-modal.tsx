"use client";

import { useEffect, useState, useTransition } from "react";
import { createTaskAction } from "@/server/actions";
import { Modal } from "@/components/modal";
import { SelectPopover, DateField, CustomCheckbox } from "@/components/ui-controls";
import { CatalogBadge } from "@/components/catalog-badge";
import { SYSTEM_PRIORITY_ITEMS, SYSTEM_STATUS_ITEMS } from "@/domain/catalog";
import type { CatalogItem, Project } from "@/domain/types";

type NewTaskModalProps = {
  projects: Project[];
  defaultProjectId?: string;
  initialTitle?: string;
  buttonText?: string;
  buttonClass?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
  statuses?: CatalogItem[];
  priorities?: CatalogItem[];
};

export function NewTaskModal({
  projects = [],
  defaultProjectId,
  initialTitle = "",
  buttonText = "+ Nova tarefa",
  buttonClass = "button compact",
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
  statuses = SYSTEM_STATUS_ITEMS,
  priorities = SYSTEM_PRIORITY_ITEMS
}: NewTaskModalProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isOpen = controlledOpen ?? uncontrolledOpen;
  const setIsOpen = (next: boolean) => {
    onOpenChange?.(next);
    if (controlledOpen === undefined) setUncontrolledOpen(next);
  };

  const [projectId, setProjectId] = useState(defaultProjectId || projects[0]?.id || "");
  const [title, setTitle] = useState(initialTitle);
  const [status, setStatus] = useState("todo");
  const [priority, setPriority] = useState("medium");
  const [dueDate, setDueDate] = useState("");
  const [recurrence, setRecurrence] = useState("none");
  const [repeatSubtasks, setRepeatSubtasks] = useState(true);

  const reset = (projectOverride?: string, titleOverride?: string) => {
    setProjectId(projectOverride || defaultProjectId || projects[0]?.id || "");
    setTitle(titleOverride ?? initialTitle ?? "");
    setStatus("todo");
    setPriority("medium");
    setDueDate("");
    setRecurrence("none");
    setRepeatSubtasks(true);
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

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Criar Nova Tarefa">
        <form
          action={async (formData) => {
            formData.set("projectId", projectId);
            formData.set("title", title.trim());
            formData.set("status", status);
            formData.set("priority", priority);
            formData.set("dueDate", dueDate);
            formData.set("recurrence", recurrence);
            if (recurrence !== "none") {
              formData.set("repeatSubtasks", repeatSubtasks ? "on" : "false");
            }
            await createTaskAction(formData);
            setIsOpen(false);
            reset("", "");
          }}
          className="form-grid"
        >
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
            <label htmlFor="new-task-title">Título da Tarefa</label>
            <input
              id="new-task-title"
              name="title"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex.: Implementar funcionalidade..."
              autoFocus
            />
          </div>

          <div className="field">
            <label htmlFor="new-task-description">Descrição (Opcional)</label>
            <textarea
              id="new-task-description"
              name="description"
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
                onChange={setRecurrence}
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

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px" }}>
            <button type="button" className="button-secondary compact" onClick={() => setIsOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="button compact">
              Criar Tarefa
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

type QuickCreateProps = {
  projects: Project[];
  defaultProjectId?: string;
  statuses?: CatalogItem[];
  priorities?: CatalogItem[];
};

export function QuickCreateTask({ projects, defaultProjectId, statuses, priorities }: QuickCreateProps) {
  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState(defaultProjectId || projects[0]?.id || "");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (defaultProjectId) setProjectId(defaultProjectId);
  }, [defaultProjectId]);

  if (!projects.length) return null;

  const submitQuick = () => {
    const trimmed = title.trim();
    if (!trimmed || !projectId) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.set("projectId", projectId);
      formData.set("title", trimmed);
      formData.set("status", "todo");
      formData.set("priority", "medium");
      formData.set("recurrence", "none");
      await createTaskAction(formData);
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
      />
      <div className="quick-create-row">
        {!defaultProjectId ? (
          <SelectPopover
            ariaLabel="Projeto da nova tarefa"
            value={projectId}
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




















