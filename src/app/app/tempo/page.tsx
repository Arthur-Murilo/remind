import { requireCurrentUser } from "@/server/auth";
import { getProjects, getTimeReport } from "@/server/remind-service";
import { TimeReportView } from "@/components/time-report";
import type { TimePeriod } from "@/domain/types";

type TempoPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

function pick(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function TempoPage({ searchParams }: TempoPageProps) {
  const user = await requireCurrentUser();
  const params = await searchParams;
  const projectId = pick(params.projectId) || undefined;
  const periodRaw = pick(params.period);
  const period: TimePeriod = periodRaw === "day" || periodRaw === "month" ? periodRaw : "week";

  const [projects, report] = await Promise.all([
    getProjects(user.id),
    getTimeReport(user.id, { projectId, period })
  ]);

  return (
    <div className="issues-view">
      <div className="issues-toolbar">
        <div>
          <h1>Tempo</h1>
          <p className="muted" style={{ margin: "4px 0 0" }}>
            Distribuição das horas por projeto e tarefa.
          </p>
        </div>
      </div>

      <TimeReportView
        projects={projects}
        projectId={projectId}
        period={period}
        totalSeconds={report.totalSeconds}
        byProject={report.projects}
        byTask={report.tasks}
        sessions={report.sessions}
      />
    </div>
  );
}
