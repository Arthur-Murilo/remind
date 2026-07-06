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
