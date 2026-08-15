"use client";

import { useState } from "react";
import { createProjectAction } from "@/server/actions";
import { Modal } from "@/components/modal";

export function NewProjectModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="button-ghost compact"
        onClick={() => setIsOpen(true)}
        style={{ width: "100%", justifyContent: "flex-start", marginTop: "4px" }}
      >
        + Novo projeto
      </button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Criar Novo Projeto">
        <form action={createProjectAction} className="form-grid">
          <div className="field">
            <label htmlFor="modal-project-name">Nome do Projeto</label>
            <input
              id="modal-project-name"
              name="name"
              required
              placeholder="Ex.: Redesign da Plataforma"
              autoFocus
            />
          </div>
          <div className="field">
            <label htmlFor="modal-project-description">Descrição (Opcional)</label>
            <textarea
              id="modal-project-description"
              name="description"
              placeholder="Objetivo principal e detalhes do projeto..."
              rows={3}
            />
          </div>
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px" }}>
            <button type="button" className="button-secondary compact" onClick={() => setIsOpen(false)}>
              Cancelar
            </button>
            <button type="submit" className="button compact">
              Criar Projeto
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
