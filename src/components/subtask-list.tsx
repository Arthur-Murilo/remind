"use client";

import { useState, useTransition } from "react";
import { createSubtaskAction, toggleSubtaskAction, deleteSubtaskAction, updateSubtaskTitleAction } from "@/server/actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { TrashIcon } from "@/components/icons";
import type { Subtask } from "@/domain/types";

type SubtaskListProps = {
  taskId: string;
  subtasks?: Subtask[];
  expanded: boolean;
};

export function SubtaskList({ taskId, subtasks = [], expanded }: SubtaskListProps) {
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Subtask | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleCreate = () => {
    const title = draft.trim();
    if (!title) return;
    setDraft("");
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

  const confirmDelete = () => {
    if (!pendingDelete) return;
    const id = pendingDelete.id;
    setPendingDelete(null);
    startTransition(async () => {
      const formData = new FormData();
      formData.append("subtaskId", id);
      await deleteSubtaskAction(formData);
    });
  };

  const saveTitle = (subtaskId: string) => {
    const title = editTitle.trim();
    setEditingId(null);
    if (!title) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.append("subtaskId", subtaskId);
      formData.append("title", title);
      await updateSubtaskTitleAction(formData);
    });
  };

  return (
    <div className="asana-subtasks">
      {expanded ? (
        <div className="asana-subtasks-list">
          {subtasks.length === 0 ? (
            <div className="asana-subtasks-empty">Nenhuma subtarefa ainda.</div>
          ) : null}

          {subtasks.map((st) => (
            <div key={st.id} className={`asana-subtask-row ${st.completed ? "done" : ""}`}>
              <button
                type="button"
                className={`task-checkbox subtask-check ${st.completed ? "checked" : ""}`}
                onClick={() => handleToggle(st.id, st.completed)}
                disabled={isPending}
                aria-label={st.completed ? "Reabrir subtarefa" : "Concluir subtarefa"}
              >
                {st.completed ? (
                  <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M11.6666 3.5L5.24992 9.91667L2.33325 7"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                ) : null}
              </button>

              {editingId === st.id ? (
                <input
                  className="asana-subtask-input"
                  value={editTitle}
                  autoFocus
                  onChange={(e) => setEditTitle(e.target.value)}
                  onBlur={() => saveTitle(st.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveTitle(st.id);
                    if (e.key === "Escape") setEditingId(null);
                  }}
                  aria-label="Editar subtarefa"
                />
              ) : (
                <button
                  type="button"
                  className="asana-subtask-title"
                  onClick={() => {
                    setEditingId(st.id);
                    setEditTitle(st.title);
                  }}
                >
                  {st.title}
                </button>
              )}

              <button
                type="button"
                className="asana-subtask-delete"
                onClick={() => setPendingDelete(st)}
                title="Excluir subtarefa"
                aria-label={`Excluir subtarefa ${st.title}`}
              >
                <TrashIcon size={13} />
              </button>
            </div>
          ))}

          <div className="asana-subtask-add">
            <span className="asana-add-mark" aria-hidden="true">
              +
            </span>
            <input
              type="text"
              className="asana-subtask-input"
              placeholder="Adicionar subtarefa…"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleCreate();
                }
              }}
              disabled={isPending}
              aria-label="Nova subtarefa"
            />
          </div>
        </div>
      ) : null}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Excluir subtarefa?"
        description={
          pendingDelete ? `A subtarefa “${pendingDelete.title}” será removida permanentemente.` : ""
        }
        confirmLabel="Excluir"
        onCancel={() => setPendingDelete(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
