"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteWorkSessionAction, updateWorkSessionDurationAction } from "@/server/actions";
import { formatDuration } from "@/lib/format";
import type { Project, TimePeriod, WorkSession } from "@/domain/types";

type TimeGrouping = "project" | "task";

type TimeReportViewProps = {
  projects: Project[];
  projectId?: string;
  period: TimePeriod;
  grouping: TimeGrouping;
  totalSeconds: number;
  byProject: Array<{ projectId: string; projectName: string; durationSeconds: number }>;
  byTask: Array<{ taskId: string; taskTitle: string; projectName: string; durationSeconds: number }>;
  sessions: WorkSession[];
};

export function TimeReportView({
  projects,
  projectId,
  period,
  grouping,
  totalSeconds,
  byProject,
  byTask,
  sessions
}: TimeReportViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hours, setHours] = useState("0");
  const [minutes, setMinutes] = useState("30");

  const chartRows =
    grouping === "project"
      ? byProject.map((row) => ({
          id: row.projectId,
          label: row.projectName,
          detail: "",
          durationSeconds: row.durationSeconds
        }))
      : byTask.map((row) => ({
          id: row.taskId,
          label: row.taskTitle,
          detail: row.projectName,
          durationSeconds: row.durationSeconds
        }));
  const chartMaximum = Math.max(...chartRows.map((row) => row.durationSeconds), 1);

  const push = (nextProject: string, nextPeriod: string, nextGrouping = grouping) => {
    const params = new URLSearchParams();
    if (nextProject) params.set("projectId", nextProject);
    if (nextPeriod && nextPeriod !== "week") params.set("period", nextPeriod);
    if (nextGrouping && nextGrouping !== "project") params.set("group", nextGrouping);
    const query = params.toString();
    router.push((query ? `/app/tempo?${query}` : "/app/tempo") as any);
  };

  const saveDuration = (sessionId: string) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("sessionId", sessionId);
      formData.append("hours", hours);
      formData.append("minutes", minutes);
      await updateWorkSessionDurationAction(formData);
      setEditingId(null);
    });
  };

  const remove = (sessionId: string) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("sessionId", sessionId);
      await deleteWorkSessionAction(formData);
    });
  };

  return (
    <div className="time-report">
      <div className="filter-bar">
        <select
          className="filter-select native"
          aria-label="Filtrar por projeto"
          value={projectId || ""}
          onChange={(event) => push(event.target.value, period)}
        >
          <option value="">Todos os projetos</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>

        <div className="period-toggle" role="group" aria-label="Período">
          {([
            ["day", "Dia"],
            ["week", "Semana"],
            ["month", "Mês"]
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`period-btn ${period === value ? "active" : ""}`}
              onClick={() => push(projectId || "", value)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="period-toggle" role="group" aria-label="Agrupar gráfico">
          {([
            ["project", "Por projeto"],
            ["task", "Por tarefa"]
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`period-btn ${grouping === value ? "active" : ""}`}
              onClick={() => push(projectId || "", period, value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="metrics-strip" aria-label="Total do período">
        <div className="metric-pill">
          <span className="metric-pill-label">Total</span>
          <strong className="metric-pill-value">{formatDuration(totalSeconds)}</strong>
        </div>
        <div className="metric-pill">
          <span className="metric-pill-label">Tarefas</span>
          <strong className="metric-pill-value">{byTask.length}</strong>
        </div>
        <div className="metric-pill">
          <span className="metric-pill-label">Sessões</span>
          <strong className="metric-pill-value">{sessions.length}</strong>
        </div>
      </div>

      <section className="time-section time-chart-section">
        <div className="time-section-heading">
          <h2>Distribuição do tempo</h2>
          <span>{grouping === "project" ? "Projetos" : "Tarefas"}</span>
        </div>
        {chartRows.length ? (
          <div
            className="time-bars"
            role="img"
            aria-label={`Gráfico de tempo ${grouping === "project" ? "por projeto" : "por tarefa"}`}
          >
            {chartRows.map((row) => {
              const percentage = Math.max(6, (row.durationSeconds / chartMaximum) * 100);
              return (
                <div className="time-bar-col" key={row.id} title={`${row.label}${row.detail ? ` · ${row.detail}` : ""}`}>
                  <strong>{formatDuration(row.durationSeconds)}</strong>
                  <div className="time-bar-track">
                    <span className="time-bar-fill" style={{ height: `${percentage}%` }} />
                  </div>
                  <span className="time-bar-label">{row.label}</span>
                  {row.detail ? <em className="time-bar-detail">{row.detail}</em> : null}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="time-chart-empty">
            <strong>Nenhum tempo neste período.</strong>
            <span>Inicie um cronômetro em uma tarefa ou registre uma sessão manual.</span>
          </div>
        )}
      </section>

      <section className="time-section">
        <h2>Sessões</h2>
        {sessions.length ? (
          <div className="time-table sessions">
            {sessions.map((session) => {
              const started = new Date(session.startedAt);
              const hoursValue = Math.floor(session.durationSeconds / 3600);
              const minutesValue = Math.floor((session.durationSeconds % 3600) / 60);
              return (
                <div className="time-row session-row" key={session.id}>
                  <span>
                    {session.taskTitle}
                    <em>
                      {session.projectName} · {started.toLocaleString("pt-BR")}
                      {session.endedAt ? "" : " · em andamento"}
                    </em>
                  </span>
                  {editingId === session.id ? (
                    <div className="session-edit">
                      <input
                        type="number"
                        min="0"
                        value={hours}
                        onChange={(event) => setHours(event.target.value)}
                        aria-label="Horas"
                      />
                      <input
                        type="number"
                        min="0"
                        max="59"
                        value={minutes}
                        onChange={(event) => setMinutes(event.target.value)}
                        aria-label="Minutos"
                      />
                      <button type="button" className="button compact" onClick={() => saveDuration(session.id)}>
                        Salvar
                      </button>
                    </div>
                  ) : (
                    <div className="session-actions">
                      <strong>{formatDuration(session.durationSeconds)}</strong>
                      {session.endedAt ? (
                        <button
                          type="button"
                          className="button-ghost compact"
                          disabled={isPending}
                          onClick={() => {
                            setEditingId(session.id);
                            setHours(String(hoursValue));
                            setMinutes(String(Math.max(1, minutesValue)));
                          }}
                        >
                          Editar
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="button-ghost compact"
                        disabled={isPending}
                        onClick={() => remove(session.id)}
                      >
                        Excluir
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="muted">Nenhuma sessão neste período.</p>
        )}
      </section>
    </div>
  );
}
