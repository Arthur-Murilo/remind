import Link from "next/link";

import { logoutAction } from "@/server/actions";
import { requireCurrentUser } from "@/server/auth";

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default async function AppLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireCurrentUser();
  const initials = getInitials(user.name) || "R";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/app" aria-label="remind">
          <span className="brand-mark">r</span>
          <span className="brand-name">remind</span>
        </Link>

        <nav className="nav-group" aria-label="Navegacao principal">
          <Link className="nav-link active" href="/app">
            Meu dia
          </Link>
          <a className="nav-link" href="#projects">
            Projetos
          </a>
          <a className="nav-link" href="#reminders">
            Lembretes
          </a>
        </nav>

        <div className="sidebar-foot">
          <span>Workspace pessoal</span>
        </div>
      </aside>

      <div className="shell-main">
        <header className="topbar">
          <div className="topbar-title">
            <span>Workspace pessoal</span>
            <strong>Meu dia</strong>
          </div>

          <details className="user-menu">
            <summary aria-label="Abrir menu do usuario">
              <span className="avatar">{initials}</span>
            </summary>
            <div className="user-menu-panel">
              <div>
                <strong>{user.name}</strong>
                <span>{user.email}</span>
              </div>
              <form action={logoutAction}>
                <button className="button-secondary compact" type="submit">
                  Sair
                </button>
              </form>
            </div>
          </details>
        </header>

        <main className="page-wrap">{children}</main>
      </div>
    </div>
  );
}
