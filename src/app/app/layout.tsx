import { Suspense } from "react";
import Link from "next/link";

import { AppNav } from "@/components/app-nav";
import { AppShell } from "@/components/app-shell";
import { ProjectNav } from "@/components/project-nav";
import { NewProjectModal } from "@/components/new-project-modal";
import { NotificationBell } from "@/components/notification-bell";
import { LogoMark } from "@/components/logo-mark";
import { logoutAction } from "@/server/actions";
import { requireCurrentUser } from "@/server/auth";
import { getCatalogs, getProjects, getReminders, getRunningSession, getTags } from "@/server/remind-service";
import { CommandPalette, PaletteTrigger } from "@/components/command-palette";
import { FocusPanel } from "@/components/focus-mode";
import { RunningTimer } from "@/components/running-timer";

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
  const [projects, reminders, runningSession, tags, catalogs] = await Promise.all([
    getProjects(user.id),
    getReminders(user.id),
    getRunningSession(user.id),
    getTags(user.id),
    getCatalogs(user.id)
  ]);
  const running = runningSession
    ? { ...runningSession, startedAt: new Date(runningSession.startedAt).toISOString() }
    : null;
  const initials = getInitials(user.name) || "R";

  return (
    <AppShell
      sidebar={
        <>
          <Link className="brand" href="/app" aria-label="Remind">
            <span className="brand-mark">
              <LogoMark size={22} />
            </span>
            <span className="brand-name">Remind</span>
          </Link>

          <Suspense fallback={<nav className="nav-group" aria-label="Navegação principal" />}>
            <AppNav />
          </Suspense>

          <div className="nav-label">Projetos</div>
          <div className="sidebar-projects" aria-label="Projetos">
            <ProjectNav projects={projects} />
            <NewProjectModal />
          </div>
        </>
      }
      topbarEnd={
        <>
          <PaletteTrigger />
          <RunningTimer session={running} />
          <FocusPanel session={running} />
          <CommandPalette
            projects={projects.map((project) => ({ id: project.id, name: project.name }))}
            tags={tags}
            priorities={catalogs.priorities}
            running={running ? { taskId: running.taskId, taskTitle: running.taskTitle } : null}
          />
          <NotificationBell reminders={reminders} />
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
        </>
      }
    >
      {children}
    </AppShell>
  );
}
