# remind

Aplicação interna para gestão de projetos, tarefas, filtros operacionais e lembretes in-app.

## Stack

- Next.js
- TypeScript
- PostgreSQL

## Variáveis de ambiente

Copie `.env-example` para `.env` e ajuste:

- `DATABASE_URL`
- `APP_URL`
- `SESSION_COOKIE_NAME`
- `SEED_USER_EMAIL`
- `SEED_USER_PASSWORD`

## Rodando localmente

1. Instale as dependências:

```bash
npm.cmd install
```

2. Suba um PostgreSQL local e configure `DATABASE_URL`.

Opcional com Docker:

```bash
docker compose up -d
```

3. Inicialize o banco:

```bash
npm.cmd run db:seed
```

4. Suba a aplicação:

```bash
npm.cmd run dev
```

## Escopo atual

- Login simples por sessão
- Projetos
- Tarefas
- Filtros
- Lembretes in-app
