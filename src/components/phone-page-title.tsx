"use client";

import { usePathname, useSearchParams } from "next/navigation";

export function PhonePageTitle() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const due = searchParams.get("due");

  let title = "Remind";
  if (pathname === "/app") {
    title = due === "soon" || due === "overdue" ? "Lembretes" : due === "all" ? "Todas as tarefas" : "Meu dia";
  } else if (pathname.startsWith("/app/projetos")) {
    title = "Projetos";
  } else if (pathname.startsWith("/app/tempo")) {
    title = "Tempo";
  } else if (pathname.startsWith("/app/mais")) {
    title = "Mais";
  } else if (pathname.startsWith("/app/projects/")) {
    title = "Projeto";
  }

  return <strong className="phone-page-title">{title}</strong>;
}
