# Pesquisa de mercado — produtos parecidos com o remind (nov/2026)

> Método: páginas oficiais de preço, recursos, changelog e ajuda consultadas em 06/11/2026. Quando algo veio de fonte secundária ou não pôde ser confirmado, está indicado. Preços em USD, como aparecem nos sites.

## Resumo

- O mercado se divide em três grupos: **tarefas pessoais** (Todoist, TickTick, Things, Linear, Sunsama, Akiflow, Motion, Morgen), **registro de tempo/insights** (Toggl Track, Clockify, RescueTime, Rize, Timing, EARLY) e **híbridos tarefa + tempo + foco** (TickTick, Session, Super Productivity).
- Tendência de 2026: **MCP e agentes** chegaram a Linear, Sunsama, Akiflow, Rize, Timing e Super Productivity. O remind já tem servidor MCP próprio.
- O concorrente mais próximo em proposta é o **Super Productivity** (open source: tarefas com registro de tempo, timeboxing, Pomodoro e resumo diário).
- O que os produtos pagos mais cobram (Sunsama, Akiflow: US$ 17–19/mês) são **rituais diários** (planejar e encerrar o dia), **captura rápida** e **time blocking** — tudo implementável in-app no remind.

## Situação em 2026

| Produto | Situação | Relevância |
|---|---|---|
| Todoist | Muito ativo; changelog semanal (último em 05/11/2026). | Alta |
| TickTick | Ativo; v8.0 (jan/2026) com primeira função de IA. | Alta |
| Things 3 | Ativo; 3.22–3.25 em 2025–2026. Não há "Things 4". | Média (só Apple; referência de UX) |
| Linear | Ativo; plataforma de agentes e MCP em todos os planos. | Alta (referência visual do remind) |
| Sunsama | Ativo; "Autoplan" agêntico em beta; IA e MCP no Pro. | Alta (rituais diários) |
| Akiflow | Ativo; assistente "Aki" e conector MCP no Pro. | Média/alta |
| Motion | Ativo, mas voltado a empresas ("AI Employees"). | Baixa |
| Morgen | Ativo (calendário com AI Planner). | Média (time blocking) |
| Amie | Fontes secundárias falam em pivô para notas de reunião (não confirmado). | Baixa |
| Toggl Track | Ativo. | Alta (tempo) |
| Clockify | Ativo. | Média |
| RescueTime | Ativo (Solo e Team). | Média (metas de foco) |
| Rize | Ativo; IA e servidor MCP no Pro. | Média |
| Timing (macOS) | Ativo; plano Connect com MCP. | Baixa/média |
| EARLY (ex-Timeular) | Ativo (fonte secundária). | Baixa |
| Session | Ativo (Pomodoro Mac/iOS). | Média (modo foco) |
| Super Productivity | Muito ativo, open source; v19.3.1 em 25/10/2026. | Alta (híbrido mais próximo) |

## Tabela comparativa

