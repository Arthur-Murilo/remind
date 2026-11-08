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
- Mobile: sidebar em drawer entre 768px e 959px; telefone ≤767px no Meu dia usa cards, bottom sheet, FAB e bottom nav. Desktop ≥1200px mantém tabela + modal.
- Empty state do Meu dia no telefone: título “Nada para hoje”; corpo sobre criar tarefas com prazo de hoje; CTA Nova tarefa.
- Status e Prioridade de sistema protegidos; extras criáveis, recoloríveis e excluíveis. Prioridades (sistema e extras) têm ordem persistida por arrastar no menu; a lista de tarefas segue essa ordem. Prazo continua data.
- Subtarefas não fecham a tarefa pai; concluir a pai marca as subtarefas como concluídas.
- Subtarefas começam recolhidas; a linha mostra um aviso discreto com a contagem.
- Meu dia lista só tarefas abertas com prazo de hoje ou atrasadas; o restante fica nos projetos ou em Abertas.
- Lembretes in-app só avisam no dia do prazo (amarelo) ou atrasadas (vermelho); prazos futuros não entram no sininho.
- Containerização e Deploy: Next.js compilado em modo `output: "standalone"`, Dockerfile multi-stage com Alpine, usuário não-root, docker-entrypoint com auto-schema/seed (falha de init interrompe o boot) e Docker Compose com Postgres bound a `127.0.0.1`. `POSTGRES_PASSWORD`, `SEED_USER_EMAIL` e `SEED_USER_PASSWORD` vêm obrigatoriamente do `.env`; o seed cria o usuário só se o e-mail ainda não existir. A imagem runner copia `node_modules/postgres` além do standalone, porque `scripts/init-db.mjs` não entra no file tracing do Next.js.
- Integração Contínua (CI): GitHub Actions em `.github/workflows/ci.yml` com typecheck, build, container Postgres de serviço, testes E2E Playwright e contrato/smoke MCP (`MCP_API_TOKEN` de teste).
- MCP Agent Access: Streamable HTTP em `/api/mcp`, token só no `.env` do servidor, usuário dono único (`MCP_USER_EMAIL` ou seed). Tools: `list_tasks`, `create_task`, `create_subtask`, `get_time_report`.

## Prioridades Atuais

1. Manter a suite de tipos e compilação limpa (`npm run typecheck`).
2. Iterar em feedbacks de UX do usuário.

## Validação E2E (2026-08-14)

- Bateria TestSprite MCP: **30/30 Passed** (Batch 1 login/dashboard + Batch 2 CRUD/filtros/recorrência/lembretes/subtarefas/tags).
- Relatório: `testsprite_tests/testsprite-mcp-test-report.md`.
- Nenhum bug de produto encontrado nessa rodada.

## Decisões UX (2026-09-12)

- Piloto Meu dia no telefone (≤767): cards agrupados em Atrasadas / Hoje, FAB +, sheet parcial (criar) e full-height (editar), bottom nav com ícones claros e estado ativo em pílula.
- Formulário de tarefa extraído para `TaskForm`; casca `TaskDialog` vira modal no desktop e sheet no telefone.
- Projetos e Mais no telefone são rotas simples (`/app/projetos`, `/app/mais`); Tempo reutiliza a rota existente.

## Decisões UX (2026-08-14)

- Exclusão permanente com cascade em projeto; confirmação em diálogo para tarefa e projeto.
- Edição inline: Status, Prioridade, Prazo, Etiqueta, Projeto; modal para título/descrição/recorrência.
- Coluna **Etiqueta** na lista; glossário em `CONTEXT.md`.
- Subtarefas inline sob a linha (sem modal).
- Larguras de coluna persistidas em `localStorage`.
- Marca padrão: sino + plus em círculo azul (`LogoMark`); favicon via `src/app/favicon.ico` e `src/app/icon.tsx`.

## Refino operacional (2026-08-14)

