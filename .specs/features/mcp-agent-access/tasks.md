# Tarefas — MCP Agent Access

## 1. Specs

- [x] `spec.md` com REQ-MCP-01..09
- [x] `design.md` (transport, pipeline, módulos)
- [x] Este `tasks.md`

## 2. Auth (REQ-MCP-01)

- [x] `src/mcp/auth.ts`: SHA-256 + `timingSafeEqual` de 32 bytes
- [x] Matriz: missing, malformed Bearer, empty, short, long, wrong, correct
- [x] Todos os modos de falha → mesmo 401

## 3. Rate limit (REQ-MCP-02)

- [x] `src/mcp/rate-limit.ts` 60/min, chave IP+token
- [x] 429 + `Retry-After`

## 4. Schemas (REQ-MCP-07)

- [x] `src/mcp/schemas.ts` Zod strict + caps

## 5. Tools (REQ-MCP-03..06)

- [x] Quatro tools em `src/mcp/server.ts` via `remind-service`
- [x] 404 de projeto/tarefa não pertencentes ao dono

## 6. Rota (REQ-MCP-07)

- [x] `src/app/api/mcp/route.ts` Streamable HTTP
- [x] Body 64 KiB, `Cache-Control: no-store`, sem stack em prod

## 7. Testes (REQ-MCP-09)

- [x] `tests/mcp/auth.spec.ts`
- [x] `tests/mcp/rate-limit.spec.ts`
- [x] `tests/mcp/tools.spec.ts`
- [x] `tests/mcp/mcp.smoke.spec.ts`

## 8. Docs e CI (REQ-MCP-08, REQ-MCP-09)

- [x] `docs/mcp.md`, `.env-example`, README, CI, Compose (passar env do token)
