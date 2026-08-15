"use client";

import { useState, useTransition } from "react";
import { createTagAction } from "@/server/actions";
import type { Tag } from "@/domain/types";

type TagSelectorProps = {
  allTags?: Tag[];
  selectedTagIds?: string[];
};

export function TagSelector({ allTags = [], selectedTagIds = [] }: TagSelectorProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(selectedTagIds);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#5b6cff");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const toggleTag = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((tId) => tId !== id));
    } else {
      if (selectedIds.length >= 5) {
        alert("Você pode selecionar no máximo 5 tags por tarefa.");
        return;
      }
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleCreateTag = () => {
    if (!newTagName.trim()) return;

    const name = newTagName.trim();
    const color = newTagColor;

    setNewTagName("");
    setShowCreateForm(false);

    startTransition(async () => {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("color", color);
      await createTagAction(formData);
    });
  };

  return (
    <div className="field" style={{ marginTop: "8px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <label>Tags ({selectedIds.length}/5)</label>
        <button
          type="button"
          className="link-button"
          onClick={() => setShowCreateForm(!showCreateForm)}
          style={{ fontSize: "0.8rem" }}
        >
          {showCreateForm ? "Fechar" : "+ Criar Tag"}
        </button>
      </div>

      {/* Hidden inputs to transmit selected tagIds in HTML FormData */}
      {selectedIds.map((id) => (
        <input key={id} type="hidden" name="tagIds" value={id} />
      ))}

      <div className="tag-selector-pills" style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "6px" }}>
        {allTags.map((tag) => {
          const isSelected = selectedIds.includes(tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className={`tag-select-btn ${isSelected ? "selected" : ""}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "5px",
                padding: "3px 10px",
                borderRadius: "14px",
                fontSize: "0.8rem",
                border: isSelected ? `1.5px solid ${tag.color || "var(--primary)"}` : "1px solid var(--line-strong)",
                background: isSelected ? "var(--surface-active)" : "var(--surface)",
                color: isSelected ? "var(--ink)" : "var(--ink-soft)",
                cursor: "pointer"
              }}
            >
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: tag.color || "var(--primary)" }} />
              {tag.name}
            </button>
          );
        })}

        {allTags.length === 0 && !showCreateForm && (
          <span style={{ fontSize: "0.8rem", color: "var(--ink-faint)" }}>
            Nenhuma tag criada ainda. Clique em "+ Criar Tag".
          </span>
        )}
      </div>

      {showCreateForm && (
        <div style={{ display: "flex", gap: "6px", marginTop: "8px", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Nome da tag..."
            value={newTagName}
            onChange={(e) => setNewTagName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCreateTag();
              }
            }}
            style={{ flex: 1, minHeight: "28px", padding: "0 8px", fontSize: "0.82rem" }}
          />
          <input
            type="color"
            value={newTagColor}
            onChange={(e) => setNewTagColor(e.target.value)}
            style={{ width: "32px", height: "28px", padding: 0, border: 0, cursor: "pointer", background: "none" }}
            title="Escolher cor da tag"
          />
          <button
            type="button"
            onClick={handleCreateTag}
            className="button-secondary compact"
            disabled={!newTagName.trim() || isPending}
          >
            Salvar
          </button>
        </div>
      )}
    </div>
  );
}
