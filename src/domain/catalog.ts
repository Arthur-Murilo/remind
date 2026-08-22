import type { CatalogItem } from "@/domain/types";

export const SYSTEM_STATUS_ITEMS: CatalogItem[] = [
  { key: "todo", label: "A fazer", color: "#9aa1b0", system: true },
  { key: "in_progress", label: "Em andamento", color: "#5b6cff", system: true },
  { key: "done", label: "Concluída", color: "#3dba86", system: true }
];

export const SYSTEM_PRIORITY_ITEMS: CatalogItem[] = [
  { key: "high", label: "Alta", color: "#f07178", system: true },
  { key: "medium", label: "Média", color: "#e2a336", system: true },
  { key: "low", label: "Baixa", color: "#9aa1b0", system: true }
];

export const CATALOG_COLORS = ["#5b6cff", "#3dba86", "#e2a336", "#f07178", "#6ec6ff", "#c084fc", "#9aa1b0"];

export const SYSTEM_STATUS_KEYS = new Set(SYSTEM_STATUS_ITEMS.map((item) => item.key));
export const SYSTEM_PRIORITY_KEYS = new Set(SYSTEM_PRIORITY_ITEMS.map((item) => item.key));

export function slugifyCatalogKey(label: string) {
  const base = label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 40);
  return base || `item_${Date.now().toString(36)}`;
}

export function mergeCatalog(
  system: CatalogItem[],
  custom: Array<{ id: string; key: string; label: string; color: string }>
): CatalogItem[] {
  const customByKey = new Map(custom.map((item) => [item.key, item]));
  const systemKeys = new Set(system.map((item) => item.key));

  const items: CatalogItem[] = system.map((item) => {
    const override = customByKey.get(item.key);
    return {
      ...item,
      color: override?.color || item.color,
      id: override?.id
    };
  });

  for (const item of custom) {
    if (!systemKeys.has(item.key)) {
      items.push({
        key: item.key,
        label: item.label,
        color: item.color,
        system: false,
        id: item.id
      });
    }
  }

  return items;
}

export function resolveCatalogItem(items: CatalogItem[], key: string): CatalogItem {
  return (
    items.find((item) => item.key === key) || {
      key,
      label: key,
      color: "#9aa1b0",
      system: false
    }
  );
}

export function catalogSelectOptions(items: CatalogItem[], allLabel: string) {
  return [
    { value: "all", label: allLabel },
    ...items.map((item) => ({ value: item.key, label: item.label }))
  ];
}
