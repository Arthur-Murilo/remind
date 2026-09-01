"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname } from "next/navigation";
import { CloseIcon, MenuIcon } from "@/components/icons";
import { LogoMark } from "@/components/logo-mark";

type AppShellProps = {
  sidebar: ReactNode;
  topbarEnd: ReactNode;
  children: ReactNode;
};

export function AppShell({ sidebar, topbarEnd, children }: AppShellProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open]);

  return (
    <div className={`app-shell${open ? " nav-open" : ""}`}>
      <button
        type="button"
        className="nav-scrim"
        tabIndex={open ? 0 : -1}
        aria-label="Fechar menu"
        onClick={() => setOpen(false)}
      />

      <aside
        id="app-sidebar"
        className="sidebar"
        onClick={(event) => {
          const target = event.target as HTMLElement;
          if (target.closest("a")) setOpen(false);
        }}
      >
        <div className="sidebar-top">
          {sidebar}
        </div>
        <button
          type="button"
          className="sidebar-close"
          aria-label="Fechar menu"
          onClick={() => setOpen(false)}
        >
          <CloseIcon />
        </button>
      </aside>

      <div className="shell-main">
        <header className="topbar">
          <div className="topbar-start">
            <button
              type="button"
              className="nav-toggle"
              aria-label={open ? "Fechar menu" : "Abrir menu"}
              aria-expanded={open}
              aria-controls="app-sidebar"
              onClick={() => setOpen((value) => !value)}
            >
              {open ? <CloseIcon /> : <MenuIcon />}
            </button>
            <div className="topbar-title">
              <LogoMark size={18} className="topbar-logo" />
              <strong>Remind</strong>
            </div>
          </div>
          <div className="topbar-end">{topbarEnd}</div>
        </header>
        <main className="page-wrap">{children}</main>
      </div>
    </div>
  );
}
