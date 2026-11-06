import { getCurrentUser } from "@/server/auth";
import { getTimeInsights } from "@/server/time-insights";
import type { TimePeriod } from "@/domain/types";

export const dynamic = "force-dynamic";

function csvCell(value: string | number) {
  let text = String(value);
  // Evita injeção de fórmula ao abrir no Excel/Sheets.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[";\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return new Response("Não autenticado.", { status: 401 });
  }

  const url = new URL(request.url);
  const periodRaw = url.searchParams.get("period");
  const period: TimePeriod = periodRaw === "day" || periodRaw === "month" ? periodRaw : "week";
  const offset = Number.parseInt(url.searchParams.get("offset") || "0", 10) || 0;
  const projectId = url.searchParams.get("projectId") || undefined;

  const insights = await getTimeInsights(user.id, { period, offset, projectId });

  const header = ["Data", "Início", "Fim", "Duração (min)", "Duração (h)", "Tarefa", "Projeto", "Origem"];
  const lines = [...insights.sessions]
    .reverse()
    .map((session) =>
      [
        session.day,
        session.startTime,
        session.endTime ?? "",
        Math.round(session.durationSeconds / 60),
        (session.durationSeconds / 3600).toFixed(2).replace(".", ","),
        session.taskTitle,
        session.projectName,
        session.source === "manual" ? "manual" : "cronômetro"
      ]
        .map(csvCell)
        .join(";")
    );

  const body = `﻿${[header.join(";"), ...lines].join("\r\n")}\r\n`;
  const fileName = `remind-tempo-${period}-${insights.from.slice(0, 10)}.csv`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
      "Cache-Control": "no-store"
    }
  });
}
