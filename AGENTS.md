# AGENTS

## Objetivo do Projeto

`remind` é uma ferramenta interna de gestão de projetos e tarefas, pensada para uso individual inicial e expansão controlada para até 10 pessoas. O foco da primeira versão é organizar projetos, tarefas, filtros operacionais e lembretes somente dentro da aplicação.

## Stack Oficial

- Next.js com App Router
- TypeScript
- PostgreSQL
- Persistência e acesso a dados no próprio backend da aplicação
- Autenticação simples por sessão para equipe pequena

## Ordem de Leitura Obrigatória

Antes de iniciar qualquer trabalho, o agente deve ler nesta ordem:

1. `.codex/tasks.md`
2. `.codex/memory.md`
3. `.codex/arquitetura.md`
4. `.codex/lessons.md`
5. `PRODUCT.md`
6. `DESIGN.md`

## Regras de Execução

- Toda documentação humana do projeto deve permanecer em português.
- Os identificadores internos podem permanecer em inglês quando isso melhorar clareza técnica e manutenção.
- Mudanças devem respeitar o escopo da v1: projetos, tarefas, filtros, autenticação simples e lembretes in-app.
- Não introduzir integrações externas de notificação nesta fase.
- O diagrama de arquitetura em `docs/arquitetura-remind.drawio` é parte da fonte de verdade e deve acompanhar mudanças estruturais relevantes.

## Protocolo Operacional Obrigatório

Antes de qualquer mudança relevante, o agente deve atualizar `.codex/tasks.md` com:

- tarefa;
- objetivo;
- subtarefas;
- status;
- bloqueios;
- próximos passos.

O registro em `.codex/tasks.md` deve ser sempre granular, separando tarefas e subtarefas de forma visível.

## Arquivos de Contexto

- `.codex/memory.md`: decisões duráveis, fatos estáveis e prioridades ativas.
- `.codex/lessons.md`: aprendizados retrospectivos e erros evitáveis.
- `.codex/tasks.md`: quadro operacional do trabalho em curso.
- `.codex/arquitetura.md`: visão textual da arquitetura, módulos, limites e convenções.

## Convenções Iniciais do Produto

- Superfície principal: ferramenta interna operacional.
- Público inicial: uso individual, com suporte futuro para equipe pequena.
- Lembretes: somente leitura e exibição in-app na v1.
- Autenticação: login simples por sessão.
- Idioma da interface: português.

## Cursor Cloud specific instructions

Contexto durável para agentes rodando neste ambiente (o update script já instalou as dependências Node).

### Banco de dados (PostgreSQL)

- O app exige PostgreSQL acessível via `DATABASE_URL` (ver `.env`, modelado por `.env-example`). O `.env` NÃO é versionado (`.gitignore`), então recrie-o a partir do `.env-example` caso não exista.
- Neste ambiente o Postgres é instalado como serviço do sistema (não via Docker; o `docker-compose.yml` existe mas o Docker não está presente por padrão). Ele NÃO sobe sozinho no boot; inicie manualmente com: `sudo pg_ctlcluster 16 main start`.
- Credenciais/banco esperados pelo `.env`: usuário `postgres`, senha `postgres`, banco `remind` em `localhost:5432`. Se o banco/senha não existirem, crie-os (`ALTER USER postgres WITH PASSWORD 'postgres';` e `CREATE DATABASE remind;` via `sudo -u postgres psql`).
- Após o Postgres estar de pé, aplique o schema e o seed: `npm run db:seed` (idempotente; também há `npm run db:init` só para schema).
- Usuário seed para login: `arthur@remind.local` / `remind123` (ou os valores de `SEED_USER_*` no `.env`).

### Rodar / verificar

- Dev server: `npm run dev` (Next.js 16 + Turbopack em `http://localhost:3000`). `/` e `/app` redirecionam para `/login` sem sessão.
- Não há script de lint/ESLint configurado; a verificação estática é `npm run typecheck` (`tsc --noEmit`). Build de produção: `npm run build`.
- O README documenta comandos como `npm.cmd ...` porque foi escrito para PowerShell/Windows; neste ambiente Linux use `npm ...`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
