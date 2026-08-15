"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import type { Project, TaskFilter } from "@/domain/types";

type FilterBarProps = {
  projects?: Project[];
  filter: TaskFilter;
  showProjectSelect?: boolean;
  basePath?: string;
};

export function FilterBar({
  projects = [],
  filter,
  showProjectSelect = true,
  basePath
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
      if (value && value !== "all") {
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

  const hasActiveFilters = Boolean(
    filter.search ||
      (filter.projectId && showProjectSelect) ||
      (filter.status && filter.status !== "all") ||
      (filter.priority && filter.priority !== "all") ||
      (filter.due && filter.due !== "all")
  );

  return (
    <div className="filter-bar">
      <div style={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar tarefa ou projeto..."
          aria-label="Buscar tarefa"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm("");
              updateQueryParam("search", "");
            }}
            style={{
              position: "absolute",
              right: "8px",
              background: "transparent",
              border: 0,
              color: "var(--ink-soft)",
              cursor: "pointer",
              fontSize: "0.85rem",
              padding: "2px"
            }}
            title="Limpar busca"
          >
            ✕
          </button>
        )}
      </div>

      {showProjectSelect && (
        <select
          value={filter.projectId || ""}
          onChange={(e) => updateQueryParam("projectId", e.target.value)}
          aria-label="Filtrar por projeto"
        >
          <option value="">Todos os projetos</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name}
            </option>
          ))}
        </select>
      )}

      <select
        value={filter.status || "all"}
        onChange={(e) => updateQueryParam("status", e.target.value)}
        aria-label="Filtrar por status"
      >
        <option value="all">Todos os status</option>
        <option value="todo">A fazer</option>
        <option value="in_progress">Em andamento</option>
        <option value="done">Concluída</option>
      </select>

      <select
        value={filter.priority || "all"}
        onChange={(e) => updateQueryParam("priority", e.target.value)}
        aria-label="Filtrar por prioridade"
      >
        <option value="all">Todas as prioridades</option>
        <option value="high">Alta</option>
        <option value="medium">Média</option>
        <option value="low">Baixa</option>
      </select>

      <select
        value={filter.due || "all"}
        onChange={(e) => updateQueryParam("due", e.target.value)}
        aria-label="Filtrar por prazo"
      >
        <option value="all">Todos os prazos</option>
        <option value="overdue">Atrasadas</option>
        <option value="soon">Vencendo</option>
        <option value="none">Sem prazo</option>
      </select>

      {hasActiveFilters && (
        <button
          type="button"
          className="button-ghost icon-button"
          onClick={handleClear}
          title="Limpar todos os filtros"
          aria-label="Limpar todos os filtros"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "30px",
            height: "30px",
            borderRadius: "var(--radius-sm)",
            color: "var(--ink-soft)",
            padding: 0
          }}
        >
          ✕
        </button>
      )}
    </div>
  );
}
