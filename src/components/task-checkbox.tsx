"use client";

import { useTransition, useState } from "react";
import { toggleTaskStatusAction } from "@/server/actions";
import { playCompletionSound } from "@/lib/sound";

type TaskCheckboxProps = {
  taskId: string;
  projectId: string;
  title: string;
  initialStatus: "todo" | "in_progress" | "done";
};

export function TaskCheckbox({ taskId, projectId, title, initialStatus }: TaskCheckboxProps) {
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] = useState(initialStatus);

  const isDone = optimisticStatus === "done";

  const handleToggle = () => {
    const nextStatus = isDone ? "todo" : "done";
    setOptimisticStatus(nextStatus);

    if (nextStatus === "done") {
      playCompletionSound();
    }

    startTransition(async () => {
      const formData = new FormData();
      formData.append("taskId", taskId);
      formData.append("status", nextStatus);
      await toggleTaskStatusAction(formData);
    });
  };

  return (
    <button 
      type="button"
      className={`task-checkbox ${isDone ? "checked" : ""}`}
      onClick={handleToggle}
      disabled={isPending}
      aria-label={isDone ? "Marcar como não concluída" : "Marcar como concluída"}
    >
      {isDone && (
        <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11.6666 3.5L5.24992 9.91667L2.33325 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )}
    </button>
  );
}
