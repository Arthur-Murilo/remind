# ------------------------------------------------------------
# 1. Imagem Base
# ------------------------------------------------------------
FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache libc6-compat

# ------------------------------------------------------------
# 2. Instalação de Dependências
# ------------------------------------------------------------
FROM base AS deps
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

# ------------------------------------------------------------
# 3. Compilação da Aplicação (Build)
# ------------------------------------------------------------
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

RUN npm run build

# ------------------------------------------------------------
# 4. Imagem de Execução em Produção (Runner)
# ------------------------------------------------------------
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV NEXT_TELEMETRY_DISABLED=1

# Usuário de sistema sem privilégios de root para segurança
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copia arquivos estáticos públicos e scripts
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/docker-entrypoint.sh ./docker-entrypoint.sh

# Copia saída standalone e arquivos estáticos do Next.js
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# O standalone não rastreia scripts/init-db.mjs; o entrypoint precisa do driver postgres.
COPY --from=deps --chown=nextjs:nodejs /app/node_modules/postgres ./node_modules/postgres

RUN chmod +x ./docker-entrypoint.sh

USER nextjs

EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e 'fetch("http://127.0.0.1:3000/login").then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))'

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "server.js"]
