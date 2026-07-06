import postgres from "postgres";

declare global {
  var __remindSql: ReturnType<typeof postgres> | undefined;
}

function getDatabaseUrl() {
  const url = process.env.DATABASE_URL;

  if (!url) {
    throw new Error("DATABASE_URL não definido. Configure o arquivo .env antes de acessar o banco.");
  }

  return url;
}

export function db() {
  if (!globalThis.__remindSql) {
    globalThis.__remindSql = postgres(getDatabaseUrl(), {
      max: 10,
      idle_timeout: 20,
      connect_timeout: 10
    });
  }

  return globalThis.__remindSql;
}
