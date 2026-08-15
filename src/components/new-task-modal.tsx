"use client";

import { useState } from "react";
import { createTaskAction } from "@/server/actions";
import { Modal } from "@/components/modal";
import { TagSelector } from "@/components/tag-selector";
import type { Project, Tag } from "@/domain/types";

type NewTaskModalProps = {
  projects: Project[];
  allTags?: Tag[];
  defaultProjectId?: string;
  buttonText?: string;
  buttonClass?: string;
};

export function NewTaskModal({
  projects = [],
  allTags = [],
  defaultProjectId,
  buttonText = "+ Nova tarefa",
  buttonClass = "button compact"
}: NewTaskModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedProject = defaultProjectId || (projects[0]?.id ?? "");

  return (
    <>
      <button
        type="button"
        className={buttonClass}
        onClick={() => setIsOpen(true)}
      >
        {buttonText}
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Criar Nova Tarefa">
        <form
          action={async (formData) => {
            await createTaskAction(formData);
            setIsOpen(false);
          }}
          className="form-grid"
        >
          {projects.length > 0 ? (
            <div className="field">
              <label htmlFor="new-task-project">Projeto</label>
              <select
                id="new-task-project"
                name="projectId"
                defaultValue={selectedProject}
                required
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <input type="hidden" name="projectId" value={selectedProject} />
          )}

          <div className="field">
            <label htmlFor="new-task-title">Título da Tarefa</label>
            <input
              id="new-task-title"
              name="title"
              required
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
              <label htmlFor="new-task-status">Status</label>
              <select id="new-task-status" name="status" defaultValue="todo">
                <option value="todo">A fazer</option>
                <option value="in_progress">Em andamento</option>
                <option value="done">Concluída</option>
              </select>
            </div>

            <div className="field">
              <label htmlFor="new-task-priority">Prioridade</label>
              <select id="new-task-priority" name="priority" defaultValue="medium">
                <option value="high">Alta</option>
                <option value="medium">Média</option>
                <option value="low">Baixa</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="field">
              <label htmlFor="new-task-dueDate">Prazo</label>
              <input id="new-task-dueDate" name="dueDate" type="date" />
            </div>

            <div className="field">
              <label htmlFor="new-task-recurrence">Repetir (Rotina)</label>
              <select id="new-task-recurrence" name="recurrence" defaultValue="none">
                <option value="none">Não repete</option>
                <option value="daily">Diariamente</option>
                <option value="weekly">Semanalmente</option>
                <option value="monthly">Mensalmente</option>
              </select>
            </div>
          </div>

          <div className="field" style={{ flexDirection: "row", alignItems: "center", gap: "8px" }}>
            <input id="new-task-repeatSubtasks" name="repeatSubtasks" type="checkbox" defaultChecked={true} />
            <label htmlFor="new-task-repeatSubtasks" style={{ cursor: "pointer", userSelect: "none" }}>
              Resetar e repetir subtarefas a cada ciclo de rotina
            </label>
          </div>

          <TagSelector allTags={allTags} />

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
