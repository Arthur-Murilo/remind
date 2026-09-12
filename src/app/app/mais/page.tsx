import Link from "next/link";
import { logoutAction } from "@/server/actions";
import { requireCurrentUser } from "@/server/auth";
import { getReminders } from "@/server/remind-service";

export default async function MaisPage() {
  const user = await requireCurrentUser();
  const reminders = await getReminders(user.id);

  return (
    <div className="phone-index-view">
      <div className="phone-index-toolbar desktop-only">
        <h1>Mais</h1>
      </div>

      <div className="mais-card">
        <strong>{user.name}</strong>
        <span>{user.email}</span>
      </div>

      <nav className="mais-list" aria-label="Atalhos">
        <Link className="mais-link" href="/app?due=soon">
          <span>Lembretes</span>
          <span className="mais-link-meta">{reminders.length}</span>
        </Link>
        <Link className="mais-link" href="/app?due=all">
          Todas as tarefas
        </Link>
        <Link className="mais-link" href="/app/tempo">
          Tempo
        </Link>
      </nav>

      <form action={logoutAction} className="mais-logout">
        <button className="button-secondary" type="submit">
          Sair
        </button>
      </form>
    </div>
  );
}
