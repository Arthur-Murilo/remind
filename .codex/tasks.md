# Tarefas do Agente

## Tarefa Atual

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

### Bloqueios
Nenhum.

### Próximos Passos
Na VPS: `git pull` e `docker compose up --build -d`.
