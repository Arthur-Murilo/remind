# Tarefas do Agente

## Tarefa Atual

### Tarefa
Rate limit MCP pré-auth por IP (follow-up do PR).

### Objetivo
Impedir que tokens Bearer falsos rotacionados diluam o limite de 60 req/min. Todas as requisições a `/api/mcp` contam no bucket do IP antes da auth.

### Subtarefas
- [ ] Rate limit pré-auth só por IP (60/min, 429 + Retry-After)
- [ ] Teste HTTP: tokens errados distintos no mesmo IP ainda tomam 429
- [ ] Atualizar docs/mcp.md e notas de spec/design
- [ ] Commit e push no branch do PR

### Status
Em andamento.

### Bloqueios
Nenhum.

### Próximos Passos
Ajustar rota, testes e documentação.
