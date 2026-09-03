import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { randomUUID, scryptSync } from "node:crypto";
import postgres from "postgres";

function readEnvFile() {
  const envPath = resolve(process.cwd(), ".env");
  if (!existsSync(envPath)) {
    return;
  }

  const content = readFileSync(envPath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const index = line.indexOf("=");
    if (index === -1) continue;
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function hashPassword(password) {
  const salt = randomUUID();
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

async function createSchema(sql) {
  await sql`
    create table if not exists users (
      id text primary key,
      name text not null,
      email text not null unique,
      password_hash text not null,
      created_at timestamptz not null default now()
    )
  `;

  await sql`
    create table if not exists sessions (
      id text primary key,
      user_id text not null references users(id) on delete cascade,
      expires_at timestamptz not null,
      created_at timestamptz not null default now()
    )
  `;

  await sql`
    create table if not exists projects (
      id text primary key,
      owner_id text not null references users(id) on delete cascade,
      name text not null,
      description text,
      status text not null default 'active',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `;

  await sql`
    create table if not exists tasks (
      id text primary key,
      project_id text not null references projects(id) on delete cascade,
      owner_id text not null references users(id) on delete cascade,
      title text not null,
      description text,
      status text not null default 'todo',
      priority text not null default 'medium',
      due_date date,
      recurrence text not null default 'none',
      repeat_subtasks boolean not null default true,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `;

  await sql`alter table tasks add column if not exists recurrence text not null default 'none'`;
  await sql`alter table tasks add column if not exists repeat_subtasks boolean not null default true`;

  await sql`
    create table if not exists reminders (
      id text primary key,
      task_id text not null unique references tasks(id) on delete cascade,
      user_id text not null references users(id) on delete cascade,
      kind text not null default 'task_due',
      remind_at timestamptz not null,
      read_at timestamptz,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `;

  await sql`
    create table if not exists tags (
      id text primary key,
      user_id text not null references users(id) on delete cascade,
      name text not null,
      color text not null default '#5b6cff',
      created_at timestamptz not null default now()
    )
  `;

  await sql`
    create table if not exists task_tags (
      task_id text not null references tasks(id) on delete cascade,
      tag_id text not null references tags(id) on delete cascade,
      primary key (task_id, tag_id)
    )
  `;

  await sql`
    create table if not exists subtasks (
      id text primary key,
      task_id text not null references tasks(id) on delete cascade,
      owner_id text not null references users(id) on delete cascade,
      title text not null,
      completed boolean not null default false,
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `;

  await sql`
    create table if not exists custom_statuses (
      id text primary key,
      user_id text not null references users(id) on delete cascade,
      key text not null,
      label text not null,
      color text not null default '#5b6cff',
      created_at timestamptz not null default now()
    )
  `;

  await sql`
    create table if not exists custom_priorities (
      id text primary key,
      user_id text not null references users(id) on delete cascade,
      key text not null,
      label text not null,
      color text not null default '#e2a336',
      sort_order integer not null default 100,
      created_at timestamptz not null default now()
    )
  `;

  await sql`alter table custom_priorities add column if not exists sort_order integer not null default 100`;
  await sql`update custom_priorities set sort_order = 0 where key = 'high' and sort_order = 100`;
  await sql`update custom_priorities set sort_order = 1 where key = 'medium' and sort_order = 100`;
  await sql`update custom_priorities set sort_order = 2 where key = 'low' and sort_order = 100`;

  await sql`create unique index if not exists custom_statuses_user_key on custom_statuses (user_id, key)`;
  await sql`create unique index if not exists custom_priorities_user_key on custom_priorities (user_id, key)`;

  await sql`
    create table if not exists work_sessions (
      id text primary key,
      task_id text not null references tasks(id) on delete cascade,
      owner_id text not null references users(id) on delete cascade,
      started_at timestamptz not null,
      ended_at timestamptz,
      duration_seconds integer not null default 0,
      source text not null default 'timer',
      created_at timestamptz not null default now(),
      updated_at timestamptz not null default now()
    )
  `;

  await sql`create index if not exists work_sessions_owner_started on work_sessions (owner_id, started_at desc)`;
  await sql`create unique index if not exists work_sessions_one_open on work_sessions (owner_id) where ended_at is null`;
}

async function seed(sql) {
  const email = process.env.SEED_USER_EMAIL;
  const password = process.env.SEED_USER_PASSWORD;
  const name = "Arthur";

  if (!email || !password) {
    throw new Error(
      "SEED_USER_EMAIL e SEED_USER_PASSWORD devem estar definidos no arquivo .env."
    );
  }

  const existingUsers = await sql`select * from users where email = ${email} limit 1`;
  let user = existingUsers[0];

  if (!user) {
    const [created] = await sql`
      insert into users (id, name, email, password_hash)
      values (${randomUUID()}, ${name}, ${email}, ${hashPassword(password)})
      returning *
    `;
    user = created;
  }

  const existingProjects = await sql`select * from projects where owner_id = ${user.id} limit 1`;
  let project = existingProjects[0];

  if (!project) {
    const [createdProject] = await sql`
      insert into projects (id, owner_id, name, description, status)
      values (
        ${randomUUID()},
        ${user.id},
        ${"Operação Pessoal"},
        ${"Projeto inicial para acompanhar tarefas, prioridades e lembretes."},
        ${"active"}
      )
      returning *
    `;
    project = createdProject;
  }

  const taskRows = await sql`
    select count(*)::int as count
    from tasks
    where project_id = ${project.id}
  `;

  if (taskRows[0]?.count === 0) {
    const tasks = [
      {
        title: "Estruturar backlog inicial",
        description: "Registrar prioridades e próximos passos do produto.",
        status: "in_progress",
        priority: "high",
        dueDate: new Date().toISOString().slice(0, 10)
      },
      {
        title: "Definir critérios dos lembretes",
        description: "Consolidar regras mínimas para prazos e alertas in-app.",
        status: "todo",
        priority: "medium",
        dueDate: new Date(Date.now() + 172800000).toISOString().slice(0, 10)
      },
      {
        title: "Revisar layout da visão de tarefas",
        description: "Validar densidade, filtros e hierarquia da tela principal.",
        status: "todo",
        priority: "low",
        dueDate: null
      }
    ];

    for (const task of tasks) {
      const [createdTask] = await sql`
        insert into tasks (id, project_id, owner_id, title, description, status, priority, due_date)
        values (
          ${randomUUID()},
          ${project.id},
          ${user.id},
          ${task.title},
          ${task.description},
          ${task.status},
          ${task.priority},
          ${task.dueDate}
        )
        returning *
      `;

      if (task.dueDate && task.status !== "done") {
        await sql`
          insert into reminders (id, task_id, user_id, kind, remind_at)
          values (
            ${randomUUID()},
            ${createdTask.id},
            ${user.id},
            ${"task_due"},
            ${(new Date(`${task.dueDate}T09:00:00Z`)).toISOString()}
          )
        `;
      }
    }
  }
}

async function main() {
  readEnvFile();

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL não definido. Crie um arquivo .env com a conexão do PostgreSQL.");
  }

  const sql = postgres(databaseUrl, { max: 1 });

  try {
    await createSchema(sql);
    if (process.argv.includes("--seed")) {
      await seed(sql);
    }
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
