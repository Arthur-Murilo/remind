import { requireCurrentUser } from "@/server/auth";
import { getProjects } from "@/server/remind-service";
import { getTimeInsights } from "@/server/time-insights";
import { TimeReportView, type TimeGrouping } from "@/components/time-report";
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
  const groupRaw = pick(params.group);
  const grouping: TimeGrouping = groupRaw === "task" || groupRaw === "tag" ? groupRaw : "project";
  const offset = Number.parseInt(pick(params.offset) || "0", 10) || 0;

  const [projects, insights] = await Promise.all([
    getProjects(user.id),
    getTimeInsights(user.id, { projectId, period, offset })
  ]);

  return (
    <div className="issues-view tempo-view">
      <TimeReportView projects={projects} projectId={projectId} grouping={grouping} insights={insights} />
    </div>
  );
}
