"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { createTagAndAssignAction, deleteTagAction, setTaskTagsAction, updateTagAction } from "@/server/actions";
import type { Tag } from "@/domain/types";

type InlineTagsCellProps = {
  taskId: string;
  tags: Tag[];
  allTags: Tag[];
};

export function InlineTagsCell({ taskId, tags, allTags }: InlineTagsCellProps) {
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [isPending, startTransition] = useTransition();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open) return;
    const update = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setCoords({ top: rect.bottom + 4, left: Math.min(rect.left, window.innerWidth - 280) });
    };
    update();
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    window.addEventListener("mousedown", onPointerDown);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("mousedown", onPointerDown);
    };
  }, [open]);

  const selectedIds = tags.map((t) => t.id);

  const persist = (nextIds: string[]) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("taskId", taskId);
      nextIds.forEach((id) => formData.append("tagIds", id));
      await setTaskTagsAction(formData);
    });
  };

  const toggle = (tagId: string) => {
    const next = selectedIds.includes(tagId)
      ? selectedIds.filter((id) => id !== tagId)
      : [...selectedIds, tagId].slice(0, 5);
    persist(next);
  };

  const createAndAssign = () => {
    const name = newName.trim();
    if (!name) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.append("taskId", taskId);
      formData.append("name", name);
      selectedIds.forEach((id) => formData.append("tagIds", id));
      await createTagAndAssignAction(formData);
      setNewName("");
    });
  };

  const recolor = (tagId: string, color: string) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("tagId", tagId);
      formData.append("color", color);
      await updateTagAction(formData);
    });
  };

  const removeTag = (tagId: string) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("tagId", tagId);
      await deleteTagAction(formData);
    });
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="inline-cell-btn tags-cell-btn"
        aria-label="Gerenciar etiquetas"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        disabled={isPending}
      >
        {tags.length ? (
          <span className="tag-list-inline compact">
            {tags.slice(0, 3).map((t) => (
              <span key={t.id} className="tag-badge">
                <span className="tag-dot" style={{ backgroundColor: t.color || "var(--primary)" }} />
                {t.name}
              </span>
            ))}
            {tags.length > 3 ? <span className="tag-more">+{tags.length - 3}</span> : null}
          </span>
        ) : (
          <span className="inline-placeholder">+ Etiqueta</span>
        )}
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div ref={menuRef} className="inline-menu tags-menu catalog-menu" style={{ top: coords.top, left: coords.left }}>
              <div className="tags-menu-list catalog-menu-list">
                {allTags.length ? (
                  allTags.map((tag) => {
                    const selected = selectedIds.includes(tag.id);
                    return (
                      <div key={tag.id} className={`catalog-menu-row ${selected ? "selected" : ""}`}>
                        <button
                          type="button"
                          className="catalog-menu-pick"
                          onClick={() => toggle(tag.id)}
                          disabled={!selected && selectedIds.length >= 5}
                        >
                          <span className="tag-dot" style={{ backgroundColor: tag.color || "var(--primary)" }} />
                          {tag.name}
                        </button>
                        <label className="catalog-color" title="Mudar cor">
                          <input
                            type="color"
                            value={tag.color || "#5b6cff"}
                            aria-label={`Cor de ${tag.name}`}
                            onChange={(event) => recolor(tag.id, event.target.value)}
                          />
                        </label>
                        <button
                          type="button"
                          className="catalog-delete"
                          title={`Excluir ${tag.name}`}
                          aria-label={`Excluir etiqueta ${tag.name}`}
                          onClick={() => removeTag(tag.id)}
                        >
                          ×
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="tags-menu-empty">Nenhuma etiqueta ainda.</div>
                )}
              </div>
              <div className="tags-menu-create">
                <input
                  type="text"
                  placeholder="Nova etiqueta..."
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      createAndAssign();
                    }
                  }}
                  maxLength={40}
                />
                <button type="button" className="button compact" onClick={createAndAssign} disabled={!newName.trim()}>
                  Criar
                </button>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
