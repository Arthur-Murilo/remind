"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  closeDayAction,
  patchTaskAction,
  rescheduleTasksAction,
  saveDayIntentionAction,
  setTaskEstimateAction
} from "@/server/actions";
import { FocusRing } from "@/components/focus-goal";
import { startFocus } from "@/components/focus-mode";
import { formatDate, formatDuration, formatEstimate, parseEstimateMinutes } from "@/lib/format";
import type { DayLoad, DayRitual, RitualTask } from "@/server/daily-ritual";

type Mode = "planejar" | "encerrar";

function formatDayTitle(iso: string) {
  const label = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }).format(
    new Date(`${iso}T12:00:00Z`)
  );
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function LoadBar({ load }: { load: DayLoad }) {
  const scale = Math.max(load.goalSeconds, load.projectedSeconds, 1);
  // Em minutos cheios, para "X previstas, meta Y, Z de folga" fechar a conta na tela.
  const over = Math.floor(load.projectedSeconds / 60) * 60 - load.goalSeconds;
  const status =
    load.plannedCount === 0
      ? "Nenhuma tarefa na pauta de hoje."
      : over > 0
        ? `${formatDuration(over)} acima da meta: considere adiar algo para amanhã.`
        : `Cabe na meta, com ${formatDuration(-over)} de folga.`;

  return (
    <div className="load">
      <div className="load-numbers">
        <strong>{formatDuration(load.projectedSeconds)}</strong>
        <span>
          previstas para hoje · meta {formatDuration(load.goalSeconds)}
        </span>
      </div>
      <div
        className="load-track"
        role="img"
        aria-label={`Já registrado ${formatDuration(load.trackedTodaySeconds)}, restante estimado ${formatDuration(load.remainingEstimateSeconds)}, meta ${formatDuration(load.goalSeconds)}`}
      >
        <span className="load-done" style={{ width: `${(load.trackedTodaySeconds / scale) * 100}%` }} />
        <span
          className={`load-planned${over > 0 ? " over" : ""}`}
          style={{ width: `${(load.remainingEstimateSeconds / scale) * 100}%` }}
        />
        <span className="load-goal" style={{ left: `${(load.goalSeconds / scale) * 100}%` }} />
      </div>
      <ul className="load-legend">
        <li>
          <i className="load-done" /> registrado {formatDuration(load.trackedTodaySeconds)}
        </li>
        <li>
          <i className="load-planned" /> restante estimado {formatDuration(load.remainingEstimateSeconds)}
        </li>
        <li>
          <i className="load-goal-swatch" /> meta
        </li>
      </ul>
      <p className={`load-status${over > 0 && load.plannedCount ? " over" : ""}`}>
        {status}
        {load.withoutEstimateCount > 0
          ? ` ${load.withoutEstimateCount} ${load.withoutEstimateCount === 1 ? "tarefa sem estimativa" : "tarefas sem estimativa"} não entra${load.withoutEstimateCount === 1 ? "" : "m"} na conta.`
          : ""}
      </p>
    </div>
  );
}

function EstimateInput({ task }: { task: RitualTask }) {
  const [value, setValue] = useState(formatEstimate(task.estimateMinutes));
  const [isPending, startTransition] = useTransition();
  const save = () => {
    if (value === formatEstimate(task.estimateMinutes)) return;
    if (value.trim() && parseEstimateMinutes(value) === null) {
      setValue(formatEstimate(task.estimateMinutes)); // inválido: volta ao valor salvo
      return;
    }
    startTransition(async () => {
      const formData = new FormData();
      formData.set("taskId", task.id);
      formData.set("estimate", value);
      await setTaskEstimateAction(formData);
    });
  };
  return (
    <input
      className="ritual-estimate"
      value={value}
      placeholder="est."
      aria-label={`Estimativa de ${task.title}`}
      disabled={isPending}
      onChange={(event) => setValue(event.target.value)}
      onBlur={save}
      onKeyDown={(event) => {
        if (event.key === "Enter") (event.target as HTMLInputElement).blur();
      }}
    />
  );
}

function TaskLine({ task, today, children }: { task: RitualTask; today: string; children?: React.ReactNode }) {
  const overdue = task.dueDate && task.dueDate < today;
  return (
    <li className="ritual-task">
      <span className="project-dot" style={{ background: task.projectColor }} aria-hidden="true" />
      <span className="ritual-task-main">
        <span className="ritual-task-title">{task.title}</span>
        <em>
          {task.projectName}
          {task.dueDate ? (
            <span className={overdue ? "due-overdue" : ""}> · {overdue ? `atrasada (${formatDate(task.dueDate)})` : task.dueDate === today ? "hoje" : formatDate(task.dueDate)}</span>
          ) : null}
        </em>
      </span>
      {children}
    </li>
  );
}

