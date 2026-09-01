#!/bin/sh
set -e

# Executa migrações / inicialização de banco se habilitado.
# Falhas de schema/seed interrompem a subida (set -e); não mascarar com || echo.
if [ "${AUTO_RUN_DB_INIT:-true}" = "true" ]; then
  echo "[Remind] Verificando e aplicando esquema do banco de dados..."
  if [ "${AUTO_RUN_DB_SEED:-true}" = "true" ]; then
    echo "[Remind] Aplicando schema e dados de seed inicial..."
    node scripts/init-db.mjs --seed
  else
    echo "[Remind] Aplicando apenas schema..."
    node scripts/init-db.mjs
  fi
fi

echo "[Remind] Iniciando servidor Next.js na porta ${PORT:-3000}..."
exec "$@"
