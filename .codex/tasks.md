# Tarefas do Agente

## Tarefa Atual

### Tarefa
Adotar o novo ícone (sino + plus) como marca padrão do remind.

### Objetivo
Usar o ícone criado pelo usuário no favicon (aba do navegador) e em todos os pontos de marca da UI (login, sidebar, topbar).

### Subtarefas
- [x] Copiar o `.ico` para `src/app/favicon.ico`.
- [x] Atualizar `LogoMark` para o glifo sino + plus.
- [x] Alinhar `src/app/icon.tsx` (favicon gerado) ao novo desenho.
- [x] Atualizar referências em `DESIGN.md` e `.codex/memory.md`.
- [x] Ajustar `.brand-mark` no CSS para o círculo do ícone.
- [x] Integrar com `origin/main` e resolver conflito em `.codex/tasks.md`.

### Status
Concluída.

### Bloqueios
Nenhum.

### Próximos Passos
Nenhum.

---

## Tarefa Anterior

### Tarefa
Preparar e validar MCP + Docker no ambiente (token/e-mail no `.env`).

### Objetivo
Analisar a melhoria MCP já mergeada, conferir specs/docs/compose, deixar o stack Docker pronto e orientar as duas variáveis `MCP_API_TOKEN` e `MCP_USER_EMAIL`.

### Subtarefas
- [x] Ler contexto obrigatório (`.codex/*`, `PRODUCT.md`, `DESIGN.md`).
- [x] Cruzar specs MCP (`.specs`, `docs/mcp.md`) com código, compose e `.env-example`.
- [x] Validar typecheck (`tsc --noEmit` via Node 22) e `docker compose config`.
- [x] Preparar `.env` com chaves MCP (vazias; usuário preenche token/e-mail).
- [x] Rebuild/`docker compose up --build -d`; app e Postgres healthy; `/api/mcp` responde 401 sem token.

### Status
Concluída (aguardando o usuário preencher `MCP_API_TOKEN` e opcionalmente `MCP_USER_EMAIL`, depois reiniciar o app).

### Bloqueios
Nenhum.

### Próximos Passos
Usuário define as duas envs no `.env` e roda `docker compose up -d --force-recreate app`.

---

## Tarefa Anterior (2)

### Tarefa
Implementar o piloto de UX **Meu dia (telefone)** a partir do Figma e das decisões travadas.

### Objetivo
Em viewports ≤767px, Meu dia passa a cards + bottom sheet + bottom nav + FAB, sem regressão da tabela/modal no desktop. Sem novas regras de negócio.

### Subtarefas
- [x] Ler contexto obrigatório (`.codex/*`, `PRODUCT.md`, `DESIGN.md`) e o Figma (frames 01–04 + tokens).
- [x] Mapear shell, lista de tarefas e modais atuais.
- [x] Extrair `TaskForm` compartilhado; casca `TaskDialog` (sheet no telefone, modal no desktop).
- [x] Cards/stack no Meu dia ≤767; grupos Atrasadas / Hoje; empty state acordado.
- [x] Bottom nav (Meu dia / Projetos / Tempo / Mais) com polish e ícones claros.
- [x] FAB +; menu ⋯ (Editar / Concluir / Excluir); sem swipe.
- [x] Safe-area, alvos ≥44px, inputs ≥16px no telefone.
- [x] Projetos/Mais como rotas simples; Tempo reutiliza a rota existente.
- [x] Smoke Playwright no viewport de telefone.
- [x] Typecheck, E2E e verificação visual; abrir PR.

### Status
Concluída.

### Bloqueios
Nenhum.

### Próximos Passos
Nenhum.

---

## Tarefa Anterior (3)

### Tarefa
Resolver conflitos de merge do PR de segurança solicitado em comentário.

### Objetivo
Sincronizar o branch do PR com `main`, resolver conflitos preservando os upgrades de segurança e validar que o projeto continua íntegro.

### Subtarefas
- [x] Ler contexto obrigatório (`.codex/*`, `PRODUCT.md`, `DESIGN.md`).
- [x] Inspecionar estado do git e identificar branch base padrão.
- [x] Executar merge de `main` no branch atual e resolver conflitos.
- [x] Validar com `npm run typecheck` e tentar `npm run build` (falha de rede ao baixar Google Fonts no ambiente).
- [ ] Responder ao comentário no PR com o commit de resolução.

### Status
Em andamento (pendência externa de comentário no PR).

### Bloqueios
Build depende de acesso externo a `fonts.googleapis.com` no ambiente de execução.

### Próximos Passos
Finalizar resposta ao comentário no PR quando solicitado.
