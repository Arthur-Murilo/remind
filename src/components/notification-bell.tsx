"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { markReminderAsReadAction } from "@/server/actions";
import { formatDate, dueDateTone } from "@/lib/format";
import type { Reminder } from "@/domain/types";

type NotificationBellProps = {
  reminders: Reminder[];
};

export function NotificationBell({ reminders = [] }: NotificationBellProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const count = reminders.length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={dropdownRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        className="icon-button notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`Notificações e Lembretes (${count})`}
        title="Lembretes e Prazos"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {count > 0 && <span className="notification-badge">{count}</span>}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <strong>Lembretes & Notificações</strong>
            <span className="muted">{count} pendentes</span>
          </div>

          <div className="notification-list">
            {count > 0 ? (
              reminders.map((reminder) => {
                const tone = dueDateTone(reminder.dueDate);
                const dueLabel =
                  tone === "overdue"
                    ? `Atrasada: ${formatDate(reminder.dueDate)}`
                    : tone === "today"
                      ? `Hoje: ${formatDate(reminder.dueDate)}`
                      : `Prazo: ${reminder.dueDate || "Em breve"}`;
                return (
                <div key={reminder.id} className="notification-item">
                  <div className="notification-content">
                    <Link href={`/app?search=${encodeURIComponent(reminder.taskTitle)}`} onClick={() => setIsOpen(false)}>
                      <strong className="notification-task-title">{reminder.taskTitle}</strong>
                    </Link>
                    <div className="notification-meta">
                      <span>{reminder.projectName}</span>
                      <span className="bullet">•</span>
                      <span className={`due-tag${tone ? ` due-${tone}` : ""}`}>{dueLabel}</span>
                    </div>
                  </div>
                  <form action={markReminderAsReadAction}>
                    <input type="hidden" name="reminderId" value={reminder.id} />
                    <button type="submit" className="notification-check-btn" title="Marcar como visto">
                      ✓
                    </button>
                  </form>
                </div>
                );
              })
            ) : (
              <div className="notification-empty">
                <span>Nenhum lembrete pendente no momento! 🎉</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
