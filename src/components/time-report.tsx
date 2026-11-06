"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { deleteWorkSessionAction, updateWorkSessionDurationAction } from "@/server/actions";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { ChevronLeftIcon, ChevronRightIcon, DownloadIcon } from "@/components/icons";
import { formatDuration } from "@/lib/format";
import type { Project, TimePeriod } from "@/domain/types";
import type { TimeInsightSession, TimeInsights, TimeShare } from "@/server/time-insights";

export type TimeGrouping = "project" | "task" | "tag";

type TimeReportViewProps = {
  projects: Project[];
  projectId?: string;
  grouping: TimeGrouping;
  insights: TimeInsights;
};

const PERIODS: Array<[TimePeriod, string]> = [
  ["day", "Dia"],
  ["week", "Semana"],
  ["month", "Mês"]
];

const GROUPINGS: Array<[TimeGrouping, string]> = [
  ["project", "Projetos"],
  ["task", "Tarefas"],
  ["tag", "Etiquetas"]
];

const CURRENT_LABEL: Record<TimePeriod, string> = { day: "Hoje", week: "Esta semana", month: "Este mês" };
const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const HEAT_STEPS = ["#1a2a42", "#184f95", "#256abf", "#3987e5", "#86b6ef"];

function compactDuration(seconds: number) {
  if (seconds <= 0) return "0";
  const hours = seconds / 3600;
  if (hours >= 1) return `${hours >= 10 ? Math.round(hours) : hours.toFixed(1).replace(".", ",")}h`;
  return `${Math.max(1, Math.round(seconds / 60))}min`;
}

function percentLabel(value: number) {
  if (value > 0 && value < 0.01) return "<1%";
  return `${Math.round(value * 100)}%`;
}

function dayHeading(day: string, today: string) {
  const date = new Date(`${day}T12:00:00Z`);
  const todayDate = new Date(`${today}T12:00:00Z`);
  const diff = Math.round((todayDate.getTime() - date.getTime()) / 86400000);
  if (diff === 0) return "Hoje";
  if (diff === 1) return "Ontem";
  const label = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "short",
    timeZone: "UTC"
  }).format(date);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function niceAxisMax(seconds: number, unit: "hour" | "day") {
  const stepSeconds = unit === "hour" ? 15 * 60 : 3600;
  const steps = Math.max(1, Math.ceil(seconds / stepSeconds));
  const niceSteps = steps <= 2 ? 2 : steps <= 4 ? 4 : Math.ceil(steps / 2) * 2;
  return niceSteps * stepSeconds;
}

