import { requireCurrentUser } from "@/server/auth";
import { getDayRitual } from "@/server/daily-ritual";
import { DayRitualView } from "@/components/day-ritual";

type DiaPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function DiaPage({ searchParams }: DiaPageProps) {
  const user = await requireCurrentUser();
  const params = await searchParams;
  const modeParam = Array.isArray(params.modo) ? params.modo[0] : params.modo;
  const ritual = await getDayRitual(user.id);

  // Sem escolha explícita: depois das 17h (ou com o dia já encerrado) abre o encerramento.
  const mode =
    modeParam === "encerrar" || modeParam === "planejar"
      ? modeParam
      : ritual.note.closedAt || ritual.hour >= 17
        ? "encerrar"
        : "planejar";

  return (
    <div className="issues-view ritual-view">
      <DayRitualView ritual={ritual} mode={mode} />
    </div>
  );
}
