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