- Controles unificados em `ui-controls.tsx`: `SelectPopover`, `DateField`, `CustomCheckbox` (portal, Escape, hidden inputs).
- Filtros com popovers + chips removíveis + “Limpar filtros”.
- Criação rápida (título/projeto) + “Detalhes” para formulário completo; etiquetas só após criar.
- `repeatSubtasks` condicional (checkbox quadrado, default marcado) respeitado nas Server Actions.
- Métricas em faixa compacta (sem emojis); menu ⋯ de projeto com ícones; subtarefas estilo Asana com confirmação de exclusão.
- Autorização reforçada: `projectId` e `tagIds` validados por dono em create/update/set tags.

## Decisões (2026-11-06) — Tempo, fuso e segurança

- `APP_TIMEZONE` (padrão `America/Sao_Paulo`) é aplicado na conexão Postgres (`TimeZone`) e no container (`TZ`). Todo "hoje" e todo limite de período vem do SQL (`current_date`, `date_trunc`), nunca de `new Date()` no servidor.
- Visão Tempo usa `src/server/time-insights.ts` (`getTimeInsights`): período + `offset` (≤ 0), recorte das sessões nos limites do período, comparação com o mesmo trecho decorrido do período anterior, linha do tempo por hora/dia, heatmap de 8 semanas, distribuição por projeto/tarefa/etiqueta e insights em texto. `getTimeReport` (MCP) é um adaptador sobre ele.
- Exportação CSV em `/app/tempo/export` (sessão obrigatória, `;` + BOM para Excel pt-BR, proteção contra injeção de fórmula).
- Sessão manual e edição aceitam data + hora de início no fuso do app; duração entre 1 min e 24 h.
- Cronômetro global na topbar (`RunningTimer`), com tempo no título da aba.
- Cor de projeto = índice pela ordem de criação (`colorIndex`/`projectColorIndex`) em `src/domain/project-colors.ts`.
- Login: rate limit in-memory só de falhas (20/15 min por IP, 8/15 min por e-mail), hash fictício para e-mail inexistente, mensagens de erro por código (`?error=invalid|missing|rate_limited`), cookie `Secure` quando `APP_URL` é https, limpeza de sessões expiradas no login.
- Cabeçalhos de segurança globais em `next.config.ts` (nosniff, DENY, Referrer-Policy, Permissions-Policy, CSP `frame-ancestors/base-uri/form-action/object-src`).
- Índices: `tasks(owner_id, due_date)`, `tasks(project_id)`, `subtasks(task_id)`, `task_tags(tag_id)`, `projects(owner_id)`, `sessions(expires_at)`, `work_sessions(task_id)`.

## Decisões (2026-11-06, rodada 2) — meta, estimativa e sessão

- Meta diária de foco em `users.daily_focus_goal_minutes` (padrão 240, limites 15 min–16 h). Anel no Meu dia (pill no desktop, card no telefone), editável por popover; na visão Tempo vira o indicador "Meta diária" (dias batidos no período) e uma linha tracejada no gráfico diário.
- Estimativa por tarefa em `tasks.estimate_minutes` (nullable). Entrada livre: `1h30`, `90`, `45min`, `1:30`, `1,5h` (`parseEstimateMinutes`). Formulários sem o campo mantêm o valor (`estimate` ausente no FormData = não altera). Linha mostra `tempo / estimativa`, âmbar quando estoura. Tempo tem o card "Estimado × realizado" (tempo total da tarefa) e insight pela mediana realizado/estimado das concluídas (mínimo 2).
- Sessões de cronômetro com menos de 60 s são apagadas ao parar ou ao trocar de tarefa. Antigas abaixo de 60 s só ficam fora da lista/contagem do Tempo (não são apagadas do banco).
- `sessions.id` guarda SHA-256 do token do cookie (token de 32 bytes aleatórios, base64url). O `init-db` remove ids antigos (comprimento ≠ 64), o que desconecta todos uma vez.
- Pesquisa de mercado em `docs/pesquisa-mercado.md`; próxima rodada recomendada: ritual de início/fim do dia + carga do dia, captura em linguagem natural + command palette, modo foco/Pomodoro.

