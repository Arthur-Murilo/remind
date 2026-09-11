# Tarefas do Agente

## Tarefa Atual

### Tarefa
Resolver conflitos de merge do PR de segurança solicitado em comentário.

### Objetivo
Sincronizar o branch do PR com `main`, resolver conflitos preservando os upgrades de segurança e validar que o projeto continua íntegro.

### Subtarefas
- [x] Ler contexto obrigatório (`.codex/*`, `PRODUCT.md`, `DESIGN.md`).
- [x] Inspecionar estado do git e identificar branch base padrão.
- [x] Executar merge de `main` no branch atual e resolver conflitos.
- [x] Validar com `npm run typecheck` e tentar `npm run build` (falha de rede ao baixar Google Fonts no ambiente).
- [ ] Responder ao comentário no PR com o commit de resolução.

### Status
Em andamento.

### Bloqueios
Build depende de acesso externo a `fonts.googleapis.com` no ambiente de execução.

### Próximos Passos
Finalizar commit de merge e responder ao comentário no PR.

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
