const DEFAULT_TIME_ZONE = "America/Sao_Paulo";

function isValidTimeZone(value: string) {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

/**
 * Fuso horário do usuário/aplicação. Define o que é "hoje" no Postgres (current_date,
 * date_trunc) e nos relatórios de tempo. O servidor costuma rodar em UTC (Docker), então
 * sem isso o dia virava às 21h no horário de Brasília.
 */
export function appTimeZone() {
  const configured = process.env.APP_TIMEZONE?.trim();
  if (configured && isValidTimeZone(configured)) return configured;
  return DEFAULT_TIME_ZONE;
}