export function TimeReportView({ projects, projectId, grouping, insights }: TimeReportViewProps) {
  const router = useRouter();
  const { period, offset } = insights;

  const buildHref = (next: Partial<{ projectId: string; period: TimePeriod; offset: number; group: TimeGrouping }>) => {
    const params = new URLSearchParams();
    const nextProject = next.projectId ?? projectId ?? "";
    const nextPeriod = next.period ?? period;
    const nextOffset = next.offset ?? (next.period && next.period !== period ? 0 : offset);
    const nextGroup = next.group ?? grouping;
    if (nextProject) params.set("projectId", nextProject);
    if (nextPeriod !== "week") params.set("period", nextPeriod);
    if (nextOffset) params.set("offset", String(nextOffset));
    if (nextGroup !== "project") params.set("group", nextGroup);
    const query = params.toString();
    return query ? `/app/tempo?${query}` : "/app/tempo";
  };

  const go = (next: Parameters<typeof buildHref>[0]) => router.push(buildHref(next) as never, { scroll: false });

  const exportParams = new URLSearchParams();
  exportParams.set("period", period);
  if (offset) exportParams.set("offset", String(offset));
  if (projectId) exportParams.set("projectId", projectId);

  return (
    <div className="tempo">
      <header className="tempo-header">
        <div className="tempo-title">
          <h1>Tempo</h1>
          <p>{insights.rangeLabel}</p>
        </div>

        <div className="tempo-controls">
          <div className="period-toggle" role="group" aria-label="Período">
            {PERIODS.map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`period-btn ${period === value ? "active" : ""}`}
                aria-pressed={period === value}
                onClick={() => go({ period: value, offset: 0 })}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="tempo-nav" role="group" aria-label="Navegar entre períodos">
            <button type="button" className="tempo-nav-btn" aria-label="Período anterior" onClick={() => go({ offset: offset - 1 })}>
              <ChevronLeftIcon />
            </button>
            <button
              type="button"
              className="tempo-nav-current"
              disabled={insights.isCurrent}
              onClick={() => go({ offset: 0 })}
            >
              {CURRENT_LABEL[period]}
            </button>
            <button
              type="button"
              className="tempo-nav-btn"
              aria-label="Próximo período"
              disabled={insights.isCurrent}
              onClick={() => go({ offset: offset + 1 })}
            >
              <ChevronRightIcon />
            </button>
          </div>

          <select
            className="filter-select native"
            aria-label="Filtrar por projeto"
            value={projectId || ""}
            onChange={(event) => go({ projectId: event.target.value })}
          >
            <option value="">Todos os projetos</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>

          <a className="button-secondary compact tempo-export" href={`/app/tempo/export?${exportParams.toString()}`} download>
            <DownloadIcon />
            <span>CSV</span>
          </a>
        </div>
      </header>

      <StatTiles insights={insights} />

      {insights.insights.length ? (
        <section className="tempo-card tempo-insights" aria-label="Insights do período">
          <h2>Leitura do período</h2>
          <ul>
            {insights.insights.map((text) => (
              <li key={text}>{text}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <TimelineChart insights={insights} />

      <div className="tempo-grid">
        <DistributionCard insights={insights} grouping={grouping} onGroup={(group) => go({ group })} />
        <Heatmap insights={insights} />
      </div>

      <EstimatesCard insights={insights} />

      <SessionsList sessions={insights.sessions} today={insights.today} />
    </div>
  );
}

function getWorkWindow(sessions: TimeInsightSession[]) {
  if (!sessions.length) return null;
  const starts = sessions.map((session) => new Date(session.startedAt).getTime());
  // Sessão aberta: usa a duração calculada no servidor (evita divergência de hidratação).
  const ends = sessions.map((session) =>
    session.endedAt ? new Date(session.endedAt).getTime() : new Date(session.startedAt).getTime() + session.durationSeconds * 1000
  );
  const first = sessions[starts.indexOf(Math.min(...starts))];
  const lastIndex = ends.indexOf(Math.max(...ends));
  const last = sessions[lastIndex];
  return {
    start: first.startTime,
    end: last.endTime ?? "agora",
    spanSeconds: Math.max(0, Math.round((Math.max(...ends) - Math.min(...starts)) / 1000))
  };
}

function StatTiles({ insights }: { insights: TimeInsights }) {
  const workWindow = insights.period === "day" ? getWorkWindow(insights.sessions) : null;
  const delta = insights.deltaRatio;
  const deltaText =
    delta === null
      ? insights.totalSeconds > 0
        ? "sem registro no período anterior"
        : "sem dados para comparar"
      : `${delta >= 0 ? "↑" : "↓"} ${percentLabel(Math.abs(delta))} vs. ${insights.isCurrent ? "mesmo ponto anterior" : "período anterior"}`;

  return (
    <section className="tempo-stats" aria-label="Indicadores do período">
      <div className="tempo-stat primary">
        <span className="tempo-stat-label">Total</span>
        <strong className="tempo-stat-value">{formatDuration(insights.totalSeconds)}</strong>
        <span className={`tempo-stat-detail ${delta !== null && Math.abs(delta) >= 0.05 ? (delta > 0 ? "up" : "down") : ""}`}>
          {deltaText}
        </span>
      </div>
      {insights.period === "day" ? (
        <div className="tempo-stat">
          <span className="tempo-stat-label">Janela de trabalho</span>
          <strong className="tempo-stat-value">{workWindow ? `${workWindow.start}–${workWindow.end}` : "—"}</strong>
          <span className="tempo-stat-detail">
            {workWindow ? `${formatDuration(workWindow.spanSeconds - insights.totalSeconds)} de intervalos` : "sem sessões hoje"}
          </span>
        </div>
      ) : (
        <div className="tempo-stat">
          <span className="tempo-stat-label">Média por dia ativo</span>
          <strong className="tempo-stat-value">{formatDuration(insights.averagePerActiveDay)}</strong>
          <span className="tempo-stat-detail">
            {insights.activeDays} de {insights.elapsedDays} {insights.elapsedDays === 1 ? "dia" : "dias"} com registro
          </span>
        </div>
      )}
      <div className="tempo-stat">
        <span className="tempo-stat-label">Foco profundo</span>
        <strong className="tempo-stat-value">{percentLabel(insights.deepWorkShare)}</strong>
        <span className="tempo-stat-detail">{formatDuration(insights.deepWorkSeconds)} em blocos ≥ 25 min</span>
      </div>
      <div className="tempo-stat">
        <span className="tempo-stat-label">Sessões</span>
        <strong className="tempo-stat-value">{insights.sessionCount}</strong>
        <span className="tempo-stat-detail">
          {insights.sessionCount
            ? `média ${formatDuration(insights.averageSessionSeconds)} · maior ${formatDuration(insights.longestSession?.seconds ?? 0)}`
            : "nenhuma sessão"}
        </span>
      </div>
      <div className="tempo-stat">
        <span className="tempo-stat-label">Meta diária</span>
        <strong className="tempo-stat-value">
          {insights.period === "day"
            ? percentLabel(insights.focusGoalSeconds ? insights.totalSeconds / insights.focusGoalSeconds : 0)
            : `${insights.goalDaysHit} de ${insights.elapsedDays} dias`}
        </strong>
        <span className="tempo-stat-detail">
          meta {formatDuration(insights.focusGoalSeconds)} · sequência {insights.streakDays}{" "}
          {insights.streakDays === 1 ? "dia útil" : "dias úteis"}
        </span>
      </div>
    </section>
  );
}

function TimelineChart({ insights }: { insights: TimeInsights }) {
  const { buckets, unit, maxSeconds } = insights.timeline;
  const [hovered, setHovered] = useState<number | null>(null);
  const colorById = useMemo(() => new Map(insights.legend.map((item) => [item.id, item])), [insights.legend]);

  // Na visão Dia, recorta para a faixa de horas com atividade (mín. 8h–18h).
  const visible = useMemo(() => {
    if (unit !== "hour") return buckets;
    const active = buckets.map((bucket, index) => (bucket.totalSeconds > 0 || bucket.isCurrent ? index : -1)).filter((i) => i >= 0);
    const first = Math.min(8, ...active);
    const last = Math.max(18, ...active);
    return buckets.slice(first, last + 1);
  }, [buckets, unit]);

  const goalSeconds = unit === "day" ? insights.focusGoalSeconds : 0;
  const axisMax = niceAxisMax(Math.max(maxSeconds, goalSeconds), unit);
  const ticks = [axisMax, axisMax / 2, 0];
  const hoveredBucket = hovered !== null ? visible[hovered] : null;
  const dense = visible.length > 20;

  return (
    <section className="tempo-card" aria-labelledby="tempo-timeline-title">
      <div className="tempo-card-heading">
        <h2 id="tempo-timeline-title">{unit === "hour" ? "Ao longo do dia" : "Por dia"}</h2>
        {insights.legend.length > 1 ? (
          <ul className="tempo-legend" aria-label="Legenda de projetos">
            {insights.legend.slice(0, 8).map((item) => (
              <li key={item.id}>
                <span className="tempo-swatch" style={{ background: item.color }} aria-hidden="true" />
                {item.label}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {maxSeconds === 0 ? (
        <div className="tempo-empty">
          <strong>Nenhum tempo neste período.</strong>
          <span>Inicie o cronômetro em uma tarefa ou registre uma sessão manual pelo tempo da linha.</span>
        </div>
      ) : (
        <div className="tempo-timeline" onMouseLeave={() => setHovered(null)}>
          <div className="tempo-axis" aria-hidden="true">
            {ticks.map((tick) => (
              <span key={tick}>{compactDuration(tick)}</span>
            ))}
          </div>
          <div className={`tempo-bars${dense ? " dense" : ""}`} role="list">
            {goalSeconds > 0 ? (
              <span
                className="tempo-goal-line"
                style={{ top: `${200 - (goalSeconds / axisMax) * 200}px` }}
                aria-hidden="true"
              >
                <em>meta {compactDuration(goalSeconds)}</em>
              </span>
            ) : null}
            {visible.map((bucket, index) => {
              const height = (bucket.totalSeconds / axisMax) * 100;
              const showLabel = !dense || index % 2 === 0 || bucket.isCurrent;
              return (
                <div
                  key={bucket.key}
                  role="listitem"
                  tabIndex={0}
                  className={`tempo-bar${bucket.isCurrent ? " current" : ""}${bucket.isFuture ? " future" : ""}${hovered === index ? " hovered" : ""}`}
                  aria-label={`${bucket.longLabel}: ${formatDuration(bucket.totalSeconds)}`}
                  onMouseEnter={() => setHovered(index)}
                  onFocus={() => setHovered(index)}
                  onBlur={() => setHovered(null)}
                >
                  <div className="tempo-bar-plot">
                    <div className="tempo-bar-stack" style={{ height: `${height}%` }}>
                      {bucket.segments.map((segment) => (
                        <span
                          key={segment.projectId}
                          style={{
                            flexGrow: segment.seconds,
                            background: colorById.get(segment.projectId)?.color
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="tempo-bar-label">{showLabel ? bucket.label : ""}</span>
                </div>
              );
            })}
          </div>

          {hoveredBucket ? (
            <div
              className="tempo-tooltip"
              role="status"
              style={
                (hovered! + 0.5) / visible.length > 0.6
                  ? { left: `calc(36px + (100% - 36px) * ${hovered! / visible.length} - 8px)`, transform: "translateX(-100%)" }
                  : { left: `calc(36px + (100% - 36px) * ${(hovered! + 1) / visible.length} + 8px)` }
              }
            >
              <strong>{hoveredBucket.longLabel}</strong>
              <span className="tempo-tooltip-total">{formatDuration(hoveredBucket.totalSeconds)}</span>
              {hoveredBucket.segments.map((segment) => (
                <span key={segment.projectId} className="tempo-tooltip-row">
                  <span className="tempo-swatch" style={{ background: colorById.get(segment.projectId)?.color }} />
                  <span>{colorById.get(segment.projectId)?.label}</span>
                  <em>{formatDuration(segment.seconds)}</em>
                </span>
              ))}
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}

function DistributionCard({
  insights,
  grouping,
  onGroup
}: {
  insights: TimeInsights;
  grouping: TimeGrouping;
  onGroup: (group: TimeGrouping) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const rows: TimeShare[] = grouping === "project" ? insights.projects : grouping === "task" ? insights.tasks : insights.tags;
  const visibleRows = expanded ? rows : rows.slice(0, 8);
  const max = Math.max(1, ...rows.map((row) => row.seconds));

  return (
    <section className="tempo-card" aria-labelledby="tempo-distribution-title">
      <div className="tempo-card-heading">
        <h2 id="tempo-distribution-title">Distribuição</h2>
        <div className="period-toggle small" role="group" aria-label="Agrupar por">
          {GROUPINGS.map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`period-btn ${grouping === value ? "active" : ""}`}
              aria-pressed={grouping === value}
              onClick={() => onGroup(value)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {rows.length ? (
        <>
          <ul className="tempo-shares">
            {visibleRows.map((row) => (
              <li key={row.id} className="tempo-share">
                <div className="tempo-share-text">
                  <span className="tempo-share-label" title={row.label}>
                    {row.label}
                    {row.detail ? <em>{row.detail}</em> : null}
                  </span>
                  <span className="tempo-share-value">
                    {formatDuration(row.seconds)}
                    <em>{percentLabel(row.share)}</em>
                  </span>
                </div>
                <div className="tempo-share-track" aria-hidden="true">
                  <span style={{ width: `${Math.max(1.5, (row.seconds / max) * 100)}%`, background: row.color }} />
                </div>
              </li>
            ))}
          </ul>
          {rows.length > 8 ? (
            <button type="button" className="button-ghost compact tempo-more" onClick={() => setExpanded((value) => !value)}>
              {expanded ? "Mostrar menos" : `Mostrar todas (${rows.length})`}
            </button>
          ) : null}
          {grouping === "tag" ? (
            <p className="tempo-footnote">Tarefas com várias etiquetas contam em cada uma; os percentuais podem somar mais de 100%.</p>
          ) : null}
        </>
      ) : (
        <p className="muted tempo-empty-inline">Sem dados para agrupar neste período.</p>
      )}
    </section>
  );
}

function Heatmap({ insights }: { insights: TimeInsights }) {
  const { cells, maxSeconds, days } = insights.heatmap;
  const [focus, setFocus] = useState<{ dow: number; hour: number } | null>(null);
  const firstHour = Math.min(7, ...cells.flatMap((row) => row.map((value, hour) => (value > 0 ? hour : 24))));
  const lastHour = Math.max(20, ...cells.flatMap((row) => row.map((value, hour) => (value > 0 ? hour : -1))));
  const hours = Array.from({ length: lastHour - firstHour + 1 }, (_, index) => firstHour + index);

  const step = (value: number) => {
    if (value <= 0 || maxSeconds <= 0) return null;
    const ratio = value / maxSeconds;
    return HEAT_STEPS[Math.min(HEAT_STEPS.length - 1, Math.floor(ratio * HEAT_STEPS.length))];
  };

  const focusValue = focus ? cells[focus.dow][focus.hour] : 0;

  return (
    <section className="tempo-card" aria-labelledby="tempo-heatmap-title">
      <div className="tempo-card-heading">
        <h2 id="tempo-heatmap-title">Seus horários</h2>
        <span className="tempo-card-meta">
          {focus
            ? `${WEEKDAYS[focus.dow]} ${focus.hour}h–${focus.hour + 1}h · ${formatDuration(focusValue)}`
            : `últimas ${days / 7} semanas`}
        </span>
      </div>
      {maxSeconds === 0 ? (
        <p className="muted tempo-empty-inline">Registre algumas sessões para ver em que horários você mais trabalha.</p>
      ) : (
        <div className="tempo-heatmap" style={{ ["--heat-cols" as string]: hours.length }} onMouseLeave={() => setFocus(null)}>
          <span />
          {hours.map((hour) => (
            <span key={hour} className="tempo-heat-hour">
              {hour % 3 === 0 ? `${hour}h` : ""}
            </span>
          ))}
          {cells.map((row, dow) => (
            <div key={dow} className="tempo-heat-row" role="row">
              <span className="tempo-heat-day">{WEEKDAYS[dow]}</span>
              {hours.map((hour) => {
                const color = step(row[hour]);
                return (
                  <span
                    key={hour}
                    role="gridcell"
                    className="tempo-heat-cell"
                    style={color ? { background: color } : undefined}
                    title={`${WEEKDAYS[dow]} ${hour}h: ${formatDuration(row[hour])}`}
                    onMouseEnter={() => setFocus({ dow, hour })}
                  />
                );
              })}
            </div>
          ))}
          <div className="tempo-heat-scale" aria-hidden="true">
            <span>menos</span>
            <i className="tempo-heat-cell" />
            {HEAT_STEPS.map((color) => (
              <i key={color} className="tempo-heat-cell" style={{ background: color }} />
            ))}
            <span>mais</span>
          </div>
        </div>
      )}
    </section>
  );
}

function EstimatesCard({ insights }: { insights: TimeInsights }) {
  const rows = insights.estimates;
  if (!rows.length) {
    return (
      <section className="tempo-card tempo-card--hint" aria-labelledby="tempo-estimates-title">
        <div className="tempo-card-heading">
          <h2 id="tempo-estimates-title">Estimado × realizado</h2>
        </div>
        <p className="muted tempo-empty-inline">
          Nenhuma tarefa deste período tem estimativa. Edite uma tarefa e preencha “Estimativa” (ex.: 1h30) para comparar com o tempo real.
        </p>
      </section>
    );
  }

  const totalEstimate = rows.reduce((sum, row) => sum + row.estimateSeconds, 0);
  const totalTracked = rows.reduce((sum, row) => sum + row.trackedSeconds, 0);

  return (
    <section className="tempo-card" aria-labelledby="tempo-estimates-title">
      <div className="tempo-card-heading">
        <h2 id="tempo-estimates-title">Estimado × realizado</h2>
        <span className="tempo-card-meta">
          {formatDuration(totalTracked)} de {formatDuration(totalEstimate)} estimadas · tempo total das tarefas
        </span>
      </div>
      <ul className="tempo-estimates">
        {rows.slice(0, 10).map((row) => {
          const ratio = row.estimateSeconds ? row.trackedSeconds / row.estimateSeconds : 0;
          const scale = Math.max(1, ratio);
          const over = ratio > 1;
          return (
            <li key={row.taskId} className={`tempo-estimate${over ? " over" : ""}`}>
              <div className="tempo-share-text">
                <span className="tempo-share-label" title={row.taskTitle}>
                  {row.taskTitle}
                  <em>
                    {row.projectName}
                    {row.status === "done" ? " · concluída" : ""}
                  </em>
                </span>
                <span className="tempo-share-value">
                  {formatDuration(row.trackedSeconds)} / {formatDuration(row.estimateSeconds)}
                  <em>{percentLabel(ratio)}</em>
                </span>
              </div>
              <div className="tempo-estimate-track" aria-hidden="true">
                <span className="tempo-estimate-fill" style={{ width: `${(Math.min(ratio, 1) / scale) * 100}%`, background: row.color }} />
                {over ? (
                  <span className="tempo-estimate-over" style={{ width: `${((ratio - 1) / scale) * 100}%` }} />
                ) : null}
                <span className="tempo-estimate-mark" style={{ left: `${(1 / scale) * 100}%` }} />
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function SessionsList({ sessions, today }: { sessions: TimeInsightSession[]; today: string }) {
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState<{ id: string; date: string; startTime: string; hours: string; minutes: string } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<TimeInsightSession | null>(null);

  const groups = useMemo(() => {
    const map = new Map<string, { day: string; total: number; items: TimeInsightSession[] }>();
    for (const session of sessions) {
      const group = map.get(session.day) || { day: session.day, total: 0, items: [] };
      group.total += session.durationSeconds;
      group.items.push(session);
      map.set(session.day, group);
    }
    return [...map.values()];
  }, [sessions]);

  const save = () => {
    if (!editing) return;
    startTransition(async () => {
      const formData = new FormData();
      formData.append("sessionId", editing.id);
      formData.append("date", editing.date);
      formData.append("startTime", editing.startTime);
      formData.append("hours", editing.hours);
      formData.append("minutes", editing.minutes);
      await updateWorkSessionDurationAction(formData);
      setEditing(null);
    });
  };

  const remove = (sessionId: string) => {
    startTransition(async () => {
      const formData = new FormData();
      formData.append("sessionId", sessionId);
      await deleteWorkSessionAction(formData);
      setPendingDelete(null);
    });
  };

  return (
    <section className="tempo-card" aria-labelledby="tempo-sessions-title">
      <div className="tempo-card-heading">
        <h2 id="tempo-sessions-title">Sessões</h2>
        <span className="tempo-card-meta">{sessions.length} no período</span>
      </div>

      {groups.length ? (
        <div className="tempo-days">
          {groups.map((group) => (
            <div key={group.day} className="tempo-day">
              <div className="tempo-day-heading">
                <strong>{dayHeading(group.day, today)}</strong>
                <span>{formatDuration(group.total)}</span>
              </div>
              {group.items.map((session) => {
                const isEditing = editing?.id === session.id;
                return (
                  <div key={session.id} className={`tempo-session${session.endedAt ? "" : " running"}`}>
                    <span className="tempo-swatch" style={{ background: session.projectColor }} aria-hidden="true" />
                    <span className="tempo-session-main">
                      <span className="tempo-session-title">{session.taskTitle}</span>
                      <em>
                        {session.projectName}
                        {session.source === "manual" ? " · manual" : ""}
                      </em>
                    </span>
                    {isEditing ? (
                      <div className="tempo-session-edit">
                        <input
                          type="date"
                          aria-label="Data"
                          value={editing.date}
                          onChange={(event) => setEditing({ ...editing, date: event.target.value })}
                        />
                        <input
                          type="time"
                          aria-label="Início"
                          value={editing.startTime}
                          onChange={(event) => setEditing({ ...editing, startTime: event.target.value })}
                        />
                        <input
                          type="number"
                          min="0"
                          max="24"
                          aria-label="Horas"
                          value={editing.hours}
                          onChange={(event) => setEditing({ ...editing, hours: event.target.value })}
                        />
                        <span className="tempo-unit">h</span>
                        <input
                          type="number"
                          min="0"
                          max="59"
                          aria-label="Minutos"
                          value={editing.minutes}
                          onChange={(event) => setEditing({ ...editing, minutes: event.target.value })}
                        />
                        <span className="tempo-unit">min</span>
                        <button type="button" className="button compact" onClick={save} disabled={isPending}>
                          Salvar
                        </button>
                        <button type="button" className="button-ghost compact" onClick={() => setEditing(null)}>
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="tempo-session-range">
                          {session.startTime}–{session.endTime ?? "agora"}
                        </span>
                        <strong className="tempo-session-duration">{formatDuration(session.durationSeconds)}</strong>
                        <span className="tempo-session-actions">
                          {session.endedAt ? (
                            <button
                              type="button"
                              className="button-ghost compact"
                              disabled={isPending}
                              onClick={() =>
                                setEditing({
                                  id: session.id,
                                  date: session.day,
                                  startTime: session.startTime,
                                  hours: String(Math.floor(session.durationSeconds / 3600)),
                                  minutes: String(Math.floor((session.durationSeconds % 3600) / 60))
                                })
                              }
                            >
                              Editar
                            </button>
                          ) : (
                            <span className="tempo-live">em andamento</span>
                          )}
                          <button
                            type="button"
                            className="button-ghost compact danger"
                            disabled={isPending}
                            onClick={() => setPendingDelete(session)}
                          >
                            Excluir
                          </button>
                        </span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      ) : (
        <p className="muted tempo-empty-inline">Nenhuma sessão neste período.</p>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Excluir sessão?"
        description={
          pendingDelete
            ? `A sessão de ${formatDuration(pendingDelete.durationSeconds)} em “${pendingDelete.taskTitle}” será removida permanentemente.`
            : ""
        }
        onConfirm={() => pendingDelete && remove(pendingDelete.id)}
        onCancel={() => setPendingDelete(null)}
      />
    </section>
  );
}
