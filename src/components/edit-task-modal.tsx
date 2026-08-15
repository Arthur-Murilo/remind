"use client";

import { useState } from "react";
import { updateTaskAction } from "@/server/actions";
import { Modal } from "@/components/modal";
import { TagSelector } from "@/components/tag-selector";
import type { Project, Tag, TaskPriority, TaskRecurrence, TaskStatus } from "@/domain/types";

type EditTaskModalProps = {
  task: {
    id: string;
    projectId: string;
    title: string;
    description: string | null;
    status: TaskStatus;
    priority: TaskPriority;
    dueDate: string | null;
    recurrence?: TaskRecurrence;
    repeatSubtasks?: boolean;
    tags?: Tag[];
  };
  projects?: Project[];
  allTags?: Tag[];
};

export function EditTaskModal({ task, projects = [], allTags = [] }: EditTaskModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  return (
    <>
      <button
        type="button"
        className="link-button icon-button"
        onClick={() => setIsOpen(true)}
        aria-label={`Editar tarefa ${task.title}`}
        title="Editar tarefa"
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "6px",
          borderRadius: "var(--radius-sm)",
          color: "var(--ink-soft)",
          background: "transparent",
          border: "0",
          cursor: "pointer"
        }}
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
              <label htmlFor={`edit-project-${task.id}`}>Projeto</label>
              <select id={`edit-project-${task.id}`} name="projectId" defaultValue={task.projectId}>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <input type="hidden" name="projectId" value={task.projectId} />
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
              <label htmlFor={`edit-status-${task.id}`}>Status</label>
              <select id={`edit-status-${task.id}`} name="status" defaultValue={task.status}>
                <option value="todo">A fazer</option>
                <option value="in_progress">Em andamento</option>
                <option value="done">Concluída</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor={`edit-priority-${task.id}`}>Prioridade</label>
              <select id={`edit-priority-${task.id}`} name="priority" defaultValue={task.priority}>
                <option value="high">Alta</option>
                <option value="medium">Média</option>
                <option value="low">Baixa</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="field">
              <label htmlFor={`edit-due-${task.id}`}>Prazo</label>
              <input
                id={`edit-due-${task.id}`}
                name="dueDate"
                type="date"
                defaultValue={task.dueDate || ""}
              />
            </div>

            <div className="field">
              <label htmlFor={`edit-recurrence-${task.id}`}>Repetir (Rotina)</label>
              <select id={`edit-recurrence-${task.id}`} name="recurrence" defaultValue={task.recurrence || "none"}>
                <option value="none">Não repete</option>
                <option value="daily">Diariamente</option>
                <option value="weekly">Semanalmente</option>
                <option value="monthly">Mensalmente</option>
              </select>
            </div>
          </div>

          <div className="field" style={{ flexDirection: "row", alignItems: "center", gap: "8px" }}>
            <input
              id={`edit-repeatSubtasks-${task.id}`}
              name="repeatSubtasks"
              type="checkbox"
              defaultChecked={task.repeatSubtasks ?? true}
            />
            <label htmlFor={`edit-repeatSubtasks-${task.id}`} style={{ cursor: "pointer", userSelect: "none" }}>
              Resetar e repetir subtarefas a cada ciclo de rotina
            </label>
          </div>

          <TagSelector allTags={allTags} selectedTagIds={task.tags?.map((t) => t.id) || []} />

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
