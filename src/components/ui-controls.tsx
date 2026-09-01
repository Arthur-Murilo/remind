"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarIcon } from "@/components/icons";

export type SelectOption = {
  value: string;
  label: string;
  className?: string;
  hint?: string;
};

type SelectPopoverProps = {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  ariaLabel: string;
  placeholder?: string;
  triggerClassName?: string;
  menuClassName?: string;
  renderValue?: (option: SelectOption | undefined) => React.ReactNode;
  name?: string;
  disabled?: boolean;
};

export function SelectPopover({
  value,
  options,
  onChange,
  ariaLabel,
  placeholder = "Selecionar",
  triggerClassName = "",
  menuClassName = "",
  renderValue,
  name,
  disabled
}: SelectPopoverProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const selected = options.find((o) => o.value === value);

  useEffect(() => {
    if (!open) return;
    const update = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = 240;
      const left = Math.min(rect.left, window.innerWidth - width - 12);
      setCoords({ top: rect.bottom + 6, left: Math.max(12, left) });
    };
    update();
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
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

  return (
    <>
      {name ? <input type="hidden" name={name} value={value} /> : null}
      <button
        ref={triggerRef}
        type="button"
        className={`ui-select-trigger ${triggerClassName} ${open ? "open" : ""}`}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-haspopup="listbox"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="ui-select-value">
          {renderValue
            ? renderValue(selected)
            : selected
              ? (
                <span className={selected.className || ""}>{selected.label}</span>
              )
              : (
                <span className="ui-select-placeholder">{placeholder}</span>
              )}
        </span>
        <span className="ui-select-chevron" aria-hidden="true" />
      </button>
      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              className={`inline-menu polished ui-select-menu ${menuClassName}`}
              style={{ top: coords.top, left: coords.left }}
              role="listbox"
              aria-label={ariaLabel}
            >
              <div className="inline-menu-label">{ariaLabel}</div>
              {options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  className={`inline-menu-item ${option.value === value ? "selected" : ""}`}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <span className="inline-menu-item-main">
                    <span className={option.className || ""}>{option.label}</span>
                    {option.hint ? <span className="inline-menu-hint">{option.hint}</span> : null}
                  </span>
                  {option.value === value ? <span className="inline-check">✓</span> : null}
                </button>
              ))}
            </div>,
            document.body
          )
        : null}
    </>
  );
}

/** Alias used by the task table */
export function InlineMenu({
  label,
  options,
  value,
  onChange,
  ariaLabel,
  className
}: {
  label: React.ReactNode;
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <SelectPopover
      value={value}
      options={options}
      onChange={onChange}
      ariaLabel={ariaLabel}
      triggerClassName={`inline-cell-btn ${className || ""}`}
      renderValue={() => label}
    />
  );
}

