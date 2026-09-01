# Memória do Projeto

## Resumo Durável

- O projeto `remind` nasce como uma ferramenta interna de gestão de projetos e tarefas.
- A primeira versão é focada em uso individual, com limite operacional de até 10 usuários.
- O produto deve priorizar clareza, velocidade de navegação e organização prática do trabalho.

## Decisões Ativas

- Stack base: Next.js + TypeScript + App Router + PostgreSQL.
- O backend permanece integrado na própria aplicação.
- A autenticação da v1 será simples, baseada em sessão.
- O escopo inicial cobre projetos, tarefas, filtros, lembretes in-app por sininho na topbar, subtarefas (1 nível) e tags.
- Efeito sonoro de conclusão gerado nativamente via Web Audio API.
- Modais interativos para edição de tarefa (ícone de lápis) e criação de novos projetos.
- Notificações de lembretes via sininho no canto superior direito da topbar.
- Suíte de testes E2E automatizada com Playwright (`npm run test:e2e`), rodando Chromium de forma legível e garantindo login, criação via modal, edição com fechamento de modal e status.
- Suporte a Tarefas Recorrentes (Rotinas estilo Google Tasks): repetição `daily`, `weekly`, `monthly` com opção de resetar subtarefas a cada ciclo da rotina.
- Sessão de trabalho: timer na tarefa (uma aberta por vez), edição manual e visão Tempo (dia/semana/mês; gráfico agrupável por projeto ou tarefa).
- Mobile: sidebar em drawer abaixo de 960px; lista empilhada abaixo de 720px.
- Status e Prioridade de sistema protegidos; extras criáveis, recoloríveis e excluíveis. Prazo continua data.
- Containerização e Deploy: Next.js compilado em modo `output: "standalone"`, Dockerfile multi-stage com Alpine, usuário não-root, docker-entrypoint com auto-schema/seed (falha de init interrompe o boot) e Docker Compose com Postgres bound a `127.0.0.1`. `POSTGRES_PASSWORD`, `SEED_USER_EMAIL` e `SEED_USER_PASSWORD` vêm obrigatoriamente do `.env`; o seed cria o usuário só se o e-mail ainda não existir. A imagem runner copia `node_modules/postgres` além do standalone, porque `scripts/init-db.mjs` não entra no file tracing do Next.js.
- Integração Contínua (CI): GitHub Actions em `.github/workflows/ci.yml` com typecheck, build, container Postgres de serviço e testes E2E Playwright.

## Prioridades Atuais

1. Manter a suite de tipos e compilação limpa (`npm run typecheck`).
2. Iterar em feedbacks de UX do usuário.

## Validação E2E (2026-08-14)

- Bateria TestSprite MCP: **30/30 Passed** (Batch 1 login/dashboard + Batch 2 CRUD/filtros/recorrência/lembretes/subtarefas/tags).
- Relatório: `testsprite_tests/testsprite-mcp-test-report.md`.
- Nenhum bug de produto encontrado nessa rodada.

## Decisões UX (2026-08-14)

- Exclusão permanente com cascade em projeto; confirmação em diálogo para tarefa e projeto.
- Edição inline: Status, Prioridade, Prazo, Etiqueta, Projeto; modal para título/descrição/recorrência.
- Coluna **Etiqueta** na lista; glossário em `CONTEXT.md`.
- Subtarefas inline sob a linha (sem modal).
- Larguras de coluna persistidas em `localStorage`.
- Favicon via `src/app/icon.tsx`.

## Refino operacional (2026-08-14)

- Controles unificados em `ui-controls.tsx`: `SelectPopover`, `DateField`, `CustomCheckbox` (portal, Escape, hidden inputs).
- Filtros com popovers + chips removíveis + “Limpar filtros”.
- Criação rápida (título/projeto) + “Detalhes” para formulário completo; etiquetas só após criar.
- `repeatSubtasks` condicional (checkbox quadrado, default marcado) respeitado nas Server Actions.
- Métricas em faixa compacta (sem emojis); menu ⋯ de projeto com ícones; subtarefas estilo Asana com confirmação de exclusão.
- Autorização reforçada: `projectId` e `tagIds` validados por dono em create/update/set tags.

## Restrições

- Toda a documentação humana deve ficar em português.
- O desenho da arquitetura precisa refletir apenas componentes realmente presentes no bootstrap.
