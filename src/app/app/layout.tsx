import { Suspense } from "react";
import Link from "next/link";

import { AppNav } from "@/components/app-nav";
import { ProjectNav } from "@/components/project-nav";
import { logoutAction, createProjectAction } from "@/server/actions";
import { requireCurrentUser } from "@/server/auth";
import { getProjects, getReminders } from "@/server/remind-service";

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
  const [projects, reminders] = await Promise.all([getProjects(user.id), getReminders(user.id)]);
  const initials = getInitials(user.name) || "R";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" href="/app" aria-label="remind">
          <span className="brand-mark">r</span>
          <span className="brand-name">remind</span>
        </Link>

        <Suspense fallback={<nav className="nav-group" aria-label="Navegacao principal" />}>
          <AppNav reminderCount={reminders.length} />
        </Suspense>

        <div className="nav-label">Projetos</div>
        <div className="sidebar-projects" aria-label="Projetos">
          <ProjectNav projects={projects} />

          <details className="inline-create">
            <summary>+ Novo projeto</summary>
            <form action={createProjectAction} className="form-grid">
              <div className="field">
                <label htmlFor="sidebar-project-name">Nome</label>
                <input id="sidebar-project-name" name="name" required placeholder="Ex.: Produto pessoal" />
              </div>
              <div className="field">
                <label htmlFor="sidebar-project-description">Descricao</label>
                <textarea id="sidebar-project-description" name="description" placeholder="Objetivo resumido" />
              </div>
              <button className="button compact" type="submit">
                Criar
              </button>
            </form>
          </details>
        </div>

        <div className="sidebar-foot">
          <span className="muted">Workspace pessoal</span>
        </div>
      </aside>

      <div className="shell-main">
        <header className="topbar">
          <div className="topbar-title">
            <strong>remind</strong>
            <span className="topbar-meta">Workspace pessoal</span>
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
