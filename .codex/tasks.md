# Tarefas do Agente

## Tarefa Atual

### Tarefa
Corrigir achados de Bugbot e Security Review no caminho Docker/VPS, depois commit e push.

### Objetivo
Endurecer entrypoint, exposição do Postgres e seed de usuário sem deixar de ler e-mail e senha do `.env`, e publicar as alterações locais no repositório remoto.

### Subtarefas
- [x] Remover mascaramento de falha em `docker-entrypoint.sh` para que schema/seed quebrem a subida do container.
- [x] Bind do Postgres em `127.0.0.1` no `docker-compose.yml` (acesso local, sem publicação na internet).
- [x] Exigir `POSTGRES_PASSWORD`, `SEED_USER_EMAIL` e `SEED_USER_PASSWORD` via `.env`, sem fallback fraco no compose.
- [x] Seed cria usuário inicial a partir do `.env` e não sobrescreve senha de usuário existente.
- [x] Atualizar `.env-example`, README e memória/arquitetura.
- [x] Commit e push para o repositório remoto.

### Status
Concluída.

### Bloqueios
Nenhum.

### Próximos Passos
Acompanhar o CI no GitHub após o push e, se desejado, fazer o deploy na VPS.
