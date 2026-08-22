"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

export function AppNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const due = searchParams.get("due");
  const isReminders = pathname === "/app" && (due === "soon" || due === "overdue");
  const isMyDay = pathname === "/app" && !isReminders;
  const isTime = pathname === "/app/tempo";

  return (
    <nav className="nav-group" aria-label="Navegação principal">
      <Link className={`nav-link${isMyDay ? " active" : ""}`} href="/app">
        Meu dia
      </Link>
      <Link className={`nav-link${isTime ? " active" : ""}`} href={"/app/tempo" as any}>
        Tempo
      </Link>
    </nav>
  );
}
