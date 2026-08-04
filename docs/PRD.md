# Product Requirements Document (PRD) - remind

## 1. Visão Geral do Produto

**Nome:** `remind`
**Objetivo:** Ferramenta interna de gestão de projetos e tarefas, projetada para oferecer uma experiência de uso rápida, clara e operacional.
**Público-Alvo:** Focado inicialmente no usuário individual (v1), com capacidade de evolução controlada para equipes pequenas (até 10 pessoas).
**Proposta de Valor:** Concentrar a gestão de projetos e tarefas em uma interface direta e prática. Reduzir a fricção entre visualizar, filtrar e agir sobre as tarefas diárias, eliminando integrações externas desnecessárias e focando na produtividade.

## 2. Escopo da Versão 1 (V1)

### O que ESTÁ no escopo:
- **Autenticação:** Login simples baseado em sessão.
- **Gestão de Projetos:** Criação, visualização, edição e exclusão de projetos.
- **Gestão de Tarefas:** Criação, visualização, edição e exclusão de tarefas.
- **Filtros Operacionais:** Filtragem de tarefas por projeto, status, prioridade, prazo e busca textual livre.
- **Lembretes In-App:** Exibição (somente leitura) de lembretes derivados de tarefas com prazos, para alertar o usuário sem sair da aplicação.

### O que NÃO ESTÁ no escopo (Non-goals na v1):
- Integrações de notificação externas (Email, Push Notifications, WhatsApp, SMS).
- Colaboração avançada (comentários em tarefas, menções, controle de permissões granulares/papéis complexos).
- Workflows corporativos pesados.

## 3. Requisitos Funcionais (RF)

### 3.1. Autenticação e Usuário
- **RF01:** O sistema deve permitir que um usuário realize login utilizando e-mail e senha.
- **RF02:** O sistema deve gerenciar o acesso através de sessões (cookies).
- **RF03:** O sistema deve suportar um limite operacional projetado para um número pequeno de usuários (até 10 pessoas), mesmo sendo focado inicialmente no usuário individual.

### 3.2. Projetos
- **RF04:** O usuário deve ser capaz de criar um novo projeto.
- **RF05:** O usuário deve visualizar a lista de todos os seus projetos ativos.
- **RF06:** O usuário deve ser capaz de editar detalhes ou excluir um projeto existente.

### 3.3. Tarefas
- **RF07:** O usuário deve ser capaz de criar uma nova tarefa vinculada a um projeto específico.
- **RF08:** A tarefa deve possuir, no mínimo, os seguintes atributos: título, status, prioridade e prazo opcional.
- **RF09:** O usuário deve poder visualizar as tarefas através de listas/tabelas híbridas com alta escaneabilidade visual.
- **RF10:** O usuário deve poder atualizar o status, prioridade e prazo de uma tarefa de forma rápida.
- **RF11:** O usuário deve ser capaz de excluir uma tarefa.

### 3.4. Filtros Operacionais
- **RF12:** A interface deve fornecer filtros dinâmicos e de fácil acesso para buscar e refinar tarefas. Os critérios incluem: projeto, status da tarefa, prioridade, prazos associados e termo de busca (busca textual livre).

### 3.5. Lembretes In-App
- **RF13:** O sistema deve derivar lembretes automaticamente a partir de tarefas que possuem prazos próximos ou vencidos.
- **RF14:** A interface deve exibir esses lembretes de forma destacada, mas não intrusiva (sem ruído excessivo), operando no modo de "somente leitura" dentro do aplicativo.

## 4. Requisitos Não Funcionais (RNF)

- **RNF01 (Stack Base):** O projeto deve ser desenvolvido em Next.js com App Router e TypeScript.
- **RNF02 (Persistência):** O banco de dados a ser utilizado é o PostgreSQL, hospedando usuários, sessões, projetos, tarefas e lembretes. O acesso aos dados e a camada de serviço/backend devem residir no mesmo repositório da aplicação frontend.
- **RNF03 (Performance):** As operações de leitura e escrita devem responder com latência reduzida para promover uma "velocidade de navegação" perceptível pelo usuário.
- **RNF04 (Idioma):** Toda a superfície da interface visível ao usuário, bem como os contratos de domínio, devem estar em português (Brasil).
- **RNF05 (Acessibilidade):** O aplicativo deve possuir navegação previsível, contraste adequado e estados compreensíveis, além de suportar navegação razoável via teclado e respeitar preferências de redução de movimento (prefers-reduced-motion).

## 5. Princípios de Design e UI/UX

- **Densidade e Escaneabilidade:** O aplicativo tem contexto operacional e não deve se parecer com uma "landing page". A densidade deve ser moderada e a leitura do estado de trabalho (projetos e tarefas) deve ser a mais rápida possível.
- **Navegação Pragmática:** A navegação deve ser previsível, com layout utilizando "App shell" (navegação lateral simples e cabeçalho funcional). Filtros devem estar sempre próximos das listas de tarefas. Em mobile, os filtros devem ser recolhíveis para preservar a clareza.
- **Ruído Visual Reduzido:** Sinais de prioridade e prazos devem ser visíveis, mas sem extravagância visual. Paleta de cores sóbria, focada no contraste. Animações discretas e restritas apenas para sinalizar ações.
- **Ação Rápida:** Botões primários e os campos de input/busca devem ser compactos e facilitar a entrada e manipulação rápida de dados por um usuário frequente.

## 6. Modelagem Inicial de Domínio (Entidades)

- `User`: Credenciais e informações de perfil.
- `Project`: Organiza o trabalho macro.
- `Task`: Menor unidade de trabalho rastreável (com status, prioridade e prazo).
- `Reminder`: Evento derivado, baseado no prazo das tarefas.
- `TaskFilter`: Entidade que centraliza regras de consulta de listas de tarefas.

## 7. Critérios de Sucesso / Métricas (V1)
- O usuário deve conseguir executar o fluxo de criação até a conclusão de uma tarefa de forma ininterrupta, e verificar que o lembrete foi adequadamente gerado caso o prazo seja de curto termo.
- A arquitetura implementada deve espelhar com exatidão o diagrama atual (`docs/arquitetura-remind.drawio`).
