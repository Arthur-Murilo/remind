"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { startWorkSessionAction, stopWorkSessionAction } from "@/server/actions";
import { FocusRing } from "@/components/focus-goal";
import { playCompletionSound } from "@/lib/sound";
import { FOCUS_PRESETS, formatCountdown, setFocusState, useFocusState, type FocusState } from "@/lib/focus-store";

type RunningSession = { id: string; taskId: string; taskTitle: string; startedAt: string } | null;

/** Inicia uma sessão de trabalho na tarefa e liga a contagem do foco. */
export async function startFocus(task: { id: string; title: string }, minutes = 25) {
  const preset = FOCUS_PRESETS.find((item) => item.minutes === minutes) ?? FOCUS_PRESETS[0];
  const formData = new FormData();
  formData.append("taskId", task.id);
  await startWorkSessionAction(formData);
  const now = Date.now();
  setFocusState({
    phase: "focus",
    taskId: task.id,
    taskTitle: task.title,
    minutes: preset.minutes,
    breakMinutes: preset.breakMinutes,
    startedAt: now,
    endsAt: now + preset.minutes * 60_000
  });
}

/**
 * Painel do modo foco. Controla as transições: fim do foco → para o cronômetro e
 * abre a pausa; fim da pausa → oferece outro foco. Se o cronômetro for parado ou
 * trocado por fora, o foco é encerrado.
 */
export function FocusPanel({ session }: { session: RunningSession }) {
  const focus = useFocusState();
  const [now, setNow] = useState(() => Date.now());
  const [breakOver, setBreakOver] = useState<FocusState | null>(null);
  const [isPending, startTransition] = useTransition();
  const finishing = useRef(false);

  useEffect(() => {
    if (!focus) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [focus]);

  // Cronômetro parado/trocado nesta aba (a sessão mudou de "a tarefa do foco" para outra coisa):
  // encerra a contagem. Só reage a uma mudança observada aqui, para que uma aba com dados
  // antigos não cancele o foco iniciado em outra.
  const previousTaskId = useRef<string | null>(session?.taskId ?? null);
  useEffect(() => {
    const previous = previousTaskId.current;
    const current = session?.taskId ?? null;
    previousTaskId.current = current;
    if (!focus || focus.phase !== "focus") return;
    if (previous === focus.taskId && current !== focus.taskId) setFocusState(null);
  }, [focus, session]);

  // Durante a pausa não há cronômetro na topbar: a contagem vai para o título da aba.
  useEffect(() => {
    if (focus?.phase !== "break") return;
    const previous = document.title;
    const next = `☕ ${formatCountdown(focus.endsAt - now)} · Pausa`;
    document.title = next;
    return () => {
      if (document.title === next) document.title = previous;
    };
  }, [focus, now]);

  useEffect(() => {
    if (!focus || now < focus.endsAt || finishing.current) return;
    finishing.current = true;
    playCompletionSound();
    if (focus.phase === "focus") {
      startTransition(async () => {
        try {
          // Fecha a sessão no fim planejado do foco, não "agora" (aba dormindo, notebook fechado).
          await stopWorkSessionAction(focus.endsAt);
          const start = Date.now();
          setFocusState({ ...focus, phase: "break", startedAt: start, endsAt: start + focus.breakMinutes * 60_000, minimized: false });
        } catch {
          // Sem servidor: encerra o foco em vez de repetir a transição (e o som) a cada tick.
          setFocusState(null);
        } finally {
          finishing.current = false;
        }
      });
    } else {
      setBreakOver(focus);
      setFocusState(null);
      finishing.current = false;
    }
  }, [focus, now]);

  if (breakOver && !focus) {
    return (
      <div className="focus-panel" role="dialog" aria-label="Pausa concluída">
        <div className="focus-panel-head">
          <span className="focus-panel-phase">Pausa concluída</span>
        </div>
        <p className="focus-panel-task">Pronto para mais um foco em “{breakOver.taskTitle}”?</p>
        <div className="focus-panel-actions">
          <button
            type="button"
            className="button compact"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await startFocus({ id: breakOver.taskId, title: breakOver.taskTitle }, breakOver.minutes);
                setBreakOver(null);
              })
            }
          >
            Mais {breakOver.minutes} min
          </button>
          <button type="button" className="button-ghost compact" onClick={() => setBreakOver(null)}>
            Encerrar
          </button>
        </div>
      </div>
    );
  }

  if (!focus) return null;

  const totalMs = (focus.phase === "focus" ? focus.minutes : focus.breakMinutes) * 60_000;
  const remaining = Math.max(0, focus.endsAt - now);
  const ratio = 1 - remaining / totalMs;

  if (focus.minimized) {
    // Durante o foco, o cronômetro da topbar já mostra a contagem.
    if (focus.phase === "focus" && session?.taskId === focus.taskId) return null;
    return (
      <button
        type="button"
        className={`focus-chip focus-chip--${focus.phase}`}
        onClick={() => setFocusState({ ...focus, minimized: false })}
        aria-label={`${focus.phase === "focus" ? "Foco" : "Pausa"}: faltam ${formatCountdown(remaining)}. Abrir painel`}
      >
        <FocusRing ratio={ratio} size={18} stroke={3} />
        {formatCountdown(remaining)}
      </button>
    );
  }

  const stop = () =>
    startTransition(async () => {
      if (focus.phase === "focus") await stopWorkSessionAction();
      setFocusState(null);
    });

  return (
    <div className={`focus-panel focus-panel--${focus.phase}`} role="dialog" aria-label="Modo foco">
      <div className="focus-panel-head">
        <span className="focus-panel-phase">{focus.phase === "focus" ? `Foco · ${focus.minutes} min` : `Pausa · ${focus.breakMinutes} min`}</span>
        <button
          type="button"
          className="focus-panel-min"
          onClick={() => setFocusState({ ...focus, minimized: true })}
          aria-label="Minimizar painel de foco"
          title="Minimizar"
        >
          –
        </button>
      </div>
      <div className="focus-panel-body">
        <div className="focus-panel-ring">
          <FocusRing ratio={ratio} size={88} stroke={6} />
          <strong>{formatCountdown(remaining)}</strong>
        </div>
        <p className="focus-panel-task" title={focus.taskTitle}>
          {focus.phase === "focus" ? focus.taskTitle : "Levante, beba água, olhe para longe."}
        </p>
      </div>
      <div className="focus-panel-actions">
        {focus.phase === "focus" ? (
          <button
            type="button"
            className="button-secondary compact"
            onClick={() => setFocusState({ ...focus, endsAt: focus.endsAt + 5 * 60_000 })}
          >
            +5 min
          </button>
        ) : (
          <button
            type="button"
            className="button compact"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                await startFocus({ id: focus.taskId, title: focus.taskTitle }, focus.minutes);
              })
            }
          >
            Pular pausa
          </button>
        )}
        <button type="button" className="button-ghost compact" onClick={stop} disabled={isPending}>
          {focus.phase === "focus" ? "Encerrar foco" : "Encerrar"}
        </button>
      </div>
    </div>
  );
}
