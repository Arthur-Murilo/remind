"use client";

import type { CatalogItem } from "@/domain/types";

function withAlpha(hex: string, alpha: string) {
  if (!/^#([0-9a-f]{6})$/i.test(hex)) return hex;
  return `${hex}${alpha}`;
}

export function CatalogBadge({ item }: { item: CatalogItem }) {
  return (
    <span
      className="badge catalog-badge"
      style={{
        color: item.color,
        background: withAlpha(item.color, "26"),
        borderColor: withAlpha(item.color, "59")
      }}
    >
      {item.label}
    </span>
  );
}
