"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import {
  createCustomPriorityAction,
  createCustomStatusAction,
  deleteCatalogItemAction,
  setCatalogColorAction
} from "@/server/actions";
import { CatalogBadge } from "@/components/catalog-badge";
import { CATALOG_COLORS } from "@/domain/catalog";
import type { CatalogItem } from "@/domain/types";
import { TrashIcon } from "@/components/icons";

type CatalogCellProps = {
  kind: "status" | "priority";
  value: string;
  items: CatalogItem[];
  ariaLabel: string;
  onChange: (value: string) => void;
};

export function CatalogCell({ kind, value, items, ariaLabel, onChange }: CatalogCellProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [color, setColor] = useState(kind === "status" ? "#5b6cff" : "#e2a336");
  const [isPending, startTransition] = useTransition();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const selected = items.find((item) => item.key === value) || {
    key: value,
    label: value,
    color: "#9aa1b0",
    system: false
  };

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
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const create = () => {
    const label = draft.trim();
    if (!label) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.append("label", label);
      formData.append("color", color);
      if (kind === "status") {
        await createCustomStatusAction(formData);
      } else {
        await createCustomPriorityAction(formData);
      }
      setDraft("");
    });
  };

  const recolor = (key: string, nextColor: string) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("kind", kind);
      formData.append("key", key);
      formData.append("color", nextColor);
      await setCatalogColorAction(formData);
    });
  };

  const remove = (key: string) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("kind", kind);
      formData.append("key", key);
      await deleteCatalogItemAction(formData);
    });
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className="inline-cell-btn"
        aria-label={ariaLabel}
        aria-expanded={open}
        disabled={isPending}
        onClick={() => setOpen((v) => !v)}
      >
        <CatalogBadge item={selected} />
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div ref={menuRef} className="inline-menu catalog-menu" style={{ top: coords.top, left: coords.left }}>
              <div className="inline-menu-label">{ariaLabel}</div>
              <div className="catalog-menu-list">
                {items.map((item) => (
                  <div key={item.key} className={`catalog-menu-row ${item.key === value ? "selected" : ""}`}>
                    <button
                      type="button"
                      className="catalog-menu-pick"
                      onClick={() => {
                        onChange(item.key);
                        setOpen(false);
                      }}
                    >
                      <CatalogBadge item={item} />
                    </button>
                    <label className="catalog-color" title="Mudar cor">
                      <input
                        type="color"
                        value={item.color}
                        aria-label={`Cor de ${item.label}`}
                        onChange={(event) => recolor(item.key, event.target.value)}
                      />
                    </label>
                    {item.system ? null : (
                      <button
                        type="button"
                        className="catalog-delete"
                        title={`Excluir ${item.label}`}
                        aria-label={`Excluir ${item.label}`}
                        onClick={() => remove(item.key)}
                      >
                        <TrashIcon size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div className="catalog-menu-create">
                <input
                  type="text"
                  placeholder={kind === "status" ? "Novo status..." : "Nova prioridade..."}
                  value={draft}
                  maxLength={40}
                  onChange={(event) => setDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      create();
                    }
                  }}
                />
                <div className="catalog-swatches">
                  {CATALOG_COLORS.map((swatch) => (
                    <button
                      key={swatch}
                      type="button"
                      className={`catalog-swatch ${color === swatch ? "selected" : ""}`}
                      style={{ background: swatch }}
                      aria-label={`Cor ${swatch}`}
                      onClick={() => setColor(swatch)}
                    />
                  ))}
                </div>
                <button type="button" className="button compact" onClick={create} disabled={!draft.trim()}>
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
