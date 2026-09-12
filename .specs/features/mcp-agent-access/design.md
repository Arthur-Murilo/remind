# Design — MCP Agent Access

## Decisão de transporte

O endpoint vive na própria app Next.js (App Router) em `src/app/api/mcp/route.ts`. Não há processo MCP paralelo.

A hipótese confirmada contra o SDK atual (`@modelcontextprotocol/sdk` 1.x): `WebStandardStreamableHTTPServerTransport` fala `Request`/`Response` web standard, que é o formato dos Route Handlers do Next.js 16. Modo **stateless** (`sessionIdGenerator: undefined`) + `enableJsonResponse: true` + `maxRequestBodySize: 65536`. Instância nova de `McpServer` + transport por requisição (isolamento; o SDK recusa reutilizar transport stateless).

`mcp-handler` / `@vercel/mcp-adapter` não são necessários: o transport oficial já devolve `Response`.

## Fluxo HTTP

1. Recusar token na query string (não ler `token`/`access_token` da URL).
2. Se `Content-Length` > 64 KiB → 413.
3. Rate limit in-memory **por IP** (pré-auth; 60/min). Tokens distintos no mesmo IP compartilham o bucket.
4. Comparar token (SHA-256 + `timingSafeEqual` de 32 bytes). Falha → 401 genérico, antes de qualquer tool.
5. Resolver o usuário dono (`MCP_USER_EMAIL` || `SEED_USER_EMAIL`).
6. Conectar MCP e `transport.handleRequest(request)`.
7. Espelhar a resposta com `Cache-Control: no-store`.
8. `try/catch`: em produção, 500 genérico sem stack.

## Módulos

| Arquivo | Responsabilidade |
| --- | --- |
| `src/mcp/auth.ts` | Extrair Bearer, comparar digestos, 401 genérico |
| `src/mcp/rate-limit.ts` | Janela deslizante 60/min, in-memory, single-node |
| `src/mcp/schemas.ts` | Zod `.strict()` e caps |
| `src/mcp/errors.ts` | Corpos HTTP genéricos; erros de tool (`not_found`, entrada inválida) |
| `src/mcp/server.ts` | Factory `McpServer` com as 4 tools ligadas a `remind-service` |
| `src/app/api/mcp/route.ts` | GET/POST/DELETE → pipeline acima |

Regras de negócio continuam em `src/server/remind-service.ts`. O MCP não reimplementa listagem, criação nem relatório de tempo.

## Tools (conjunto fechado)

Somente: `list_tasks`, `create_task`, `create_subtask`, `get_time_report`.

Handlers fecham sobre `userId` do dono. 404 de domínio vira resultado de tool com `isError: true` e JSON `{ "error": "not_found", "message": "..." }` — o HTTP da sessão MCP autenticada permanece 2xx JSON-RPC.

## Rate limit

Mapa em memória no processo Node, chave = IP do cliente, aplicado **antes** da auth. Tokens Bearer rotacionados no mesmo IP não diluem o limite. Em deploy de um container (Compose/VPS atual) isso basta. Vários nós não compartilham contadores — documentado em `docs/mcp.md`.

## Testes

- Contrato: Playwright contra HTTP `/api/mcp` (auth, rate limit, schemas, tools).
- Smoke: initialize + `tools/list` (exatamente 4 nomes) + chamada feliz.
- Unidades de `tokensMatch` e do limiter (relógio injetável) no mesmo runner Playwright, fora do browser.

Token de CI: valor fixo de teste em env, distinto de qualquer segredo de produção.
