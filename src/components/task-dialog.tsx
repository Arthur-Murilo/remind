"use client";

import { useEffect, useRef, type ReactNode } from "react";

export type TaskDialogVariant = "create" | "edit";

type TaskDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  variant?: TaskDialogVariant;
  children: ReactNode;
};

export function TaskDialog({ isOpen, onClose, title, variant = "create", children }: TaskDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !isOpen) return;
    if (!dialog.open) dialog.showModal();
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <dialog
      ref={dialogRef}
      className={`task-dialog task-dialog--${variant}`}
      aria-labelledby="task-dialog-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose();
      }}
    >
      <div className="modal-container task-dialog-panel" onClick={(event) => event.stopPropagation()}>
        <div className="task-sheet-handle" aria-hidden="true" />
        <div className="modal-header">
          <h2 id="task-dialog-title" className="modal-title">
            {title}
          </h2>
          <button type="button" className="modal-close task-dialog-close" onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </dialog>
  );
}
