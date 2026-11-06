"use client";

import type { QuickParseResult, QuickToken } from "@/domain/quick-parse";

const KIND_LABEL: Record<QuickToken["kind"], string> = {
  due: "Prazo",
  project: "Projeto",
  priority: "Prioridade",
  tag: "Etiqueta",
  estimate: "Estimativa",
  recurrence: "Repete",
  unknown: "Aviso"
};

/** Chips com o que a captura rápida entendeu do texto digitado. */
export function QuickPreview({ result, id }: { result: QuickParseResult; id?: string }) {
  if (!result.tokens.length) return null;
  return (
    <div className="quick-preview" id={id} aria-live="polite">
      {result.tokens.map((token, index) => (
        <span key={`${token.kind}-${index}`} className={`quick-chip quick-chip--${token.kind}`} title={token.raw}>
          <em>{KIND_LABEL[token.kind]}</em>
          {token.label}
        </span>
      ))}
    </div>
  );
}

/** Monta o FormData de createTaskAction a partir do resultado do parser. */
export function quickTaskFormData(
  result: QuickParseResult,
  defaults: { projectId: string; dueDate?: string }
) {
  const formData = new FormData();
  formData.set("projectId", result.projectId || defaults.projectId);
  formData.set("title", result.title);
  formData.set("status", "todo");
  formData.set("priority", result.priority || "medium");
  formData.set("recurrence", result.recurrence || "none");
  const dueDate = result.dueDate || defaults.dueDate;
  if (dueDate) formData.set("dueDate", dueDate);
  if (result.estimateMinutes) formData.set("estimate", String(result.estimateMinutes));
  for (const tagId of result.tagIds) formData.append("tagIds", tagId);
  return formData;
}

export const QUICK_SYNTAX_HINT = "amanhã · sexta · 20/11 · #projeto · !alta · @etiqueta · ~30min · todo dia";
