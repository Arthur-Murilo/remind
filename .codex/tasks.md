# Tarefas do Agente

## Tarefa Atual

### Tarefa
Corrigir riscado da tarefa pai, permissões do CI e revisão do Copilot.

### Objetivo
O título da tarefa pai não deve ficar riscado ao concluir só subtarefas; o workflow do GitHub Actions precisa de `permissions` explícitas; e as sugestões do Copilot sobre `sort_order`, upsert em lote e `persistOrder` duplicado devem ser aplicadas.

### Subtarefas
- [ ] Restringir o CSS de riscado ao checkbox da coluna da tarefa pai.
- [ ] Adicionar `permissions: contents: read` em `.github/workflows/ci.yml`.
- [ ] Corrigir `nextPrioritySortOrder` com `greatest(...)`.
- [ ] Tornar `reorderPriorities` atômico com upsert em lote.
- [ ] Evitar `persistOrder` duplo no drop/dragEnd do catálogo.
- [ ] Validar typecheck/E2E e atualizar o PR.

### Status
Em andamento.

### Bloqueios
Nenhum.

### Próximos Passos
Implementar as correções e testar.

## Tarefa Anterior

### Tarefa
Ajustar cascata de subtarefas, lembretes por prazo e ordem das prioridades.

### Objetivo
Três correções de produto: (1) concluir subtarefas não fecha a tarefa pai, mas concluir a pai fecha as subtarefas; (2) lembretes e datas só alertam no dia do prazo (amarelo) ou atrasadas (vermelho); (3) prioridades customizadas (e as de sistema) podem ser reordenadas por arrastar, e a lista de tarefas segue essa ordem.

### Subtarefas
- [x] Concluir todas as subtarefas não marca a tarefa como concluída.
- [x] Marcar a tarefa principal como concluída marca todas as subtarefas como concluídas.
- [x] Sininho e métrica de lembretes só incluem prazo de hoje ou atrasado.
- [x] Data de hoje em amarelo; data atrasada em vermelho (lista e notificações).
- [x] Prazo futuro não aparece no sininho.
- [x] Prioridades com `sort_order` e drag-and-drop no menu do catálogo.
- [x] Tarefas ordenadas pela ordem do catálogo de prioridades.
- [x] Testes E2E cobrindo os três fluxos.
- [x] typecheck e verificação no browser.

### Status
Concluída.
