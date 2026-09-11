# MCP — acesso de agentes

O Remind expõe um servidor MCP **Streamable HTTP** na própria app Next.js, em `/api/mcp`. Não há processo separado. O conjunto de tools é fechado: `list_tasks`, `create_task`, `create_subtask`, `get_time_report`.

## Variáveis de ambiente

No `.env` do **servidor** (nunca `NEXT_PUBLIC_*`):

```bash
MCP_API_TOKEN=gere-um-token-longo-e-aleatorio
MCP_USER_EMAIL=arthur@remind.local
```

`MCP_USER_EMAIL` é opcional. Se omitido, o MCP usa `SEED_USER_EMAIL`. Depois da autenticação, todas as operações correm como esse único usuário dono.

## Adicionar o servidor no Cursor (Add MCP Server)

URL (app local, túnel ou VPS):

```text
https://seu-host/api/mcp
```

Em `mcp.json` (Streamable HTTP + Bearer):

```json
{
  "mcpServers": {
    "remind": {
      "url": "https://seu-host/api/mcp",
      "headers": {
        "Authorization": "Bearer <MCP_API_TOKEN>"
      }
    }
  }
}
```

O token vai só no header `Authorization`. Não coloque o token na query string.

## Rotação do token

1. Gere um novo valor para `MCP_API_TOKEN`.
2. Atualize o `.env` (e o `mcp.json` do cliente).
3. **Reinicie** o processo Node / container da app. O token é lido do ambiente; não há rotação a quente.

Tokens antigos deixam de funcionar no mesmo instante em que o processo novo sobe.

## Túnel e exposição

Um túnel (Cloudflare Tunnel, ngrok, etc.) deve publicar **somente a app Next.js** (porta 3000). O PostgreSQL permanece em localhost. O MCP herda o mesmo origin HTTP da app.

## Rate limit e corpo

- 60 pedidos por minuto **por IP**, antes da auth, **in-memory no processo** (nó único). Tokens Bearer diferentes no mesmo IP contam no mesmo bucket. Vários nós não compartilham o contador.
- Corpo máximo: 64 KiB.
- Falha de auth: HTTP 401 genérico, igual para header ausente, Bearer malformado, vazio, curto, longo ou errado.

## Saída das tools

Trate o retorno das tools como **não confiável** (untrusted): o modelo pode interpolar texto de títulos e descrições. Não execute o conteúdo das tarefas como código ou instrução de sistema.

## Fora de escopo

Start/stop de sessão de trabalho, delete/update via MCP, OAuth, multi-usuário e Cloudflare Access.

## Teste local

```bash
export MCP_API_TOKEN=mcp-ci-test-token-not-for-production
npm run db:seed
npm run dev
npx playwright test tests/mcp
```
