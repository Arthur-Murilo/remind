"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { setFocusGoalAction } from "@/server/actions";
import { formatDuration } from "@/lib/format";

type FocusGoalProps = {
  trackedSeconds: number;
  goalMinutes: number;
  /** "pill" para a faixa de métricas do desktop; "card" para o topo do Meu dia no telefone. */
  variant?: "pill" | "card";
};

export function FocusRing({ ratio, size = 22, stroke = 3 }: { ratio: number; size?: number; stroke?: number }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, ratio));
  const done = ratio >= 1;
  return (
    <svg className={`focus-ring${done ? " done" : ""}`} width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle className="focus-ring-track" cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} fill="none" />
      <circle
        className="focus-ring-value"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={stroke}
        fill="none"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - clamped)}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  );
}

export function FocusGoal({ trackedSeconds, goalMinutes, variant = "pill" }: FocusGoalProps) {
  const [open, setOpen] = useState(false);
  const [hours, setHours] = useState(String(Math.floor(goalMinutes / 60)));
  const [minutes, setMinutes] = useState(String(goalMinutes % 60));
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [isPending, startTransition] = useTransition();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const goalSeconds = goalMinutes * 60;
  const ratio = goalSeconds > 0 ? trackedSeconds / goalSeconds : 0;
  // Em minutos cheios, para "X de Y, faltam Z" fechar a conta na tela.
  const remaining = Math.max(0, goalSeconds - Math.floor(trackedSeconds / 60) * 60);

  useEffect(() => {
    setHours(String(Math.floor(goalMinutes / 60)));
    setMinutes(String(goalMinutes % 60));
  }, [goalMinutes]);

  useEffect(() => {
    if (!open) return;
    const rect = buttonRef.current?.getBoundingClientRect();
    if (rect) setCoords({ top: rect.bottom + 6, left: Math.max(8, Math.min(rect.left, window.innerWidth - 248)) });
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const save = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("hours", hours);
      formData.append("minutes", minutes);
      await setFocusGoalAction(formData);
      setOpen(false);
    });
  };

  const status = ratio >= 1 ? "Meta batida" : `Faltam ${formatDuration(remaining)}`;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={`focus-goal focus-goal--${variant}${ratio >= 1 ? " done" : ""}`}
        aria-expanded={open}
        aria-label={`Meta diária de foco: ${formatDuration(trackedSeconds)} de ${formatDuration(goalSeconds)}. ${status}. Ajustar meta`}
        onClick={() => setOpen((value) => !value)}
      >
        <FocusRing ratio={ratio} size={variant === "card" ? 40 : 22} stroke={variant === "card" ? 4 : 3} />
        <span className="focus-goal-text">
          <span className="metric-pill-label">{variant === "card" ? "Foco hoje" : "Tempo hoje"}</span>
          <strong className="metric-pill-value">
            {formatDuration(trackedSeconds)}
            <span className="focus-goal-of"> / {formatDuration(goalSeconds)}</span>
          </strong>
          {variant === "card" ? <span className="focus-goal-status">{status}</span> : null}
        </span>
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menuRef}
              className="inline-menu focus-goal-menu"
              role="dialog"
              aria-label="Meta diária de foco"
              style={{ top: coords.top, left: coords.left }}
            >
              <div className="inline-menu-label">Meta diária de foco</div>
              <p className="focus-goal-copy">
                {Math.round(Math.min(ratio, 9.99) * 100)}% hoje · {status.toLowerCase()}.
              </p>
              <div className="timer-duration">
                <label>
                  <span>Horas</span>
                  <input type="number" min="0" max="16" value={hours} onChange={(event) => setHours(event.target.value)} />
                </label>
                <label>
                  <span>Minutos</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    step="15"
                    value={minutes}
                    onChange={(event) => setMinutes(event.target.value)}
                  />
                </label>
              </div>
              <div className="focus-goal-actions">
                <button type="button" className="button compact" onClick={save} disabled={isPending}>
                  Salvar meta
                </button>
                <Link className="button-ghost compact" href={"/app/tempo?period=day" as never} onClick={() => setOpen(false)}>
                  Ver dia
                </Link>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
