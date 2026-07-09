# Memória do Projeto

## Resumo Durável

- O projeto `remind` nasce como uma ferramenta interna de gestão de projetos e tarefas.
- A primeira versão é focada em uso individual, com limite operacional de até 10 usuários.
- O produto deve priorizar clareza, velocidade de navegação e organização prática do trabalho.

## Decisões Ativas

- Stack base: Next.js + TypeScript + App Router + PostgreSQL.
- O backend permanece integrado na própria aplicação.
- A autenticação da v1 será simples, baseada em sessão.
- O escopo inicial cobre projetos, tarefas, filtros e lembretes in-app.
- Não haverá envio de email, push, WhatsApp ou colaboração avançada nesta fase.
- UI autenticada em tema escuro, direção visual Linear Issues (lista densa, projetos na sidebar, sem rail de cards).

## Prioridades Atuais

1. Fechar o harness operacional do agente.
2. Subir a base funcional do app.
3. Consolidar arquitetura, documentos de contexto e diagrama.

## Restrições

- Toda a documentação humana deve ficar em português.
- O desenho da arquitetura precisa refletir apenas componentes realmente presentes no bootstrap.
