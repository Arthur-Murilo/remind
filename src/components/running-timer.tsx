"use client";

import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { stopWorkSessionAction } from "@/server/actions";
import { StopIcon } from "@/components/icons";
import { formatDurationClock } from "@/lib/format";
import { formatCountdown, setFocusState, useFocusState } from "@/lib/focus-store";

type RunningTimerProps = {
  session: { id: string; taskId: string; taskTitle: string; projectName: string; startedAt: string } | null;
};

/** Cronômetro global: visível em qualquer tela enquanto houver sessão aberta. */
export function RunningTimer({ session }: RunningTimerProps) {
  const [now, setNow] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const focus = useFocusState();
  const inFocus = Boolean(session && focus?.phase === "focus" && focus.taskId === session.taskId);

  useEffect(() => {
    if (!session) {
      setNow(null);
      return;
    }
    const tick = () => setNow(Date.now());
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [session]);

  const elapsed = session && now !== null ? Math.max(0, Math.floor((now - new Date(session.startedAt).getTime()) / 1000)) : null;
  const clock =
    elapsed === null ? "—" : inFocus && focus ? formatCountdown(focus.endsAt - (now ?? Date.now())) : formatDurationClock(elapsed);

  useEffect(() => {
    if (!session || elapsed === null) return;
    // Restaura o título que estava antes deste tick, e só se ninguém o trocou (ex.: navegação).
    const previous = document.title;
    const next = `${inFocus ? "⏳" : "▶"} ${clock} · ${session.taskTitle}`;
    document.title = next;
    return () => {
      if (document.title === next) document.title = previous;
    };
  }, [session, elapsed, clock, inFocus]);

  if (!session) return null;

  const stop = () => {
    startTransition(async () => {
      await stopWorkSessionAction();
      if (focus) setFocusState(null);
    });
  };

  return (
    <div className={`running-timer${inFocus ? " focus" : ""}`} role="status" aria-live="off">
      <span className="running-timer-dot" aria-hidden="true" />
      <Link
        href={`/app/tasks/${session.taskId}/edit`}
        className="running-timer-task"
        title={`${session.taskTitle} · ${session.projectName}`}
      >
        {session.taskTitle}
      </Link>
      {inFocus && focus ? (
        <button
          type="button"
          className="running-timer-clock as-button"
          onClick={() => setFocusState({ ...focus, minimized: false })}
          aria-label={`Foco: faltam ${clock}. Abrir painel de foco`}
          title="Abrir painel de foco"
        >
          {clock}
        </button>
      ) : (
        <span className="running-timer-clock">{clock}</span>
      )}
      <button
        type="button"
        className="running-timer-stop"
        onClick={stop}
        disabled={isPending}
        aria-label={`Parar cronômetro de ${session.taskTitle}`}
        title="Parar"
      >
        <StopIcon />
      </button>
    </div>
  );
}
