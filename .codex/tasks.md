# Tarefas do Agente

## Tarefa Atual

### Tarefa
Auditoria de segurança com o skill `security-checklist` e correção dos alertas do Dependabot.

### Objetivo
Rodar SAST, secrets e SCA no repositório inteiro, corrigir achados críticos, altos e médios sem quebrar o sistema e fechar os alertas do Dependabot (next, @modelcontextprotocol/sdk, zod e transitivas).

### Subtarefas
- [x] Scans: semgrep, gitleaks (árvore e histórico), npm audit, via sast-mcp-server quando possível.
- [x] Atualizar `next` para versão corrigida.
- [x] Atualizar `@modelcontextprotocol/sdk` (puxa hono, @hono/node-server, body-parser, proxy-addr, ip-address, fast-uri).
- [x] Avaliar `zod` (alerta #29/#30): patch na 3.x ou migração para 4.x.
- [x] Atualizar `source-map-js` e demais transitivas restantes.
- [x] Corrigir achados de código críticos, altos e médios.
- [x] Validar: typecheck, build, E2E, contrato MCP e re-scan.
- [x] Relatório de segurança.

### Status
Concluída (sem commit, no branch `fix/security-checklist`). `npm audit` 0; semgrep 0 em `src`/`scripts`; gitleaks 0 na árvore e no histórico; typecheck, build e E2E 60/60 ok. Corrigidos: dependências (2 críticas, 5 altas e 5 médias no `npm audit`), IDOR em lembretes, IP forjável no rate limit do MCP, cookie sem `Secure` em produção, HSTS e senha fraca no seed de produção.

### Bloqueios
Nenhum.

### Próximos Passos
Baixos pendentes (não corrigidos por escopo): teto de falhas por e-mail permite trancar o dono, erro do Postgres vaza no MCP com data inválida (`2026-02-30`), Server Actions sem limite de tamanho de texto. Endurecimento: role do Postgres sem superusuário. Conferir se a senha de produção não é `remind123`. Fechar os PRs do Dependabot depois do merge.

---

## Tarefa Anterior (-3)
Monitoramento de erros com Sentry (SaaS, plano gratuito) no Remind.

### Objetivo
Capturar erros de servidor e de navegador em produção sem enviar dados pessoais (tarefas, e-mails, cookies) e sem abrir porta nova no servidor. Não é notificação de lembretes: o escopo in-app da v1 não muda.

### Subtarefas
- [x] Instalar `@sentry/nextjs` 11.11.0 (via container node em cópia temporária; `node_modules` do host é de root). Lockfile: só adições (90 pacotes), nada removido ou atualizado.
- [x] `src/instrumentation.ts` (servidor/edge + `onRequestError`), `src/instrumentation-client.ts` e `src/app/global-error.tsx`.
- [x] `src/lib/sentry-options.ts`: só erros, `sendDefaultPii: false`, `beforeSend` remove cookies/headers/body/query/user, `beforeBreadcrumb` descarta console.
- [x] `next.config.ts` com `withSentryConfig` importado de `@sentry/nextjs/config` (v11 moveu o export). Sem upload de source maps até existir `SENTRY_AUTH_TOKEN`.
- [x] Dockerfile (ARG `NEXT_PUBLIC_SENTRY_DSN`), compose (build arg + `SENTRY_DSN`) e `.env-example`.
- [x] `docker build` da imagem real passa (inclui typecheck do Next).
- [x] DSN do projeto `remind` colocado no `.env`; `dataCollection` explícito (tudo desligado) porque o SDK v11 coleta tudo por padrão.
- [ ] Verificar envio real de um evento e o scrub (teste com endpoint local foi negado pelo classificador de permissões; ficou para o teste com DSN real).
- [x] Atualizar `.codex/*`.

### Status
Código pronto, sem commit. Build da imagem ok. Envio de evento ainda não verificado.

### Bloqueios
DSN do projeto no Sentry (o usuário cria o projeto e cola no `.env`).

### Próximos Passos
Usuário: criar projeto Next.js no Sentry, colocar DSN no `.env`, rebuild e disparar erro de teste.

---

## Tarefa Anterior (-1)

### Tarefa
Terceira rodada: ritual de início/fim do dia com carga, captura em linguagem natural + paleta Ctrl+K, modo foco/Pomodoro; revisão completa do código e testes nas páginas.

### Objetivo
Implementar as três recomendações da pesquisa de mercado (`docs/pesquisa-mercado.md`) dentro do escopo in-app da v1 e fechar com uma revisão geral de qualidade.

### Subtarefas
- [x] Parser pt-BR (`src/domain/quick-parse.ts`): hoje/amanhã/dia da semana/dd/mm, `#projeto`, `!prioridade`, `@etiqueta`, `~estimativa`, recorrência.
- [x] Captura rápida com prévia dos campos reconhecidos.
- [x] Paleta de comandos (Ctrl/Cmd+K): criar, navegar, cronômetro, foco.
- [x] `tasks.completed_at` para saber o que foi concluído no dia.
- [x] `daily_notes` (intenção, destaques, planejado/encerrado) e página `/app/dia` com Planejar e Encerrar.
- [x] Carga do dia (soma das estimativas × meta) no Meu dia e no Planejar.
- [x] Modo foco/Pomodoro (25/50 min, pausa, aviso sonoro, contagem na topbar e na aba).
- [x] Revisão de código de todo o diff (subagente independente) e correções.
- [x] Typecheck, E2E, build e navegação manual pelas páginas (desktop e telefone).
- [x] Atualizar `.codex/*`, `DESIGN.md`, `CONTEXT.md`, diagrama.

### Status
Concluída (sem commit; aguardando revisão do usuário). Revisão independente encontrou 12 problemas (5 médios, 7 baixos), todos corrigidos. E2E 60/60, build ok, páginas conferidas no desktop e no telefone.

### Bloqueios
Nenhum. Observação: prazo continua sendo só data; horário digitado ("14h") fica no título.

### Próximos Passos
Candidatos da pesquisa: revisão semanal, logbook/arquivo, inbox de triagem, aviso de cronômetro esquecido, time blocking.

---

## Tarefa Anterior (-2)

### Tarefa
Segunda rodada: meta diária de foco, estimativa por tarefa, hash do id de sessão, descarte de sessões curtas e pesquisa de mercado.

### Objetivo
Fechar as sugestões da rodada anterior e mapear produtos parecidos (tarefas, time tracking, foco) para orientar as próximas features, mantendo o escopo in-app da v1.

### Subtarefas
- [x] Pesquisa de mercado (subagente) → `docs/pesquisa-mercado.md`.
- [x] Descartar sessões de cronômetro com menos de 1 min ao parar ou trocar de tarefa.
- [x] Guardar só SHA-256 do id de sessão de login (desconecta sessões antigas uma vez).
- [x] `tasks.estimate_minutes`: campo no formulário, chip na linha e card "Estimado × realizado" no Tempo.
- [x] `users.daily_focus_goal_minutes`: anel de progresso no Meu dia (editável) e dias com meta batida no Tempo.
- [x] Validar typecheck, E2E, build e navegador.
- [x] Atualizar `.codex/*`, `DESIGN.md` e `CONTEXT.md` (diagrama sem mudança estrutural nesta rodada: só colunas novas).

### Status
Concluída (sem commit; aguardando revisão do usuário). E2E 47/47, build ok.

### Bloqueios
Nenhum.

### Próximos Passos
Próxima rodada sugerida em `docs/pesquisa-mercado.md`: ritual de início/fim do dia + carga do dia; captura em linguagem natural + command palette; modo foco/Pomodoro.

---

## Tarefa Anterior (-1)

### Tarefa
Rodada de melhorias: Tempo com insights, fuso horário, segurança, performance e UX.

### Objetivo
Transformar a visão Tempo em uma superfície de análise (inspirada em Toggl Track, Clockify, RescueTime e Timing), corrigir o uso de fuso UTC nas regras de "hoje" e endurecer segurança e performance sem sair do escopo da v1.

### Subtarefas
- [x] Ler contexto obrigatório e auditar código, banco local e telas no navegador.
- [x] Fuso horário: `APP_TIMEZONE` (default `America/Sao_Paulo`) aplicado à conexão Postgres; limites de período calculados no SQL.
- [x] Tempo — navegação de período (anterior/próximo/atual) e comparação com o período anterior.
- [x] Tempo — indicadores: total, média por dia ativo, dias ativos, sessão média/maior, foco profundo (sessões ≥ 25 min).
- [x] Tempo — linha do tempo (barras empilhadas por projeto por dia; por hora na visão Dia).
- [x] Tempo — mapa de calor dia da semana × hora (últimas 8 semanas).
- [x] Tempo — distribuição em barras horizontais com % (projeto, tarefa, etiqueta).
- [x] Tempo — insights automáticos em texto.
- [x] Tempo — sessões agrupadas por dia com início–fim e total do dia; exportação CSV.
- [x] Cronômetro global na topbar (tarefa + tempo correndo + parar) e tempo no título da aba.
- [x] Segurança: cookie `secure` em produção, rate limit de login, tempo constante no login, limpeza de sessões expiradas, cabeçalhos de segurança, escape de `%`/`_` na busca.
- [x] Performance: índices (tasks, subtasks, task_tags, work_sessions.task_id) e métricas do painel em uma query.
- [x] Validar typecheck, build e navegador (desktop e telefone). E2E 46/46.
- [x] Atualizar `.codex/memory.md`, `.codex/arquitetura.md`, `DESIGN.md` e `.env-example`.

### Status
Concluída (sem commit; aguardando revisão do usuário).

### Bloqueios
Nenhum.

### Próximos Passos
Concluir validação (E2E e build) e revisar com o usuário as propostas de próxima rodada (meta diária, estimativa por tarefa, hash do id de sessão).

---

## Tarefa Anterior (0)

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