| Produto | Grupo | Proposta | Entrada paga (anual) | Grátis | Destaques relevantes ao remind |
|---|---|---|---|---|---|
| Todoist | Tarefas | Captura rápida e organização | US$ 5/mês | Sim | Quick Add em linguagem natural, filtros, resumo de carga do dia |
| TickTick | Tarefas/híbrido | Tarefas + Pomodoro + hábitos | US$ 49,99/ano | Sim | Focus, hábitos, Eisenhower, Kanban, foco no título da aba |
| Things 3 | Tarefas | Minimalismo pessoal (Apple) | compra única (não confirmado) | Teste | Logbook, Someday, This Evening |
| Linear | Tarefas | Issues guiadas pelo teclado | US$ 10/usuário | Sim | Cmd+K, Triage, Cycles, MCP |
| Sunsama | Tarefas/híbrido | Rituais diários e semanais | US$ 17/mês | Não | Planejar/encerrar o dia, planejado × real, objetivos da semana |
| Akiflow | Tarefas | Inbox + time blocking | US$ 19/mês | Não | Command bar com sintaxe, rituais |
| Motion | Tarefas | Agenda automática por IA | US$ 19/assento | Não | Auto-scheduling (baixa relevância) |
| Morgen | Tarefas | Calendário com AI Planner | US$ 15/mês | Não | Time blocking |
| Toggl Track | Tempo | Registro de tempo e relatórios | US$ 9/usuário | Sim | Metas de tempo, estimativas, detecção de ociosidade |
| Clockify | Tempo | Registro de tempo freemium | US$ 3,99/assento | Sim | Timesheet semanal, Pomodoro |
| RescueTime | Tempo | Registro automático e foco | US$ 7/mês | ? | Meta diária, "highlights" do dia |
| Rize | Tempo | Registro automático com IA | US$ 9,99/mês | ? | Pausas inteligentes, insights |
| Timing | Tempo | Registro automático (macOS) | US$ 168/ano (Connect) | ? | Resumos por IA, MCP |
| Session | Híbrido | Pomodoro | US$ 39,99/ano | Sim | Sessões e pausas, intenção da sessão |
| Super Productivity | Híbrido | Open source: tarefa, tempo e foco | Grátis | Sim | Worklog, timeboxing, resumo do dia, lixeira |

## O que já implementamos inspirados nesse mercado

| Feature do remind | Inspiração |
|---|---|
| Visão Tempo com indicadores, heatmap e insights em texto | Toggl Track, Timing, RescueTime |
| Cronômetro global na topbar e tempo no título da aba | Toggl Track, TickTick |
| Exportação CSV | Toggl Track, Clockify |
| Meta diária de foco com anel de progresso | RescueTime (daily target), Toggl (goals) |
| Estimativa por tarefa e estimado × realizado | Toggl/Clockify (estimates), Sunsama (planned vs actual) |
| Descarte de sessões curtas | Toggl Track (configuração de duração mínima) |
| Servidor MCP | Linear, Sunsama, Akiflow, Rize, Timing, Super Productivity |

## Features candidatas (priorizadas)

Esforço: **P** ≈ até 1 dia · **M** ≈ alguns dias · **G** ≈ uma semana ou mais. Todas respeitam o escopo da v1 (in-app, sem e-mail/push).

| # | Feature | Inspiração | Por que é útil | Esforço |
|---|---|---|---|---|
| 1 | **Ritual de início e fim do dia**: puxar atrasadas e tarefas de hoje, somar estimativas contra a meta; no fim, revisar o concluído, mandar pendências para amanhã, comparar estimado × realizado e anotar 1–3 destaques | Sunsama, Akiflow, RescueTime, Things | Fecha o ciclo planejar → executar → refletir usando o que já existe (Meu dia, meta, estimativa) | M |
| 2 | **Captura rápida em linguagem natural (PT-BR)**: `amanhã 14h #projeto !alta @etiqueta ~30min`, com prévia dos campos | Todoist, Akiflow, TickTick | Maior ganho de atrito no dia a dia; `~30min` alimenta a estimativa | M |
| 3 | **Command palette (Ctrl/Cmd+K) e atalhos** | Linear, Akiflow, Super Productivity | Combina com o estilo Linear; reaproveita o parser do item 2 | M |
| 4 | **Modo foco / Pomodoro** sobre o cronômetro atual (25/50 min, pausa sugerida, intenção opcional) | TickTick, Session, Super Productivity, Toggl | Dá ritmo e alimenta "foco profundo" e a meta diária | P/M |
| 5 | **Revisão semanal** (tempo por projeto vs semana anterior, concluídas, atrasadas, desvio de estimativa, o que levar adiante) | Sunsama, Linear Cycles, Todoist | Visão de médio prazo como ritual | M |
| 6 | **Carga do dia**: soma das estimativas de hoje vs meta/horas disponíveis, com alerta de sobrecarga | Sunsama, Todoist | Extensão direta da estimativa + meta | P |
| 7 | **Logbook / arquivamento** de concluídas após N dias, com busca no histórico | Things, Linear | Listas limpas sem perder histórico de tempo | P |
| 8 | **Kanban por status** | TickTick, Todoist, Linear | Status customizáveis já existem; quase "grátis" | M |
| 9 | **Inbox / triagem** para tarefas sem projeto/data (inclusive criadas via MCP) | Linear Triage, Things, Akiflow | Captura sem decidir na hora | P |
| 10 | **Agenda do dia / time blocking** (arrastar tarefas para horários, duração = estimativa) | Sunsama, Akiflow, Morgen, Super Productivity | Transforma lista em plano realista | G |
| 11 | **Hábitos e metas recorrentes com streak** por projeto/etiqueta | TickTick, Toggl Goals, RescueTime | Generaliza a meta diária | M |
| 12 | **Ferramentas MCP de planejamento** (`plan_day`, `extract_tasks`, resumo semanal) | Sunsama Autoplan, Todoist Extract tasks, Timing/Rize | Mais valor do MCP sem embutir IA no app | M |
| 13 | **Matriz de Eisenhower** (urgência = prazo, importância = prioridade) | TickTick, Super Productivity | Barata, sem campo novo | P |
| 14 | **Cronômetro esquecido + lixeira** ("rodando há 3h, ajustar?"; restaurar excluídas) | Toggl/Clockify, Super Productivity | Evita dados de tempo errados e exclusões acidentais | P |

