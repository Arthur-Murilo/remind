import type { Breadcrumb, ErrorEvent } from "@sentry/nextjs";

// Só erros: sem tracing, sem replay, sem PII. O Remind guarda tarefas pessoais,
// então nada de cookie, cabeçalho, corpo ou query string deve sair daqui.
export function scrubEvent(event: ErrorEvent): ErrorEvent {
  if (event.request) {
    delete event.request.cookies;
    delete event.request.headers;
    delete event.request.data;
    delete event.request.query_string;
  }
  delete event.user;
  return event;
}

// console.* pode carregar títulos de tarefa ou dados de formulário.
export function scrubBreadcrumb(breadcrumb: Breadcrumb): Breadcrumb | null {
  return breadcrumb.category === "console" ? null : breadcrumb;
}

export function sentryOptions(dsn: string | undefined) {
  return {
    // Sem DSN o Sentry fica desligado (dev, CI, E2E).
    enabled: Boolean(dsn),
    dsn,
    environment: process.env.NODE_ENV,
    sendDefaultPii: false,
    // v11 coleta tudo por padrão; aqui fica tudo desligado.
    dataCollection: {
      userInfo: false,
      cookies: false,
      httpHeaders: false,
      httpBodies: [],
      urlQueryParams: false
    },
    tracesSampleRate: 0,
    beforeSend: scrubEvent,
    beforeBreadcrumb: scrubBreadcrumb
  };
}
