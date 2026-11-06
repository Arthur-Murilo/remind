import { appTimeZone } from "@/lib/timezone";

/**
 * Fuso usado para "hoje"/"agora". No navegador vem de <html data-tz> (APP_TIMEZONE do
 * servidor), para não depender do fuso do aparelho: um navegador em UTC e um servidor em
 * São Paulo discordariam sobre o dia e sobre o horário digitado em sessões manuais.
 */
export function activeTimeZone() {
  if (typeof document !== "undefined") {
    const fromHtml = document.documentElement.dataset.tz;
    if (fromHtml) return fromHtml;
  }
  return appTimeZone();
}

/** Data (AAAA-MM-DD) e hora (HH:MM) de um instante no fuso do app. */
export function zonedDateTime(date = new Date(), timeZone = activeTimeZone()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23"
    })
      .formatToParts(date)
      .map((part) => [part.type, part.value])
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` };
}

export function todayIsoDate(date = new Date()) {
  return zonedDateTime(date).date;
}

export type DueDateTone = "today" | "overdue" | null;

export function dueDateTone(dueDate: string | null, today = todayIsoDate()): DueDateTone {
  if (!dueDate) {
    return null;
  }
  if (dueDate < today) {
    return "overdue";
  }
  if (dueDate === today) {
    return "today";
  }
  return null;
}

export function formatDueChip(dueDate: string | null, today = todayIsoDate()) {
  const tone = dueDateTone(dueDate, today);
  if (tone === "overdue") return "Atrasado";
  if (tone === "today") return "Hoje";
  if (!dueDate) return "Sem prazo";
  return formatDate(dueDate);
}

export function formatDate(date: string | null) {
  if (!date) {
    return "Sem prazo";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium"
  }).format(new Date(`${date}T00:00:00`));
}

export function formatDateTime(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(date));
}

export function statusLabel(status: string) {
  switch (status) {
    case "todo":
      return "A fazer";
    case "in_progress":
      return "Em andamento";
    case "done":
      return "Concluída";
    default:
      return status;
  }
}

export function priorityLabel(priority: string) {
  switch (priority) {
    case "low":
      return "Baixa";
    case "medium":
      return "Média";
    case "high":
      return "Alta";
    default:
      return priority;
  }
}

export function recurrenceLabel(recurrence?: string) {
  switch (recurrence) {
    case "daily":
      return "🔁 Diária";
    case "weekly":
      return "🔁 Semanal";
    case "monthly":
      return "🔁 Mensal";
    default:
      return null;
  }
}

export function formatDuration(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hours > 0) {
    return `${hours}h ${String(minutes).padStart(2, "0")}min`;
  }
  if (minutes > 0) {
    return `${minutes}min`;
  }
  return `${secs}s`;
}

export function formatDurationClock(seconds: number) {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }
  return `${minutes}:${String(secs).padStart(2, "0")}`;
}

/**
 * Lê estimativas digitadas como "90", "1h30", "1h 30min", "1:30", "2h", "45min", "1,5h".
 * Número puro = minutos. Retorna null se vazio ou inválido; limita a 999h.
 */
export function parseEstimateMinutes(raw: string): number | null {
  const text = raw.trim().toLowerCase().replace(",", ".");
  if (!text) return null;

  let minutes: number | null = null;
  const clock = text.match(/^(\d{1,3}):([0-5]\d)$/);
  const hoursMinutes = text.match(/^(\d{1,3}(?:\.\d+)?)\s*h(?:\s*(\d{1,2})\s*(?:m|min)?)?$/);
  const onlyMinutes = text.match(/^(\d{1,5})\s*(?:m|min)?$/);

  if (clock) minutes = Number(clock[1]) * 60 + Number(clock[2]);
  else if (hoursMinutes) minutes = Math.round(Number(hoursMinutes[1]) * 60) + Number(hoursMinutes[2] || 0);
  else if (onlyMinutes) minutes = Number(onlyMinutes[1]);

  if (minutes === null || !Number.isFinite(minutes) || minutes <= 0) return null;
  return Math.min(minutes, 999 * 60);
}

export function formatEstimate(minutes: number | null | undefined) {
  if (!minutes || minutes <= 0) return "";
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (!hours) return `${rest}min`;
  return rest ? `${hours}h${String(rest).padStart(2, "0")}` : `${hours}h`;
}
