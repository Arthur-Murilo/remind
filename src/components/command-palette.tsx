"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { createTaskAction, searchTasksAction, startWorkSessionAction, stopWorkSessionAction } from "@/server/actions";
import { parseQuickTask, normalizeToken } from "@/domain/quick-parse";
import { QuickPreview, QUICK_SYNTAX_HINT, quickTaskFormData } from "@/components/quick-preview";
import { startFocus } from "@/components/focus-mode";
import { formatDate, todayIsoDate } from "@/lib/format";
import { setFocusState } from "@/lib/focus-store";
import type { CatalogItem, Tag } from "@/domain/types";

type PaletteProps = {
  projects: Array<{ id: string; name: string }>;
  tags: Tag[];
  priorities: CatalogItem[];
  running: { taskId: string; taskTitle: string } | null;
};

type Item = {
  id: string;
  group: string;
  label: string;
  hint?: string;
  keywords?: string;
  run: (options: { alt: boolean }) => void | Promise<void>;
};

export const OPEN_PALETTE_EVENT = "remind:open-palette";

export function openCommandPalette() {
  window.dispatchEvent(new Event(OPEN_PALETTE_EVENT));
}

function isTypingTarget(target: EventTarget | null) {
  const element = target as HTMLElement | null;
  if (!element) return false;
  return element.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(element.tagName);
}