**Fora de propósito:** auto-agendamento por IA estilo Motion, sync com calendários externos, e-mail como entrada de tarefas (integrações externas, fora da v1) e bloqueio de sites ou registro automático de apps (exigiria app nativo/extensão).

## Recomendação para a próxima rodada

1. **Ritual de início/fim do dia (#1) + carga do dia (#6)** — dá sentido à meta diária e à estimativa recém-criadas; é o diferencial central de Sunsama/Akiflow.
2. **Captura rápida em linguagem natural (#2) + command palette (#3)** — maior ganho de uso diário; um único parser serve aos dois.
3. **Modo foco / Pomodoro (#4)** — custo baixo sobre o cronômetro global e melhora os indicadores existentes.
4. Se sobrar tempo: **Logbook (#7)**, **Inbox (#9)** e **cronômetro esquecido (#14)**.

Revisão semanal (#5) e time blocking (#10) ficam melhores depois que o ritual diário gerar dados de destaques e desvio de estimativa.

## Pontos não confirmados

Preço do Things 3; shutdown/revisão semanal do Sunsama (só reviews e roadmap público); datas do changelog 2026 do TickTick (agregadores); pivô do Amie; preços do Motion (conflitantes); intenção/reflexão do Session; "focus score" do Rize; dados do EARLY; licença do Super Productivity.

## Fontes principais

- Todoist: https://www.todoist.com/pricing · https://www.todoist.com/help/articles/2026-changelog-HD3jJAtLd
- TickTick: https://ticktick.com/about/upgrade · https://ticktick.com/features · https://releasebot.io/updates/ticktick (secundária)
- Things: https://culturedcode.com/things/ · https://culturedcode.com/things/blog/
- Linear: https://linear.app/pricing
- Sunsama: https://www.sunsama.com/pricing · https://help.sunsama.com/docs/daily-planning · https://roadmap.sunsama.com/improvements/p/show-how-much-time-was-spent-on-each-objective-in-weekly-review
- Akiflow: https://akiflow.com/pricing · https://akiflow.com/features
- Motion: https://www.usemotion.com/pricing
- Morgen: https://www.morgen.so/pricing
- Toggl Track: https://toggl.com/track/pricing/
- Clockify: https://clockify.me/pricing
- RescueTime: https://www.rescuetime.com/pricing
- Rize: https://rize.io/pricing
- Timing: https://timingapp.com/pricing
- Session: https://www.stayinsession.com/pricing
- Super Productivity: https://super-productivity.com/ · https://github.com/super-productivity/super-productivity/releases
