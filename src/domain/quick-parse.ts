import type { TaskRecurrence } from "@/domain/types";
import { parseEstimateMinutes } from "@/lib/format";

/**
 * Captura rápida em linguagem natural (pt-BR), no espírito do Quick Add do Todoist.
 *
 *   "Revisar contrato amanhã #financeiro !alta @cliente ~45min"
 *
 * Reconhece prazo (hoje, amanhã, depois de amanhã, dia da semana, "dia 15", 15/11,
 * "semana que vem", "em 3 dias"), #projeto, !prioridade, @etiqueta, ~estimativa e
 * recorrência ("todo dia", "toda semana", "todo mês"). O prazo é só data: horários
 * como "14h" ficam no título.
 */

export type QuickParseContext = {
  today: string; // YYYY-MM-DD no fuso do usuário
  projects: Array<{ id: string; name: string }>;
  tags: Array<{ id: string; name: string }>;
  priorities: Array<{ key: string; label: string }>;
};

export type QuickToken =
  | { kind: "due"; raw: string; label: string }
  | { kind: "project"; raw: string; label: string }
  | { kind: "priority"; raw: string; label: string }
  | { kind: "tag"; raw: string; label: string }
  | { kind: "estimate"; raw: string; label: string }
  | { kind: "recurrence"; raw: string; label: string }
  | { kind: "unknown"; raw: string; label: string };

export type QuickParseResult = {
  title: string;
  dueDate?: string;
  projectId?: string;
  priority?: string;
  tagIds: string[];
  estimateMinutes?: number;
  recurrence?: TaskRecurrence;
  tokens: QuickToken[];
};

const PRIORITY_ALIASES: Record<string, string> = {
  "1": "high",
  alta: "high",
  urgente: "high",
  "2": "medium",
  media: "medium",
  "3": "low",
  baixa: "low"
};

export function normalizeToken(value: string) {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function parseIso(iso: string) {
  return new Date(`${iso}T12:00:00Z`);
}

function toIso(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(iso: string, days: number) {
  const date = parseIso(iso);
  date.setUTCDate(date.getUTCDate() + days);
  return toIso(date);
}

export function formatQuickDate(iso: string, today: string) {
  if (iso === today) return "Hoje";
  if (iso === addDays(today, 1)) return "Amanhã";
  const label = new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC"
  }).format(parseIso(iso));
  return label.replace(/\.,/g, ",").replace(/\.$/, "");
}

function matchByName<T extends { name: string }>(items: T[], query: string) {
  const wanted = normalizeToken(query);
  if (!wanted) return undefined;
  return (
    items.find((item) => normalizeToken(item.name) === wanted) ||
    items.find((item) => normalizeToken(item.name).startsWith(wanted))
  );
}

type Span = { start: number; end: number; token: QuickToken; apply: (result: QuickParseResult) => void };

const RECURRENCE_PATTERNS: Array<[RegExp, TaskRecurrence, string]> = [
  [/(?<=^|\s)(?:todo dia|todos os dias|diariamente)(?=$|[\s,.;:!?])/i, "daily", "Diária"],
  [/(?<=^|\s)(?:toda semana|todas as semanas|semanalmente)(?=$|[\s,.;:!?])/i, "weekly", "Semanal"],
  [/(?<=^|\s)(?:todo m[eê]s|todos os meses|mensalmente)(?=$|[\s,.;:!?])/i, "monthly", "Mensal"]
];

// Bordas explícitas: o \b do JS não reconhece letras acentuadas ("amanhã", "terça").
const BEFORE = String.raw`(?<=^|[\s(,])`;
const AFTER = String.raw`(?=$|[\s,.;:!?)])`;
const PREP = String.raw`(?:(?:para|pra|até|ate|na|no) )?`;

function dateRule(body: string) {
  return new RegExp(`${BEFORE}${PREP}(?:${body})${AFTER}`, "gi");
}

