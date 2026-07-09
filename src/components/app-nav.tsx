"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type AppNavProps = {
  reminderCount: number;
};

export function AppNav({ reminderCount }: AppNavProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const due = searchParams.get("due");
  const isReminders = pathname === "/app" && (due === "soon" || due === "overdue");
  const isMyDay = pathname === "/app" && !isReminders;

  return (
    <nav className="nav-group" aria-label="Navegacao principal">
      <Link className={`nav-link${isMyDay ? " active" : ""}`} href="/app">
        Meu dia
      </Link>
      <Link className={`nav-link${isReminders ? " active" : ""}`} href="/app?due=soon">
        Lembretes
        {reminderCount ? <span className="nav-count">{reminderCount}</span> : null}
      </Link>
    </nav>
  );
}
