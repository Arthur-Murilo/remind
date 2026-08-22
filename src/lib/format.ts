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