export function DayRitualView({ ritual, mode }: { ritual: DayRitual; mode: Mode }) {
  return (
    <div className="ritual">
      <header className="ritual-header">
        <div>
          <h1>{mode === "planejar" ? "Planejar o dia" : "Encerrar o dia"}</h1>
          <p>{formatDayTitle(ritual.today)}</p>
        </div>
        <nav className="period-toggle" aria-label="Etapa do ritual">
          <Link className={`period-btn${mode === "planejar" ? " active" : ""}`} href={"/app/dia?modo=planejar" as never} aria-current={mode === "planejar" ? "page" : undefined}>
            Planejar
          </Link>
          <Link className={`period-btn${mode === "encerrar" ? " active" : ""}`} href={"/app/dia?modo=encerrar" as never} aria-current={mode === "encerrar" ? "page" : undefined}>
            Encerrar
          </Link>
        </nav>
      </header>
      {mode === "planejar" ? <PlanView ritual={ritual} /> : <CloseView ritual={ritual} />}
    </div>
  );
}

function PlanView({ ritual }: { ritual: DayRitual }) {
  const [intention, setIntention] = useState(ritual.note.intention);
  const [isPending, startTransition] = useTransition();

  const reschedule = (taskIds: string[], dueDate: string) =>
    startTransition(async () => {
      const formData = new FormData();
      formData.set("dueDate", dueDate);
      taskIds.forEach((id) => formData.append("taskId", id));
      await rescheduleTasksAction(formData);
    });

  const complete = (taskId: string) =>
    startTransition(async () => {
      const formData = new FormData();
      formData.set("taskId", taskId);
      formData.set("field", "status");
      formData.set("value", "done");
      await patchTaskAction(formData);
    });

  return (
    <>
      <section className="tempo-card">
        <div className="tempo-card-heading">
          <h2>Carga do dia</h2>
          {ritual.note.plannedAt ? <span className="tempo-card-meta">dia planejado</span> : null}
        </div>
        <LoadBar load={ritual.load} />
      </section>

      <section className="tempo-card">
        <div className="tempo-card-heading">
          <h2>Pauta de hoje</h2>
          <span className="tempo-card-meta">
            {ritual.agenda.length} {ritual.agenda.length === 1 ? "tarefa" : "tarefas"} · estimativa editável (1h30, 45min)
          </span>
        </div>
        {ritual.agenda.length ? (
          <ul className="ritual-list">
            {ritual.agenda.map((task) => (
              <TaskLine key={task.id} task={task} today={ritual.today}>
                <span className="ritual-tracked" title="Tempo já registrado na tarefa">
                  {task.trackedTotalSeconds ? formatDuration(task.trackedTotalSeconds) : ""}
                </span>
                <EstimateInput task={task} />
                <span className="ritual-actions">
                  <button
                    type="button"
                    className="button-ghost compact"
                    disabled={isPending}
                    onClick={() => startTransition(async () => startFocus({ id: task.id, title: task.title }, 25))}
                  >
                    Foco
                  </button>
                  <button type="button" className="button-ghost compact" disabled={isPending} onClick={() => complete(task.id)}>
                    Concluir
                  </button>
                  <button
                    type="button"
                    className="button-ghost compact"
                    disabled={isPending}
                    onClick={() => reschedule([task.id], ritual.tomorrow)}
                  >
                    Amanhã
                  </button>
                </span>
              </TaskLine>
            ))}
          </ul>
        ) : (
          <p className="muted tempo-empty-inline">Nada vence hoje. Puxe algo das sugestões abaixo.</p>
        )}
      </section>

      {ritual.suggestions.length ? (
        <section className="tempo-card">
          <div className="tempo-card-heading">
            <h2>Puxar para hoje</h2>
            <span className="tempo-card-meta">sem prazo ou vencendo nos próximos 7 dias</span>
          </div>
          <ul className="ritual-list">
            {ritual.suggestions.map((task) => (
              <TaskLine key={task.id} task={task} today={ritual.today}>
                <span className="ritual-tracked">{task.estimateMinutes ? formatEstimate(task.estimateMinutes) : ""}</span>
                <span className="ritual-actions">
                  <button
                    type="button"
                    className="button-secondary compact"
                    disabled={isPending}
                    onClick={() => reschedule([task.id], ritual.today)}
                  >
                    Hoje
                  </button>
                </span>
              </TaskLine>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="tempo-card">
        <form action={saveDayIntentionAction} className="ritual-intention">
          <label htmlFor="ritual-intention">
            <h2>Intenção do dia</h2>
            <span className="muted">Uma frase: o que faria o dia valer a pena?</span>
          </label>
          <input
            id="ritual-intention"
            name="intention"
            maxLength={280}
            value={intention}
            placeholder="Ex.: fechar a proposta do cliente antes do almoço"
            onChange={(event) => setIntention(event.target.value)}
          />
          <input type="hidden" name="markPlanned" value="1" />
          <div className="ritual-submit">
            <button type="submit" className="button">
              {ritual.note.plannedAt ? "Salvar e voltar ao Meu dia" : "Começar o dia"}
            </button>
          </div>
        </form>
      </section>
    </>
  );
}

function CloseView({ ritual }: { ritual: DayRitual }) {
  const initial = [0, 1, 2].map((index) => ritual.note.highlights[index] ?? "");
  const [highlights, setHighlights] = useState(initial);
  const [isPending, startTransition] = useTransition();
  const goalRatio = ritual.load.goalSeconds ? ritual.load.trackedTodaySeconds / ritual.load.goalSeconds : 0;
  const pending = ritual.agenda;

  const reschedule = (taskIds: string[]) =>
    startTransition(async () => {
      const formData = new FormData();
      formData.set("dueDate", ritual.tomorrow);
      taskIds.forEach((id) => formData.append("taskId", id));
      await rescheduleTasksAction(formData);
    });

  const compared = [...ritual.completed, ...ritual.workedOpen];

  return (
    <>
      <section className="ritual-summary">
        <div className="ritual-summary-goal">
          <FocusRing ratio={goalRatio} size={64} stroke={6} />
          <div>
            <strong>{formatDuration(ritual.load.trackedTodaySeconds)}</strong>
            <span>
              de {formatDuration(ritual.load.goalSeconds)} · {goalRatio >= 1 ? "meta batida" : `${Math.round(goalRatio * 100)}% da meta`}
            </span>
          </div>
        </div>
        <div className="ritual-summary-stat">
          <strong>{ritual.completed.length}</strong>
          <span>{ritual.completed.length === 1 ? "concluída hoje" : "concluídas hoje"}</span>
        </div>
        <div className="ritual-summary-stat">
          <strong>{pending.length}</strong>
          <span>{pending.length === 1 ? "pendente da pauta" : "pendentes da pauta"}</span>
        </div>
        {ritual.note.intention ? (
          <div className="ritual-summary-intention">
            <span>Intenção de hoje</span>
            <p>“{ritual.note.intention}”</p>
          </div>
        ) : null}
      </section>

      <section className="tempo-card">
        <div className="tempo-card-heading">
          <h2>Estimado × realizado hoje</h2>
          <span className="tempo-card-meta">tarefas concluídas ou trabalhadas hoje</span>
        </div>
        {compared.length ? (
          <ul className="ritual-list">
            {compared.map((task) => {
              const estimate = (task.estimateMinutes ?? 0) * 60;
              const ratio = estimate ? task.trackedTotalSeconds / estimate : null;
              return (
                <TaskLine key={task.id} task={task} today={ritual.today}>
                  <span className="ritual-tracked">hoje {formatDuration(task.trackedTodaySeconds)}</span>
                  <span className={`ritual-compare${ratio !== null && ratio > 1 ? " over" : ""}`}>
                    {estimate
                      ? `${formatDuration(task.trackedTotalSeconds)} / ${formatEstimate(task.estimateMinutes)} (${Math.round((ratio ?? 0) * 100)}%)`
                      : "sem estimativa"}
                  </span>
                  <span className={`ritual-badge${task.completedToday ? " done" : ""}`}>
                    {task.completedToday ? "concluída" : "em andamento"}
                  </span>
                </TaskLine>
              );
            })}
          </ul>
        ) : (
          <p className="muted tempo-empty-inline">Nenhuma tarefa concluída ou com tempo registrado hoje.</p>
        )}
      </section>

      <section className="tempo-card">
        <div className="tempo-card-heading">
          <h2>Ficou para depois</h2>
          {pending.length > 1 ? (
            <button
              type="button"
              className="button-secondary compact"
              disabled={isPending}
              onClick={() => reschedule(pending.map((task) => task.id))}
            >
              Mover todas para amanhã
            </button>
          ) : null}
        </div>
        {pending.length ? (
          <ul className="ritual-list">
            {pending.map((task) => (
              <TaskLine key={task.id} task={task} today={ritual.today}>
                <span className="ritual-actions">
                  <button type="button" className="button-ghost compact" disabled={isPending} onClick={() => reschedule([task.id])}>
                    Amanhã
                  </button>
                </span>
              </TaskLine>
            ))}
          </ul>
        ) : (
          <p className="muted tempo-empty-inline">Pauta zerada. Bom trabalho.</p>
        )}
      </section>

      <section className="tempo-card">
        <form
          className="ritual-highlights"
          action={(formData) =>
            startTransition(async () => {
              await closeDayAction(formData);
            })
          }
        >
          <div className="tempo-card-heading">
            <h2>Destaques do dia</h2>
            {ritual.note.closedAt ? (
              <span className="tempo-card-meta">
                encerrado às {ritual.note.closedTime}
              </span>
            ) : null}
          </div>
          <p className="muted ritual-hint">Até três coisas que deram certo ou que você aprendeu hoje.</p>
          {highlights.map((value, index) => (
            <input
              key={index}
              name="highlight"
              maxLength={200}
              value={value}
              aria-label={`Destaque ${index + 1}`}
              placeholder={["Ex.: entreguei o relatório", "Ex.: resolvi o bug do login", "Ex.: aprendi a estimar com folga"][index]}
              onChange={(event) =>
                setHighlights((current) => current.map((item, itemIndex) => (itemIndex === index ? event.target.value : item)))
              }
            />
          ))}
          <div className="ritual-submit">
            <button type="submit" className="button" disabled={isPending}>
              {ritual.note.closedAt ? "Atualizar destaques" : "Encerrar o dia"}
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
