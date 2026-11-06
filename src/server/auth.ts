import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { createHash, randomBytes } from "node:crypto";

import type { User } from "@/domain/types";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/security";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const LOGIN_WINDOW_MS = 15 * 60_000;
// Hash fixo usado quando o e-mail não existe: mantém o tempo de resposta igual (evita enumeração).
const DUMMY_PASSWORD_HASH =
  "00000000-0000-0000-0000-000000000000:" + "0".repeat(128);

// Por IP + e-mail (bloqueia quem chuta senha), por IP (bloqueia quem varre e-mails) e um teto
// global por e-mail bem mais alto, para um atacante não conseguir trancar o dono da conta
// com poucas tentativas vindas de um único IP.
const MAX_FAILURES_PER_IP_EMAIL = 8;
const MAX_FAILURES_PER_IP = 20;
const MAX_FAILURES_PER_EMAIL = 100;
const MAX_TRACKED_KEYS = 5000;

// Falhas de login por IP e por e-mail (in-memory, nó único — mesmo modelo do MCP).
// Só tentativas erradas contam; login certo não consome cota.
const loginFailures = new Map<string, number[]>();

function recentFailures(key: string) {
  const windowStart = Date.now() - LOGIN_WINDOW_MS;
  const hits = (loginFailures.get(key) ?? []).filter((stamp) => stamp > windowStart);
  if (hits.length) loginFailures.set(key, hits);
  else loginFailures.delete(key);
  return hits.length;
}

function recordFailure(...keys: string[]) {
  const now = Date.now();
  if (loginFailures.size > MAX_TRACKED_KEYS) {
    // Limpeza oportunista de chaves antigas (e-mails aleatórios nunca revisitados).
    for (const key of [...loginFailures.keys()]) recentFailures(key);
  }
  for (const key of keys) {
    loginFailures.set(key, [...(loginFailures.get(key) ?? []), now]);
  }
}

export type LoginErrorCode = "invalid" | "rate_limited" | "missing";

function useSecureCookie() {
  return (process.env.APP_URL || "").startsWith("https://");
}

async function requestIp() {
  const headerStore = await headers();
  return (
    // cf-connecting-ip primeiro: atrás do Cloudflare é o único que o cliente não forja.
    headerStore.get("cf-connecting-ip")?.trim() ||
    headerStore.get("x-real-ip")?.trim() ||
    headerStore.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}

/**
 * O banco guarda só o SHA-256 do id de sessão: um dump/backup vazado não permite
 * sequestrar sessões. O cookie continua com o valor bruto (256 bits aleatórios).
 */
function hashSessionId(sessionId: string) {
  return createHash("sha256").update(sessionId).digest("hex");
}

function cookieName() {
  return process.env.SESSION_COOKIE_NAME || "remind_session";
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(cookieName())?.value;

  if (!sessionId) {
    return null;
  }

  const sql = db();
  const rows = await sql<User[]>`
    select
      u.id,
      u.name,
      u.email,
      u.created_at as "createdAt"
    from sessions s
    join users u on u.id = s.user_id
    where s.id = ${hashSessionId(sessionId)}
      and s.expires_at > now()
    limit 1
  `;

  return rows[0] ?? null;
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const sql = db();
  const rows = await sql<User[]>`
    select
      id,
      name,
      email,
      created_at as "createdAt"
    from users
    where email = ${email}
    limit 1
  `;

  return rows[0] ?? null;
}

export function mcpOwnerEmail(): string {
  return process.env.MCP_USER_EMAIL || process.env.SEED_USER_EMAIL || "";
}

export async function login(email: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  const ip = await requestIp();
  const ipKey = `ip:${ip}`;
  const pairKey = `pair:${ip}:${normalizedEmail}`;
  const emailKey = `email:${normalizedEmail}`;
  if (
    recentFailures(pairKey) >= MAX_FAILURES_PER_IP_EMAIL ||
    recentFailures(ipKey) >= MAX_FAILURES_PER_IP ||
    recentFailures(emailKey) >= MAX_FAILURES_PER_EMAIL
  ) {
    return { ok: false as const, code: "rate_limited" as LoginErrorCode };
  }

  const sql = db();
  const users = await sql<{ id: string; password_hash: string }[]>`
    select id, password_hash
    from users
    where lower(email) = ${normalizedEmail}
    limit 1
  `;

  const user = users[0];
  const passwordMatches = await verifyPassword(password, user?.password_hash ?? DUMMY_PASSWORD_HASH);
  if (!user || !passwordMatches) {
    recordFailure(pairKey, ipKey, emailKey);
    return { ok: false as const, code: "invalid" as LoginErrorCode };
  }

  // Limpeza oportunista: sessões expiradas não têm uso e só crescem a tabela.
  await sql`delete from sessions where expires_at < now()`;

  const sessionId = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000).toISOString();

  await sql`
    insert into sessions (id, user_id, expires_at)
    values (${hashSessionId(sessionId)}, ${user.id}, ${expiresAt})
  `;

  const cookieStore = await cookies();
  cookieStore.set(cookieName(), sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: useSecureCookie(),
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS
  });

  return { ok: true as const };
}

export async function logout() {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(cookieName())?.value;
  if (sessionId) {
    const sql = db();
    await sql`delete from sessions where id = ${hashSessionId(sessionId)}`;
  }
  cookieStore.delete(cookieName());
}
