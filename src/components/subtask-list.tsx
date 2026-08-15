"use client";

import { useState, useTransition } from "react";
import { createSubtaskAction, toggleSubtaskAction, deleteSubtaskAction } from "@/server/actions";
import { Modal } from "@/components/modal";
import type { Subtask } from "@/domain/types";

type SubtaskListProps = {
  taskId: string;
  subtasks?: Subtask[];
};

export function SubtaskList({ taskId, subtasks = [] }: SubtaskListProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [isPending, startTransition] = useTransition();

  const completedCount = subtasks.filter((s) => s.completed).length;
  const totalCount = subtasks.length;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const title = newTitle.trim();
    setNewTitle("");
    setIsAddModalOpen(false);

    startTransition(async () => {
      const formData = new FormData();
      formData.append("taskId", taskId);
      formData.append("title", title);
      await createSubtaskAction(formData);
    });
  };

  const handleToggle = (subtaskId: string, currentStatus: boolean) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("subtaskId", subtaskId);
      formData.append("completed", String(!currentStatus));
      await toggleSubtaskAction(formData);
    });
  };

  const handleDelete = (subtaskId: string) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("subtaskId", subtaskId);
      await deleteSubtaskAction(formData);
    });
  };

  return (
    <div className="subtask-row-container">
      <div className="subtask-header-line">
        <button
          type="button"
          className="subtask-triangle-btn"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          title={isOpen ? "Recolher subtarefas" : "Expandir subtarefas"}
        >
          <span className={`triangle-icon ${isOpen ? "open" : ""}`}>▶</span>
          {totalCount > 0 && <span className="subtask-badge-count">{completedCount}/{totalCount}</span>}
        </button>

        <button
          type="button"
          className="subtask-quick-add-btn"
          onClick={() => setIsAddModalOpen(true)}
          title="Adicionar nova subtarefa"
        >
          + Subtarefa
        </button>
      </div>

      {isOpen && (
        <div className="subtask-expanded-list">
          {subtasks.length > 0 ? (
            subtasks.map((st) => (
              <div key={st.id} className="subtask-row-item">
                <input
                  type="checkbox"
                  checked={st.completed}
                  onChange={() => handleToggle(st.id, st.completed)}
                  disabled={isPending}
                />
                <span className={`subtask-text ${st.completed ? "done" : ""}`}>
                  {st.title}
                </span>
                <button
                  type="button"
                  className="subtask-remove-icon"
                  onClick={() => handleDelete(st.id)}
                  title="Excluir subtarefa"
                >
                  ✕
                </button>
              </div>
            ))
          ) : (
            <div className="subtask-empty-hint">
              Nenhuma subtarefa adicionada ainda.
            </div>
          )}
        </div>
      )}

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Adicionar Subtarefa">
        <form onSubmit={handleCreate} className="form-grid">
          <div className="field">
            <label htmlFor={`new-subtask-${taskId}`}>Título da Subtarefa</label>
            <input
              id={`new-subtask-${taskId}`}
              type="text"
              placeholder="Ex.: Revisar documentação..."
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              autoFocus
              required
            />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px" }}>
            <button type="button" className="button-secondary compact" onClick={() => setIsAddModalOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="button compact" disabled={!newTitle.trim() || isPending}>
              Adicionar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
