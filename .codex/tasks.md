# Tarefas do Agente

## Tarefa Atual

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

### Bloqueios
Nenhum.

### Próximos Passos
Nenhum.

## Tarefa Anterior

### Tarefa
Corrigir falha do entrypoint Docker: `Cannot find package 'postgres'` em `init-db.mjs`.

### Objetivo
Fazer o container `remind-app` aplicar schema/seed e subir o Next.js, copiando o pacote `postgres` para a imagem standalone.

### Subtarefas
- [x] Copiar `node_modules/postgres` do estágio `deps` para o `runner` no `Dockerfile`.
- [x] Atualizar memória operacional.
- [x] Commit e push para a VPS poder rebuildar.

### Status
Concluída.
