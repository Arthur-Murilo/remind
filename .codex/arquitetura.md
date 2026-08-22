# Arquitetura do Projeto

## Visão Geral

`remind` será um aplicativo web full-stack construído com Next.js, TypeScript e PostgreSQL. A aplicação concentra frontend, rotas de backend, autenticação simples, regras de negócio e persistência no mesmo repositório.

## Módulos da V1

- Autenticação por sessão
- Gestão de projetos
- Gestão de tarefas
- Filtros operacionais de tarefas
- Lembretes in-app
- Catálogos de status e prioridade definidos pelo usuário
- Sessões de trabalho e relatório de tempo

## Limites

- Não há integrações externas de notificação nesta fase.
- Não há colaboração avançada, comentários, papéis complexos ou workflows corporativos.
- O produto atende primeiro um único usuário, mas deve aceitar evolução controlada para equipe pequena.

## Fluxo de Dados

1. O usuário autentica na aplicação.
2. A interface consulta projetos e tarefas no backend do próprio app.
3. Os filtros reduzem a visão operacional por projeto, status, prioridade, prazo e busca textual.
4. Os lembretes são derivados de tarefas com prazo e exibidos no app.
5. O PostgreSQL armazena usuários, sessões de autenticação, projetos, tarefas, lembretes, etiquetas, catálogos e sessões de trabalho.

## Convenções Técnicas

- Componentes de interface e rotas do app ficam no espaço do Next.js App Router.
- Operações de leitura e escrita devem passar por uma camada explícita de domínio/serviço.
- A modelagem de domínio inclui `User`, `Project`, `Task`, `Subtask`, `Etiqueta`, `Reminder`, `TaskFilter`, `CatalogItem` e `Sessão de trabalho`.
- Os contratos visíveis ao usuário permanecem em português.

## Referência Visual e de Arquitetura

- Documento estratégico: `PRODUCT.md`
- Documento visual: `DESIGN.md`
- Diagrama técnico: `docs/arquitetura-remind.drawio`
