# MCP Agent Access

## Resumo

Expor um endpoint MCP Streamable HTTP em `/api/mcp` para que agentes (Cursor/Grok) listem tarefas, criem tarefa/subtarefa e obtenham relatório de tempo, autenticados com um Bearer token de API. O conjunto de tools é fechado. Escritas são diretas (sem confirm/dry_run).

## Requisitos

### REQ-MCP-01 — Autenticação Bearer

- O token vive só em `MCP_API_TOKEN` no `.env` do servidor. Nunca `NEXT_PUBLIC_*`.
- Cliente envia `Authorization: Bearer <token>`. Token na query string é ignorado e nunca aceito.
- Comparação: normalizar os dois lados, SHA-256 de cada um, `timingSafeEqual` nos digestos de 32 bytes. Nunca `timingSafeEqual` em strings de tamanhos diferentes.
- Ausência de token, Bearer malformado, token vazio, curto, longo ou errado → o mesmo 401 genérico (`{ "error": "Unauthorized" }`), sem detalhe de qual modo falhou.
- Se `MCP_API_TOKEN` não estiver configurado, todas as requisições recebem o mesmo 401.
- Nunca logar o header `Authorization` nem o token.
- Após autenticar, o ator é sempre o único usuário dono: `MCP_USER_EMAIL` ou, se omitido, `SEED_USER_EMAIL`.

### REQ-MCP-02 — Rate limit

- 60 requisições por minuto por chave composta `IP + token` (digest do token; token ausente usa sentinela compartilhada por IP).
- Implementação in-memory. Documentar que vale para processo/nó único.
- Excedido: HTTP 429 e header `Retry-After` (segundos).

### REQ-MCP-03 — Tool `list_tasks`

- Entrada opcional: `{ myday?, projectId?: uuid, status?, search?, limit? }`.
- `myday: true` aplica o filtro operacional Meu dia já existente no serviço.
- `limit` default 50, máximo 100.
- Retorna resumo das tarefas do dono (não o backlog de outros usuários).

### REQ-MCP-04 — Tool `create_task`

- Entrada: `{ projectId, title, description?, priority?, status?, dueDate?: YYYY-MM-DD }`.
- Cria a tarefa via `remind-service` (sem confirm/dry_run).
- Projeto inexistente ou de outro dono → erro de ferramenta equivalente a 404 (`not_found`).
- Status/prioridade omitidos usam os padrões do app (`todo` / `medium`).

### REQ-MCP-05 — Tool `create_subtask`

- Entrada: `{ taskId, title }`.
- Cria subtarefa (1 nível) via `remind-service`.
- Tarefa inexistente ou não pertencente ao dono → `not_found`.
- Linguagem de domínio: Tarefa / Subtarefa (não “atividades”).

### REQ-MCP-06 — Tool `get_time_report`

- Entrada: `{ period: "day" | "week" | "month", projectId? }`.
- Totais e breakdown via `getTimeReport` existente. Sem start/stop de sessão por MCP.

### REQ-MCP-07 — Limites de abuso

- Corpo máximo de 64 KiB em `/api/mcp`.
- Schemas Zod (ou equivalente) estritos: rejeitar chaves desconhecidas.
- Caps: título 1..200, descrição ≤ 5000, search ≤ 200, status/priority ≤ 64, `limit` default 50 max 100.
- Respostas autenticadas: `Cache-Control: no-store`.
- Em produção, não enviar stack traces ao cliente.

### REQ-MCP-08 — Documentação

- `docs/mcp.md`: como adicionar o servidor MCP (URL + Bearer), variáveis de ambiente, rotação de token (alterar env + reiniciar), túnel publica só o app Next, saída das tools é não confiável (untrusted).
- `.env-example` e README apontam para esse guia.

### REQ-MCP-09 — CI

- Contrato MCP + smoke Playwright rodam no GitHub Actions com token de teste (não é segredo de produção).
- Testes nunca logam `Authorization`.

## Fora de escopo (v1)

- Start/stop de sessão de trabalho via MCP
- Delete/update via MCP
- OAuth, multi-usuário, Cloudflare Access
- Serviço MCP separado do Next.js
