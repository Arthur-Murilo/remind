# Tarefas do Agente

## Tarefa Atual

### Tarefa
Corrigir riscado da tarefa pai, permissões do CI e revisão do Copilot.

### Objetivo
O título da tarefa pai não deve ficar riscado ao concluir só subtarefas; o workflow do GitHub Actions precisa de `permissions` explícitas; e as sugestões do Copilot sobre `sort_order`, upsert em lote e `persistOrder` duplicado devem ser aplicadas.

### Subtarefas
- [x] Restringir o CSS de riscado ao checkbox da coluna da tarefa pai.
- [x] Adicionar `permissions: contents: read` em `.github/workflows/ci.yml`.
- [x] Corrigir `nextPrioritySortOrder` com `greatest(...)`.
- [x] Tornar `reorderPriorities` atômico com upsert em lote.
- [x] Evitar `persistOrder` duplo no drop/dragEnd do catálogo.
- [x] Validar typecheck/E2E e atualizar o PR.

### Status
Concluída.

### Bloqueios
Nenhum.

### Próximos Passos
Nenhum.