export function parseQuickTask(input: string, ctx: QuickParseContext): QuickParseResult {
  const text = input;
  const spans: Span[] = [];
  const taken = (start: number, end: number) => spans.some((span) => start < span.end && end > span.start);
  const push = (start: number, end: number, token: QuickToken, apply: Span["apply"]) => {
    if (taken(start, end)) return;
    spans.push({ start, end, token, apply });
  };

  // Recorrência (antes dos dias, para "todo dia" não virar prazo).
  for (const [pattern, recurrence, label] of RECURRENCE_PATTERNS) {
    const match = pattern.exec(text);
    if (match) {
      push(match.index, match.index + match[0].length, { kind: "recurrence", raw: match[0], label }, (result) => {
        result.recurrence = recurrence;
      });
    }
  }

  // Marcadores com prefixo: #projeto, !prioridade, @etiqueta, ~estimativa.
  const marker = /(^|\s)([#!@~])([^\s#!@~]+)/g;
  for (let match = marker.exec(text); match; match = marker.exec(text)) {
    const start = match.index + match[1].length;
    const end = start + match[2].length + match[3].length;
    const raw = text.slice(start, end);
    const value = match[3];

    if (match[2] === "#") {
      const project = matchByName(ctx.projects, value);
      push(
        start,
        end,
        project ? { kind: "project", raw, label: project.name } : { kind: "unknown", raw, label: `Projeto “${value}” não encontrado` },
        (result) => {
          if (project) result.projectId = project.id;
        }
      );
    } else if (match[2] === "!") {
      const normalized = normalizeToken(value);
      const custom = ctx.priorities.find(
        (item) => normalizeToken(item.label) === normalized || normalizeToken(item.key) === normalized
      );
      const key = custom?.key ?? PRIORITY_ALIASES[normalized];
      const label = ctx.priorities.find((item) => item.key === key)?.label ?? custom?.label;
      push(
        start,
        end,
        key ? { kind: "priority", raw, label: label ?? key } : { kind: "unknown", raw, label: `Prioridade “${value}” não encontrada` },
        (result) => {
          if (key) result.priority = key;
        }
      );
    } else if (match[2] === "@") {
      const tag = matchByName(ctx.tags, value);
      push(
        start,
        end,
        tag ? { kind: "tag", raw, label: tag.name } : { kind: "unknown", raw, label: `Etiqueta “${value}” não encontrada` },
        (result) => {
          if (tag && !result.tagIds.includes(tag.id)) result.tagIds.push(tag.id);
        }
      );
    } else if (match[2] === "~") {
      const minutes = parseEstimateMinutes(value);
      if (minutes) {
        const hours = Math.floor(minutes / 60);
        const rest = minutes % 60;
        const label = hours ? (rest ? `${hours}h${String(rest).padStart(2, "0")}` : `${hours}h`) : `${rest}min`;
        push(start, end, { kind: "estimate", raw, label }, (result) => {
          result.estimateMinutes = minutes;
        });
      }
    }
  }

  // Prazo: a primeira expressão de data reconhecida vence.
  const dueRules: Array<[RegExp, (match: RegExpExecArray) => string | null]> = [
    [dateRule("depois de amanh[aã]"), () => addDays(ctx.today, 2)],
    [dateRule("amanh[aã]"), () => addDays(ctx.today, 1)],
    [dateRule("hoje"), () => ctx.today],
    [dateRule("semana que vem|pr[oó]xima semana"), () => {
      const weekday = parseIso(ctx.today).getUTCDay();
      return addDays(ctx.today, ((8 - weekday) % 7) || 7);
    }],
    [dateRule(String.raw`em (\d{1,2}) dias?`), (match) => addDays(ctx.today, Number(match[1]))],
    [dateRule(String.raw`(\d{1,2})/(\d{1,2})(?:/(\d{2,4}))?`), (match) => {
      const day = Number(match[1]);
      const month = Number(match[2]);
      const todayDate = parseIso(ctx.today);
      let year = match[3] ? Number(match[3].length === 2 ? `20${match[3]}` : match[3]) : todayDate.getUTCFullYear();
      if (month < 1 || month > 12 || day < 1 || day > 31) return null;
      let candidate = new Date(Date.UTC(year, month - 1, day, 12));
      if (candidate.getUTCMonth() !== month - 1) return null;
      if (!match[3] && toIso(candidate) < ctx.today) {
        year += 1;
        candidate = new Date(Date.UTC(year, month - 1, day, 12));
      }
      return toIso(candidate);
    }],
    [dateRule(String.raw`dia (\d{1,2})`), (match) => {
      const day = Number(match[1]);
      if (day < 1 || day > 31) return null;
      const todayDate = parseIso(ctx.today);
      for (let offset = 0; offset < 3; offset += 1) {
        const candidate = new Date(Date.UTC(todayDate.getUTCFullYear(), todayDate.getUTCMonth() + offset, day, 12));
        if (candidate.getUTCDate() === day && toIso(candidate) >= ctx.today) return toIso(candidate);
      }
      return null;
    }],
    // Só nomes completos: "ter", "qua", "seg" são palavras comuns ("ter reunião", "seguro").
    [dateRule("(segunda|ter[cç]a|quarta|quinta|sexta)(?:-feira)?|(s[aá]bado|domingo)"), (match) => {
      const word = normalizeToken(match[1] || match[2] || "");
      const index = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"].indexOf(word);
      if (index < 0) return null;
      const current = parseIso(ctx.today).getUTCDay();
      const diff = (index - current + 7) % 7 || 7;
      return addDays(ctx.today, diff);
    }]
  ];

  for (const [pattern, resolve] of dueRules) {
    const regex = new RegExp(pattern.source, pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`);
    let found = false;
    for (let match = regex.exec(text); match; match = regex.exec(text)) {
      if (taken(match.index, match.index + match[0].length)) continue;
      const iso = resolve(match);
      if (!iso) continue;
      push(match.index, match.index + match[0].length, { kind: "due", raw: match[0], label: formatQuickDate(iso, ctx.today) }, (result) => {
        result.dueDate = iso;
      });
      found = true;
      break;
    }
    if (found) break;
  }

  const result: QuickParseResult = { title: "", tagIds: [], tokens: [] };
  spans.sort((a, b) => a.start - b.start);
  let title = "";
  let cursor = 0;
  for (const span of spans) {
    span.apply(result);
    result.tokens.push(span.token);
    // Marcador não reconhecido ("#123", "@fulano") só gera aviso: o texto continua no título.
    if (span.token.kind === "unknown") continue;
    title += text.slice(cursor, span.start);
    cursor = span.end;
  }
  title += text.slice(cursor);
  result.title = title.replace(/\s{2,}/g, " ").replace(/\s+([,.;:])/g, "$1").trim();
  return result;
}