function toDateValue(value: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T12:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatIso(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

type DateFieldProps = {
  value: string | null;
  onChange: (value: string) => void;
  display?: string;
  ariaLabel?: string;
  name?: string;
  allowClear?: boolean;
  triggerClassName?: string;
};

export function DateField({
  value,
  onChange,
  display,
  ariaLabel = "Selecionar prazo",
  name,
  allowClear = true,
  triggerClassName = ""
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const selected = toDateValue(value);
  const [cursor, setCursor] = useState(() => selected || new Date());

  useEffect(() => {
    if (selected) setCursor(selected);
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const update = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const width = 280;
      const menuHeight = menuRef.current?.offsetHeight || 360;
      const left = Math.min(rect.left, window.innerWidth - width - 12);
      const opensBelow = rect.bottom + 6 + menuHeight <= window.innerHeight - 12;
      const top = opensBelow ? rect.bottom + 6 : Math.max(12, rect.top - menuHeight - 6);
      setCoords({ top, left: Math.max(12, left) });
    };
    update();
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (triggerRef.current?.contains(target) || menuRef.current?.contains(target)) return;
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

  const days = useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();
    const first = new Date(year, month, 1);
    const startPad = first.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: Array<{ date: Date; inMonth: boolean }> = [];
    for (let i = 0; i < startPad; i += 1) {
      cells.push({ date: new Date(year, month, i - startPad + 1), inMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d += 1) {
      cells.push({ date: new Date(year, month, d), inMonth: true });
    }
    while (cells.length % 7 !== 0) {
      const last = cells[cells.length - 1].date;
      cells.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), inMonth: false });
    }
    return cells;
  }, [cursor]);

  const monthLabel = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(cursor);
  const shown =
    display ||
    (value
      ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium" }).format(new Date(`${value}T00:00:00`))
      : "Sem prazo");

  const pick = (date: Date) => {
    onChange(formatIso(date));
    setOpen(false);
  };

  return (
    <>
      {name ? <input type="hidden" name={name} value={value || ""} /> : null}
      <button
        ref={triggerRef}
        type="button"
        className={`ui-select-trigger date-trigger ${triggerClassName} ${open ? "open" : ""}`}
        aria-label={ariaLabel}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <CalendarIcon />
        <span>{shown}</span>
        <span className="ui-select-chevron" aria-hidden="true" />
      </button>
      {open && typeof document !== "undefined"
        ? createPortal(
            <div ref={menuRef} className="date-popover" style={{ top: coords.top, left: coords.left }}>
              <div className="date-popover-header">
                <button
                  type="button"
                  className="date-nav-btn"
                  onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
                  aria-label="Mês anterior"
                >
                  ‹
                </button>
                <strong>{monthLabel}</strong>
                <button
                  type="button"
                  className="date-nav-btn"
                  onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
                  aria-label="Próximo mês"
                >
                  ›
                </button>
              </div>
              <div className="date-weekdays">
                {["D", "S", "T", "Q", "Q", "S", "S"].map((d, i) => (
                  <span key={`${d}-${i}`}>{d}</span>
                ))}
              </div>
              <div className="date-grid">
                {days.map(({ date, inMonth }) => {
                  const iso = formatIso(date);
                  const isSelected = value === iso;
                  const isToday = formatIso(new Date()) === iso;
                  return (
                    <button
                      key={iso + String(inMonth)}
                      type="button"
                      className={`date-cell ${inMonth ? "" : "muted"} ${isSelected ? "selected" : ""} ${isToday ? "today" : ""}`}
                      onClick={() => pick(date)}
                    >
                      {date.getDate()}
                    </button>
                  );
                })}
              </div>
              <div className="date-popover-footer">
                <button type="button" className="button-ghost compact" onClick={() => pick(new Date())}>
                  Hoje
                </button>
                {allowClear ? (
                  <button
                    type="button"
                    className="button-ghost compact"
                    onClick={() => {
                      onChange("");
                      setOpen(false);
                    }}
                  >
                    Sem prazo
                  </button>
                ) : null}
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}

export function InlineDate({
  value,
  onChange,
  display
}: {
  value: string | null;
  onChange: (value: string) => void;
  display: string;
}) {
  return (
    <DateField
      value={value}
      onChange={onChange}
      display={display}
      triggerClassName="inline-cell-btn"
      ariaLabel="Alterar prazo"
    />
  );
}

type CustomCheckboxProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
  name?: string;
  label: React.ReactNode;
  disabled?: boolean;
};

export function CustomCheckbox({ checked, onChange, id, name, label, disabled }: CustomCheckboxProps) {
  const autoId = useId();
  const inputId = id || autoId;

  return (
    <label className={`ui-checkbox ${checked ? "checked" : ""} ${disabled ? "disabled" : ""}`} htmlFor={inputId}>
      <input
        id={inputId}
        type="checkbox"
        name={name}
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="ui-checkbox-input"
      />
      <span className="ui-checkbox-box" aria-hidden="true">
        {checked ? (
          <svg viewBox="0 0 14 14" width="10" height="10" fill="none">
            <path
              d="M11.2 3.5L5.25 9.5L2.8 7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </span>
      <span className="ui-checkbox-label">{label}</span>
    </label>
  );
}
