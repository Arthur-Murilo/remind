"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { createManualSessionAction, startWorkSessionAction, stopWorkSessionAction } from "@/server/actions";
import { formatDurationClock, formatEstimate } from "@/lib/format";
import { PauseIcon, PlayIcon } from "@/components/icons";
import { startFocus } from "@/components/focus-mode";
import { FOCUS_PRESETS } from "@/lib/focus-store";

type TaskTimerProps = {
  taskId: string;
  taskTitle?: string;
  runningStartedAt?: string | null;
  totalTrackedSeconds?: number;
  estimateMinutes?: number | null;
};

function todayIso(now = new Date()) {
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

/** Data e hora de "agora menos a duração", do mesmo instante (00:10 − 30 min = ontem 23:40). */
function startMinutesAgo(minutes: number) {
  const date = new Date(Date.now() - minutes * 60000);
  return {
    date: todayIso(date),
    time: `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
  };
}

export function TaskTimer({ taskId, taskTitle = "", runningStartedAt, totalTrackedSeconds = 0, estimateMinutes }: TaskTimerProps) {
  const [open, setOpen] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [hours, setHours] = useState("0");
  const [minutes, setMinutes] = useState("30");
  const [date, setDate] = useState(todayIso);
  const [startTime, setStartTime] = useState("");
  const [isPending, startTransition] = useTransition();
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const running = Boolean(runningStartedAt);
  const displayedSeconds = totalTrackedSeconds + elapsed;
  const estimateSeconds = (estimateMinutes || 0) * 60;
  const overEstimate = estimateSeconds > 0 && displayedSeconds > estimateSeconds;

  useEffect(() => {
    if (!runningStartedAt) {
      setElapsed(0);
      return;
    }
    const tick = () => {
      setElapsed(Math.max(0, Math.floor((Date.now() - new Date(runningStartedAt).getTime()) / 1000)));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [runningStartedAt]);

  useEffect(() => {
    if (!open) return;
    if (!startTime) {
      const start = startMinutesAgo(Number(hours) * 60 + Number(minutes));
      setStartTime(start.time);
      setDate(start.date);
    }
    const update = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      setCoords({ top: rect.bottom + 4, left: Math.min(rect.left, window.innerWidth - 260) });
    };
    update();
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (buttonRef.current?.contains(target) || menuRef.current?.contains(target)) return;
      setOpen(false);
    };
    window.addEventListener("mousedown", onPointerDown);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("resize", update);
    };
  }, [open]);

  const toggleTimer = () => {
    startTransition(async () => {
      if (running) {
        await stopWorkSessionAction();
        return;
      }
      const formData = new FormData();
      formData.append("taskId", taskId);
      await startWorkSessionAction(formData);
    });
  };

  const addManual = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("taskId", taskId);
      formData.append("date", date);
      formData.append("startTime", startTime);
      formData.append("hours", hours);
      formData.append("minutes", minutes);
      await createManualSessionAction(formData);
      setStartTime("");
      setOpen(false);
    });
  };

  return (
    <div className="task-timer">
      <button
        type="button"
        className={`timer-toggle ${running ? "running" : ""}`}
        onClick={toggleTimer}
        disabled={isPending}
        aria-label={running ? "Parar cronômetro" : "Iniciar cronômetro"}
        title={running ? "Parar" : "Iniciar"}
      >
        {running ? <PauseIcon /> : <PlayIcon />}
      </button>
      <button
        ref={buttonRef}
        type="button"
        className={`timer-readout ${running ? "running" : ""}${overEstimate ? " over" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-label="Ajustar tempo da tarefa"
        aria-expanded={open}
        title={
          estimateSeconds
            ? `${formatDurationClock(displayedSeconds)} de ${formatEstimate(estimateMinutes)} estimadas${overEstimate ? " (acima da estimativa)" : ""}`
            : undefined
        }
      >
        {formatDurationClock(displayedSeconds)}
        {estimateSeconds ? <span className="timer-estimate"> / {formatEstimate(estimateMinutes)}</span> : null}
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div ref={menuRef} className="inline-menu timer-menu" style={{ top: coords.top, left: coords.left }}>
              <div className="inline-menu-label">Modo foco</div>
              <div className="timer-focus-row">
                {FOCUS_PRESETS.map((preset) => (
                  <button
                    key={preset.minutes}
                    type="button"
                    className="button-secondary compact"
                    disabled={isPending}
                    onClick={() =>
                      startTransition(async () => {
                        await startFocus({ id: taskId, title: taskTitle }, preset.minutes);
                        setOpen(false);
                      })
                    }
                  >
                    Foco {preset.label}
                  </button>
                ))}
              </div>
              <div className="inline-menu-label">Registrar tempo</div>
              <label className="timer-field">
                <span>Data</span>
                <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
              </label>
              <label className="timer-field">
                <span>Início</span>
                <input type="time" value={startTime} onChange={(event) => setStartTime(event.target.value)} />
              </label>
              <div className="timer-duration">
                <label>
                  <span>Horas</span>
                  <input
                    type="number"
                    min="0"
                    max="24"
                    value={hours}
                    onChange={(event) => setHours(event.target.value)}
                  />
                </label>
                <label>
                  <span>Minutos</span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={minutes}
                    onChange={(event) => setMinutes(event.target.value)}
                  />
                </label>
              </div>
              <button type="button" className="button compact" onClick={addManual} disabled={isPending}>
                Adicionar
              </button>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
