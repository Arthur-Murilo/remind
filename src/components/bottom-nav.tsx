"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { NavHomeIcon, NavMoreIcon, NavProjectsIcon, NavTimeIcon } from "@/components/icons";

const items = [
  { href: "/app" as const, label: "Meu dia", icon: NavHomeIcon, match: "myday" as const },
  { href: "/app/projetos" as const, label: "Projetos", icon: NavProjectsIcon, match: "projects" as const },
  { href: "/app/tempo" as const, label: "Tempo", icon: NavTimeIcon, match: "time" as const },
  { href: "/app/mais" as const, label: "Mais", icon: NavMoreIcon, match: "more" as const }
];

export function BottomNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const due = searchParams.get("due");

  const active = (() => {
    if (pathname.startsWith("/app/projetos") || pathname.startsWith("/app/projects")) return "projects";
    if (pathname.startsWith("/app/tempo")) return "time";
    if (pathname.startsWith("/app/mais")) return "more";
    if (pathname === "/app" && !due) return "myday";
    return null;
  })();

  return (
    <nav className="bottom-nav" aria-label="Navegação do telefone">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = active === item.match;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`bottom-nav-item${isActive ? " active" : ""}`}
            aria-current={isActive ? "page" : undefined}
          >
            <span className="bottom-nav-icon">
              <Icon />
            </span>
            <span className="bottom-nav-label">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
