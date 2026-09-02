"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import type { CatalogItem, Project, TaskFilter } from "@/domain/types";
import { SelectPopover } from "@/components/ui-controls";
import { resolveCatalogItem } from "@/domain/catalog";
import { CatalogBadge } from "@/components/catalog-badge";

type FilterBarProps = {
  projects?: Project[];
  filter: TaskFilter;
  showProjectSelect?: boolean;
  basePath?: string;
  statuses?: CatalogItem[];
  priorities?: CatalogItem[];
};

export function FilterBar({
  projects = [],
  filter,
  showProjectSelect = true,
  basePath,
  statuses = [],
  priorities = []
}: FilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const currentPath = basePath || pathname;
  const [searchTerm, setSearchTerm] = useState(filter.search || "");

  useEffect(() => {
    setSearchTerm(filter.search || "");
  }, [filter.search]);

  const updateQueryParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value !== "all" && value !== "") {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      router.push(`${currentPath}?${params.toString()}` as any);
    },
    [router, searchParams, currentPath]
  );

  useEffect(() => {
    const handler = setTimeout(() => {
      if (searchTerm !== (filter.search || "")) {
        updateQueryParam("search", searchTerm.trim());
      }
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm, filter.search, updateQueryParam]);

  const handleClear = () => {
    setSearchTerm("");
    router.push(currentPath as any);
  };

  const chips: Array<{ key: string; label: string }> = [];
  if (filter.search) chips.push({ key: "search", label: `Busca: ${filter.search}` });
  if (filter.projectId && showProjectSelect) {
    const name = projects.find((p) => p.id === filter.projectId)?.name || "Projeto";
    chips.push({ key: "projectId", label: `Projeto: ${name}` });
  }
  if (filter.status && filter.status !== "all") {
    chips.push({
      key: "status",
      label: `Status: ${resolveCatalogItem(statuses, filter.status).label}`
    });
  }
  if (filter.priority && filter.priority !== "all") {
    chips.push({
      key: "priority",
      label: `Prioridade: ${resolveCatalogItem(priorities, filter.priority).label}`
    });
  }
  if (filter.due && filter.due !== "all") {
    const dueMap: Record<string, string> = {
      overdue: "Atrasadas",
      soon: "Hoje",
      none: "Sem prazo"
    };
    chips.push({ key: "due", label: `Prazo: ${dueMap[filter.due] || filter.due}` });
  }

  return (
    <div className="filter-panel">
      <div className="filter-bar">
        <div className="filter-search">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar tarefa ou projeto..."
            aria-label="Buscar tarefa"
          />
          {searchTerm ? (
            <button
              type="button"
              className="filter-search-clear"
              onClick={() => {
                setSearchTerm("");
                updateQueryParam("search", "");
              }}
              title="Limpar busca"
              aria-label="Limpar busca"
            >
              ×
            </button>
          ) : null}
        </div>

        {showProjectSelect ? (
          <SelectPopover
            ariaLabel="Filtrar por projeto"
            value={filter.projectId || ""}
            onChange={(value) => updateQueryParam("projectId", value)}
            placeholder="Todos os projetos"
            triggerClassName="filter-select"
            options={[
              { value: "", label: "Todos os projetos" },
              ...projects.map((project) => ({ value: project.id, label: project.name }))
            ]}
          />
        ) : null}

        <SelectPopover
          ariaLabel="Filtrar por status"
          value={filter.status || "all"}
          onChange={(value) => updateQueryParam("status", value)}
          triggerClassName="filter-select"
          options={[
            { value: "all", label: "Todos os status" },
            ...statuses.map((item) => ({ value: item.key, label: item.label }))
          ]}
          renderValue={(option) => {
            if (!option || option.value === "all") return option?.label || "Todos os status";
            return <CatalogBadge item={resolveCatalogItem(statuses, option.value)} />;
          }}
        />

        <SelectPopover
          ariaLabel="Filtrar por prioridade"
          value={filter.priority || "all"}
          onChange={(value) => updateQueryParam("priority", value)}
          triggerClassName="filter-select"
          options={[
            { value: "all", label: "Todas as prioridades" },
            ...priorities.map((item) => ({ value: item.key, label: item.label }))
          ]}
          renderValue={(option) => {
            if (!option || option.value === "all") return option?.label || "Todas as prioridades";
            return <CatalogBadge item={resolveCatalogItem(priorities, option.value)} />;
          }}
        />

        <SelectPopover
          ariaLabel="Filtrar por prazo"
          value={filter.due || "all"}
          onChange={(value) => updateQueryParam("due", value)}
          triggerClassName="filter-select"
          options={[
            { value: "all", label: "Todos os prazos" },
            { value: "overdue", label: "Atrasadas" },
            { value: "soon", label: "Hoje" },
            { value: "none", label: "Sem prazo" }
          ]}
        />

        {chips.length > 0 ? (
          <button type="button" className="button-ghost compact filter-clear-text" onClick={handleClear}>
            Limpar filtros
          </button>
        ) : null}
      </div>

      {chips.length > 0 ? (
        <div className="filter-chips" aria-label="Filtros ativos">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              className="filter-chip"
              onClick={() => {
                if (chip.key === "search") setSearchTerm("");
                updateQueryParam(chip.key, "");
              }}
              title={`Remover ${chip.label}`}
            >
              <span>{chip.label}</span>
              <span aria-hidden="true">×</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
