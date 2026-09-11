# Tarefas do Agente

## Tarefa Atual

### Tarefa
MCP Agent Access — expor Streamable HTTP MCP em `/api/mcp` para agentes Cursor/Grok.

### Objetivo
Permitir listar tarefas, criar tarefa/subtarefa e obter relatório de tempo via MCP autenticado com Bearer API token, reusando `remind-service`.

### Subtarefas
- [x] Escrever specs (spec.md, design.md, tasks.md) com REQ-MCP-01..09
- [x] Auth Bearer segura (SHA-256 + timingSafeEqual) e matriz de testes
- [x] Rate limit 60 req/min (IP + token) com 429 + Retry-After
- [x] Schemas Zod estritos (caps de título, descrição, search, limit)
- [x] Quatro tools ligadas a remind-service (list_tasks, create_task, create_subtask, get_time_report)
- [x] Rota Next.js `/api/mcp` Streamable HTTP, body 64 KiB, Cache-Control no-store
- [x] Playwright smoke + testes de contrato
- [x] Docs (`docs/mcp.md`), `.env-example`, README, CI
- [x] Validar typecheck, E2E MCP e abrir PR

### Status
Concluída.

### Bloqueios
Nenhum.

### Próximos Passos
Nenhum.
