import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomUUID } from "node:crypto";

import type { User } from "@/domain/types";
import { db } from "@/lib/db";
import { verifyPassword } from "@/lib/security";

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

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
    where s.id = ${sessionId}
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

export async function login(email: string, password: string) {
  const sql = db();
  const users = await sql<{ id: string; password_hash: string }[]>`
    select id, password_hash
    from users
    where email = ${email}
    limit 1
  `;

  const user = users[0];
  if (!user) {
    return { ok: false as const, error: "Credenciais inválidas." };
  }

  const passwordMatches = await verifyPassword(password, user.password_hash);
  if (!passwordMatches) {
    return { ok: false as const, error: "Credenciais inválidas." };
  }

  const sessionId = randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000).toISOString();

  await sql`
    insert into sessions (id, user_id, expires_at)
    values (${sessionId}, ${user.id}, ${expiresAt})
  `;

  const cookieStore = await cookies();
  cookieStore.set(cookieName(), sessionId, {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
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
    await sql`delete from sessions where id = ${sessionId}`;
  }
  cookieStore.delete(cookieName());
}
