# Tarefas do Agente

## Tarefa Atual

### Tarefa
Corrigir alertas de segurança do Dependabot (next, sharp, baseline-browser-mapping).

### Objetivo
Consolidar upgrades de dependências num único PR de segurança: next >=16.3.3, sharp >=0.35.4, baseline-browser-mapping >=2.11.0.

### Subtarefas
- [ ] Atualizar `next` para >=16.3.3 (último patch 16.x).
- [ ] Regenerar `package-lock.json` com sharp >=0.35.4 e baseline-browser-mapping >=2.11.0.
- [ ] Rodar typecheck e build.
- [ ] Abrir PR consolidado (supersedendo PRs Dependabot #3, #4, #5).

### Status
Em andamento.

### Bloqueios
Nenhum.

### Próximos Passos
Instalar dependências e validar build.

---

## Tarefa Anterior

### Tarefa
Recolher subtarefas por padrão e restringir o Meu dia ao que é do dia.

### Objetivo
A lista não deve abrir todas as subtarefas ao entrar num projeto (ou no Meu dia). O usuário precisa de um aviso discreto de que há continuação. O Meu dia deve mostrar só tarefas com prazo de hoje ou atrasadas, não o backlog inteiro.

### Subtarefas
- [x] Recolher subtarefas por padrão na linha da tarefa.
- [x] Mostrar indicador discreto (barrinhas + contagem) quando houver subtarefas fechadas.
- [x] Filtrar Meu dia para prazo de hoje e atrasadas (`myday`).
- [x] Criar tarefa no Meu dia já com prazo de hoje, para ela aparecer na lista.
- [x] Ajustar seed, testes E2E e docs de produto/memória.

### Status
Concluída.

### Bloqueios
Nenhum.

### Próximos Passos
Nenhum.
