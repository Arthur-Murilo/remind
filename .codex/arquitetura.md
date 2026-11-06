# Arquitetura do Projeto

## Visão Geral

`remind` será um aplicativo web full-stack construído com Next.js, TypeScript e PostgreSQL. A aplicação concentra frontend, rotas de backend, autenticação simples, regras de negócio e persistência no mesmo repositório.

## Módulos da V1

- Autenticação por sessão
- Gestão de projetos
- Gestão de tarefas
- Filtros operacionais de tarefas
- Lembretes in-app
- Catálogos de status e prioridade definidos pelo usuário, com ordem persistida nas prioridades
- Sessões de trabalho, cronômetro global e visão Tempo com insights (`src/server/time-insights.ts`) e exportação CSV (`/app/tempo/export`)
- MCP Streamable HTTP em `/api/mcp` (Bearer `MCP_API_TOKEN`, quatro tools fechadas)

## Limites

- Não há integrações externas de notificação nesta fase.
- Não há colaboração avançada, comentários, papéis complexos ou workflows corporativos.
- O produto atende primeiro um único usuário, mas deve aceitar evolução controlada para equipe pequena.

## Fluxo de Dados

1. O usuário autentica na aplicação.
2. A interface consulta projetos e tarefas no backend do próprio app.
3. Os filtros reduzem a visão operacional por projeto, status, prioridade, prazo e busca textual.
4. Os lembretes são derivados de tarefas com prazo para hoje ou atrasadas e exibidos no app.
5. O PostgreSQL armazena usuários, sessões de autenticação, projetos, tarefas, lembretes, etiquetas, catálogos e sessões de trabalho.

## Convenções Técnicas

- Fuso horário: `APP_TIMEZONE` é aplicado na conexão Postgres; regras de "hoje" e limites de período são calculados no SQL.
- Sessão de login: o banco guarda só o SHA-256 do token do cookie.
- Ritual diário em `src/server/daily-ritual.ts` + `daily_notes`; parser de captura em `src/domain/quick-parse.ts` (sem dependência de servidor, reutilizado no cliente); modo foco é estado de cliente (`localStorage`) sobre as Sessões de trabalho.
- Meta diária (`users.daily_focus_goal_minutes`) e estimativa (`tasks.estimate_minutes`) alimentam Meu dia e Tempo.
- Cor de projeto é derivada da ordem de criação (`src/domain/project-colors.ts`), igual em sidebar, listas e gráficos.

- Componentes de interface e rotas do app ficam no espaço do Next.js App Router.
- Operações de leitura e escrita devem passar por uma camada explícita de domínio/serviço.
- A modelagem de domínio inclui `User`, `Project`, `Task`, `Subtask`, `Etiqueta`, `Reminder`, `TaskFilter`, `CatalogItem` e `Sessão de trabalho`.
- Os contratos visíveis ao usuário permanecem em português.
- A distribuição em produção e VPS é realizada via Docker (multi-stage standalone) e orquestrada por Docker Compose: Postgres acessível só em localhost da VPS (rede interna entre containers), credenciais de seed e senha do banco lidas do `.env`, healthchecks no banco e na aplicação.
- Agentes acessam o mesmo processo Next.js em `/api/mcp` (Streamable HTTP + Bearer). Não há serviço MCP separado. Rate limit in-memory (nó único).
- A integração contínua (CI) é executada no GitHub Actions cobrindo validação de tipos, build, execução do schema em PostgreSQL de serviço, testes E2E com Playwright e compilação da imagem Docker.

## Referência Visual e de Arquitetura

- Documento estratégico: `PRODUCT.md`
- Documento visual: `DESIGN.md`
- Diagrama técnico: `docs/arquitetura-remind.drawio`
