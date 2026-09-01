# Remind

Aplicação interna para gestão de projetos, tarefas, filtros operacionais e lembretes in-app.

## Stack

- **Framework**: Next.js 16 (App Router com output Standalone)
- **Linguagem**: TypeScript
- **Banco de Dados**: PostgreSQL 17
- **Autenticação**: Sessão simples baseada em cookies
- **Testes**: Playwright (E2E)
- **Containerização**: Docker e Docker Compose (Multi-stage build para produção)
- **CI**: GitHub Actions

---

## 🚀 Execução Completa via Docker (Recomendado para VPS e Produção)

A aplicação está totalmente preparada para rodar em containers Docker tanto localmente quanto em uma VPS. O container da aplicação inclui verificação de saúde (*healthcheck*), usuário não-root por segurança e script de inicialização automática de banco e seed.

Antes de subir, copie o `.env-example` e ajuste as credenciais. O Compose **exige** `POSTGRES_PASSWORD`, `SEED_USER_EMAIL` e `SEED_USER_PASSWORD` no `.env` (não há fallback no `docker-compose.yml`). E-mail e senha de login inicial são sempre lidos dessas variáveis. O Postgres só escuta em `127.0.0.1` por padrão, para não ficar exposto na internet da VPS.

### 1. Subir tudo com Docker Compose

Para subir a aplicação e o banco PostgreSQL de uma só vez:

```bash
cp .env-example .env
# Edite POSTGRES_PASSWORD, SEED_USER_EMAIL e SEED_USER_PASSWORD no .env
docker compose up --build -d
```

### 2. Acessar a aplicação

Após os containers iniciarem e ficarem saudáveis (*healthy*):

- **URL da aplicação**: `http://localhost:3000` (ou o IP/domínio da sua VPS)
- **Usuário e senha**: os valores de `SEED_USER_EMAIL` e `SEED_USER_PASSWORD` no `.env` (o seed só cria o usuário na primeira vez; restarts não redefinem a senha)

### 3. Gerenciamento dos Containers

```bash
# Ver status dos serviços e healthchecks
docker compose ps

# Visualizar logs em tempo real
docker compose logs -f app

# Parar os serviços
docker compose down

# Parar os serviços e limpar volumes de dados (CUIDADO: apaga o banco)
docker compose down -v
```

---

## ☁️ Deploy em VPS

Para realizar o deploy em uma VPS (ex: Hetzner, DigitalOcean, AWS, Oracle Cloud):

1. **Instale o Docker e o Docker Compose** na VPS:
   ```bash
   curl -fsSL https://get.docker.com | sh
   ```
2. **Clone o repositório** na VPS:
   ```bash
   git clone https://github.com/seu-usuario/remind.git
   cd remind
   ```
3. **Configure as variáveis de ambiente**:
   ```bash
   cp .env-example .env
   ```
   Edite o arquivo `.env` definindo uma senha forte em `POSTGRES_PASSWORD`, o `APP_URL` (domínio/IP) e o login inicial em `SEED_USER_EMAIL` / `SEED_USER_PASSWORD`. O Compose recusa subir sem essas variáveis. A porta `5432` fica só em localhost; não abra o Postgres no firewall da VPS.
4. **Inicie os serviços**:
   ```bash
   docker compose up --build -d
   ```
5. *(Opcional)* Configure um proxy reverso com SSL (Nginx, Caddy ou Traefik) apontando para a porta `3000`.

---

## 🛠️ Desenvolvimento Local (Sem Docker para o App)

Caso prefira rodar o Next.js localmente e apenas o PostgreSQL via Docker:

1. **Copie o arquivo de variáveis de ambiente**:
   ```bash
   cp .env-example .env
   ```

2. **Suba apenas o PostgreSQL**:
   ```bash
   docker compose up -d postgres
   ```

3. **Instale as dependências**:
   ```bash
   npm install
   ```

4. **Inicialize o banco com dados de teste (seed)**:
   ```bash
   npm run db:seed
   ```

5. **Inicie o servidor de desenvolvimento**:
   ```bash
   npm run dev
   ```

---

## 🧪 Testes e Validação

- **Checagem de tipos TypeScript**:
  ```bash
  npm run typecheck
  ```
- **Testes E2E com Playwright**:
  ```bash
  npm run test:e2e
  ```
- **Build de produção**:
  ```bash
  npm run build
  ```

---

## 🔄 Integração Contínua (CI)

O repositório conta com um workflow configurado no **GitHub Actions** (`.github/workflows/ci.yml`) que roda a cada `push` ou `pull_request` para as branches principais (`main`/`master`):

1. **Typecheck & Build**: Valida tipos estáticos TypeScript e gera o build standalone do Next.js.
2. **E2E Tests**: Sobe um container de serviço do PostgreSQL 17, executa o seed e roda a bateria completa de testes automatizados com Playwright.
3. **Docker Build Validation**: Garante que o `Dockerfile` multi-stage é compilado com sucesso sem quebras.
