"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

type AppNavProps = {
  reminderCount: number;
};

export function AppNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const due = searchParams.get("due");
  const isReminders = pathname === "/app" && (due === "soon" || due === "overdue");
  const isMyDay = pathname === "/app" && !isReminders;

  return (
    <nav className="nav-group" aria-label="Navegação principal">
      <Link className={`nav-link${isMyDay ? " active" : ""}`} href="/app">
        Meu dia
      </Link>
    </nav>
  );
}