## Decisões (2026-11-06, rodada 3) — ritual, captura, paleta e foco

- Captura em linguagem natural pt-BR em `src/domain/quick-parse.ts` (função pura, testada em `tests/quick-parse.spec.ts`): hoje/amanhã/depois de amanhã, dia da semana por extenso (sem abreviações: "ter", "seg" são palavras comuns), `dd/mm[/aaaa]`, `dia N`, `semana que vem`, `em N dias`, `#projeto`, `!alta|!1|!rótulo`, `@etiqueta`, `~45min`, `todo dia/toda semana/todo mês`. Horário fica no título (prazo é só data). Usada na captura rápida do Meu dia/projeto e na paleta.
- Paleta de comandos (`Ctrl/Cmd+K` ou `/`) em `src/components/command-palette.tsx`: criar com sintaxe, navegar, projetos, parar cronômetro, foco; busca de tarefas abertas por `searchTasksAction`. "Criar" só fica em primeiro quando há marcadores ou nada mais casa.
- Modo foco/Pomodoro (25/5 e 50/10): estado em `localStorage` (`src/lib/focus-store.ts`), tempo real continua sendo Sessão de trabalho. Fim do foco para o cronômetro e abre a pausa; fim da pausa oferece outro foco. Contagem na topbar e no título da aba; painel minimizável.
- Ritual do dia em `/app/dia` (`src/server/daily-ritual.ts`): Planejar (carga = registrado hoje + restante das estimativas da pauta × meta, pauta com estimativa editável/Foco/Concluir/Amanhã, sugestões para puxar, intenção) e Encerrar (meta, estimado × realizado do dia, pendências → amanhã, até 3 destaques). Tabela `daily_notes (user_id, day)`. Sem escolha explícita, abre Encerrar a partir das 17h.
- `tasks.completed_at` = última conclusão (inclusive ciclos de rotina, que voltam para "todo"); backfill com `updated_at` para concluídas antigas.
- Meu dia mostra pill "Planejar o dia / Carga / Encerrar o dia" com as horas previstas (âmbar acima da meta).

## Restrições

- Toda a documentação humana deve ficar em português.
- O desenho da arquitetura precisa refletir apenas componentes realmente presentes no bootstrap.

## Decisões (2026-11-06, rodada 4) — auditoria de segurança

- Dependências: `next` 16.4.5, `@modelcontextprotocol/sdk` 1.32.2, `zod` 4.6.7 (major; os schemas do MCP usam só a API básica e o SDK aceita `^3.25 || ^4.0`). Transitivas corrigidas por `npm audit fix`. `npm audit` = 0.
- Lembretes: `updateTask` só sincroniza lembrete se a tarefa for do dono; `syncReminder` apaga e faz upsert só com `user_id` do dono; `getReminders` também filtra `t.owner_id`.
- IP para rate limit (login e MCP): `cf-connecting-ip` → `x-real-ip` → último valor de `x-forwarded-for`. Mapa do rate limit MCP tem limpeza acima de 5000 chaves.
- Cookie de sessão `Secure` quando `APP_URL` é https ou em produção com `APP_URL` vazio/localhost (caso Cloudflare Tunnel). HSTS `max-age=31536000` sem `includeSubDomains`.
- Seed em produção recusa criar usuário com `remind123` ou senha < 12 caracteres; se o usuário já existe, só avisa no log.
- Scans: `sast-mcp-server` (semgrep + gitleaks) e `npm audit`. Falsos positivos documentados: chaves de localStorage (`// gitleaks:allow` na árvore, `.gitleaksignore` no histórico, `.sast-mcp-ignore.json` no MCP) e `dateRule` (`// nosemgrep`). `.sast-mcp-cache/` fica fora do git.