export function CommandPalette({ projects, tags, priorities, running }: PaletteProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const [hits, setHits] = useState<Array<{ id: string; title: string; projectName: string; dueDate: string | null }>>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActive(0);
    previousFocus.current?.focus?.();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
        return;
      }
      // "/" abre a paleta quando não se está digitando em um campo.
      if (event.key === "/" && !open && !isTypingTarget(event.target)) {
        event.preventDefault();
        setOpen(true);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_PALETTE_EVENT, onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_PALETTE_EVENT, onOpen);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    previousFocus.current = document.activeElement as HTMLElement | null;
    setMessage(null);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handle = window.setTimeout(async () => {
      try {
        setHits(await searchTasksAction(query.startsWith(">") ? "" : parseQuickTask(query, { today: todayIsoDate(), projects: [], tags: [], priorities: [] }).title));
      } catch {
        setHits([]);
      }
    }, 140);
    return () => window.clearTimeout(handle);
  }, [open, query]);

  const parsed = useMemo(
    () => parseQuickTask(query, { today: todayIsoDate(), projects, tags, priorities }),
    [query, projects, tags, priorities]
  );

  const items = useMemo<Item[]>(() => {
    const go = (href: string) => () => {
      router.push(href as never);
      close();
    };
    const navigation: Item[] = [
      { id: "nav-myday", group: "Ir para", label: "Meu dia", keywords: "inicio hoje", run: go("/app") },
      { id: "nav-plan", group: "Ir para", label: "Planejar o dia", keywords: "ritual manha carga", run: go("/app/dia") },
      { id: "nav-close", group: "Ir para", label: "Encerrar o dia", keywords: "ritual noite destaques shutdown", run: go("/app/dia?modo=encerrar") },
      { id: "nav-time", group: "Ir para", label: "Tempo", keywords: "relatorio horas insights", run: go("/app/tempo") },
      { id: "nav-all", group: "Ir para", label: "Todas as tarefas", keywords: "abertas", run: go("/app?due=all") },
      { id: "nav-reminders", group: "Ir para", label: "Lembretes", keywords: "atrasadas hoje", run: go("/app?due=soon") },
      ...projects.map((project) => ({
        id: `project-${project.id}`,
        group: "Projetos",
        label: project.name,
        run: go(`/app/projects/${project.id}`)
      }))
    ];

    const actions: Item[] = running
      ? [
          {
            id: "action-stop",
            group: "Cronômetro",
            label: `Parar cronômetro — ${running.taskTitle}`,
            keywords: "parar stop",
            run: async () => {
              await stopWorkSessionAction();
              setFocusState(null);
              close();
            }
          },
          {
            id: "action-focus-running",
            group: "Cronômetro",
            label: `Foco 25 min — ${running.taskTitle}`,
            keywords: "pomodoro foco",
            run: async () => {
              await startFocus({ id: running.taskId, title: running.taskTitle }, 25);
              close();
            }
          }
        ]
      : [];

    const needle = normalizeToken(query.replace(/^>/, ""));
    const matches = (item: Item) =>
      !needle || normalizeToken(`${item.label} ${item.keywords ?? ""}`).includes(needle);

    const create: Item[] =
      query.trim() && !query.startsWith(">") && parsed.title
        ? [
            {
              id: "create",
              group: "Criar",
              label: `Criar tarefa “${parsed.title}”`,
              hint: parsed.projectId ? undefined : `em ${projects[0]?.name ?? "—"}`,
              run: async () => {
                const projectId = parsed.projectId || projects[0]?.id;
                if (!projectId) return;
                await createTaskAction(quickTaskFormData(parsed, { projectId }));
                setMessage(`Tarefa criada: ${parsed.title}`);
                setQuery("");
                router.refresh();
              }
            }
          ]
        : [];

    const taskItems: Item[] = hits.slice(0, 6).map((hit) => ({
      id: `task-${hit.id}`,
      group: "Tarefas",
      label: hit.title,
      hint: `${hit.projectName}${hit.dueDate ? ` · ${formatDate(hit.dueDate)}` : ""} · Enter cronômetro · Shift+Enter foco`,
      run: async ({ alt }) => {
        if (alt) {
          await startFocus({ id: hit.id, title: hit.title }, 25);
        } else {
          const formData = new FormData();
          formData.append("taskId", hit.id);
          await startWorkSessionAction(formData);
        }
        close();
      }
    }));

    const matched = [...actions.filter(matches), ...navigation.filter(matches)];
    // "Criar" só vem primeiro quando o texto tem marcadores (#, !, @, ~, data) ou nada mais casa;
    // assim "tempo" + Enter navega em vez de criar uma tarefa chamada "tempo".
    const createFirst = parsed.tokens.length > 0 || (!matched.length && !taskItems.length);
    return createFirst ? [...create, ...matched, ...taskItems] : [...matched, ...taskItems, ...create];
  }, [query, parsed, projects, running, hits, router, close]);

  useEffect(() => {
    setActive((value) => Math.min(value, Math.max(0, items.length - 1)));
  }, [items.length]);

  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  if (!open || typeof document === "undefined") return null;

  const run = (item: Item | undefined, alt = false) => {
    if (!item || isPending) return;
    startTransition(async () => {
      await item.run({ alt });
    });
  };

  let lastGroup = "";

  return createPortal(
    <div className="palette-backdrop" onMouseDown={(event) => event.target === event.currentTarget && close()}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="Paleta de comandos">
        <div className="palette-input-row">
          <input
            ref={inputRef}
            className="palette-input"
            value={query}
            placeholder="Buscar, navegar ou criar tarefa…"
            aria-label="Comando ou nova tarefa"
            aria-controls="palette-list"
            aria-activedescendant={items[active] ? `palette-item-${active}` : undefined}
            role="combobox"
            aria-expanded="true"
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
              setMessage(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                event.preventDefault();
                close();
              } else if (event.key === "ArrowDown") {
                event.preventDefault();
                setActive((value) => (items.length ? (value + 1) % items.length : 0));
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActive((value) => (items.length ? (value - 1 + items.length) % items.length : 0));
              } else if (event.key === "Enter") {
                event.preventDefault();
                run(items[active], event.shiftKey);
              }
            }}
          />
          <kbd className="palette-kbd">Esc</kbd>
        </div>

        {query.trim() && !query.startsWith(">") ? <QuickPreview result={parsed} /> : null}

        <div className="palette-list" id="palette-list" role="listbox" ref={listRef}>
          {items.length ? (
            items.map((item, index) => {
              const header = item.group !== lastGroup ? item.group : null;
              lastGroup = item.group;
              return (
                <div key={item.id}>
                  {header ? <div className="palette-group">{header}</div> : null}
                  <div
                    id={`palette-item-${index}`}
                    data-index={index}
                    role="option"
                    aria-selected={index === active}
                    className={`palette-item${index === active ? " active" : ""}`}
                    onMouseMove={() => setActive(index)}
                    onClick={(event) => run(item, event.shiftKey)}
                  >
                    <span className="palette-item-label">{item.label}</span>
                    {item.hint ? <span className="palette-item-hint">{item.hint}</span> : null}
                  </div>
                </div>
              );
            })
          ) : (
            <p className="palette-empty">Nada encontrado.</p>
          )}
        </div>

        <div className="palette-footer">
          {message ? (
            <span className="palette-message" role="status">
              {message}
            </span>
          ) : (
            <span>{isPending ? "Executando…" : `Sintaxe: ${QUICK_SYNTAX_HINT}`}</span>
          )}
          <span className="palette-keys">↑↓ navegar · Enter executar · Ctrl+K fechar</span>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function PaletteTrigger() {
  return (
    <button type="button" className="palette-trigger" onClick={openCommandPalette} aria-label="Abrir paleta de comandos (Ctrl+K)" title="Comandos (Ctrl+K)">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
        <circle cx="11" cy="11" r="6.5" />
        <path d="M20 20l-4-4" />
      </svg>
      <span className="palette-trigger-text">Buscar ou criar</span>
      <kbd>Ctrl K</kbd>
    </button>
  );
}
