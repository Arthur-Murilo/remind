"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireCurrentUser, login, logout } from "@/server/auth";
import { createProject, createTask, markReminderAsRead, updateTask } from "@/server/remind-service";
import { taskPriorities, taskStatuses } from "@/domain/types";

function getString(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

export async function loginAction(formData: FormData) {
  const email = getString(formData, "email");
  const password = getString(formData, "password");

  if (!email || !password) {
    redirect("/login?error=Preencha%20email%20e%20senha.");
  }

  const result = await login(email, password);
  if (!result.ok) {
    redirect(`/login?error=${encodeURIComponent(result.error)}`);
  }

  redirect("/app");
}

export async function logoutAction() {
  await logout();
  redirect("/login");
}

export async function createProjectAction(formData: FormData) {
  const user = await requireCurrentUser();
  const name = getString(formData, "name");
  const description = getString(formData, "description");

  if (!name) {
    redirect("/app");
  }

  await createProject({
    userId: user.id,
    name,
    description
  });

  revalidatePath("/app");
  redirect("/app");
}

export async function createTaskAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = getString(formData, "projectId");
  const title = getString(formData, "title");
  const description = getString(formData, "description");
  const status = getString(formData, "status");
  const priority = getString(formData, "priority");
  const dueDate = getString(formData, "dueDate");

  if (!projectId || !title) {
    redirect("/app");
  }

  await createTask({
    userId: user.id,
    projectId,
    title,
    description,
    status: taskStatuses.includes(status as (typeof taskStatuses)[number]) ? (status as (typeof taskStatuses)[number]) : "todo",
    priority: taskPriorities.includes(priority as (typeof taskPriorities)[number]) ? (priority as (typeof taskPriorities)[number]) : "medium",
    dueDate: dueDate || null
  });

  revalidatePath("/app");
  revalidatePath(`/app/projects/${projectId}`);
  redirect(`/app/projects/${projectId}`);
}

export async function updateTaskAction(formData: FormData) {
  const user = await requireCurrentUser();
  const taskId = getString(formData, "taskId");
  const projectId = getString(formData, "projectId");
  const title = getString(formData, "title");
  const description = getString(formData, "description");
  const status = getString(formData, "status");
  const priority = getString(formData, "priority");
  const dueDate = getString(formData, "dueDate");

  if (!taskId || !projectId || !title) {
    redirect("/app");
  }

  await updateTask({
    userId: user.id,
    taskId,
    projectId,
    title,
    description,
    status: taskStatuses.includes(status as (typeof taskStatuses)[number]) ? (status as (typeof taskStatuses)[number]) : "todo",
    priority: taskPriorities.includes(priority as (typeof taskPriorities)[number]) ? (priority as (typeof taskPriorities)[number]) : "medium",
    dueDate: dueDate || null
  });

  revalidatePath("/app");
  revalidatePath(`/app/projects/${projectId}`);
  revalidatePath(`/app/tasks/${taskId}/edit`);
  redirect(`/app/projects/${projectId}`);
}

export async function markReminderAsReadAction(formData: FormData) {
  const user = await requireCurrentUser();
  const reminderId = getString(formData, "reminderId");

  if (!reminderId) {
    redirect("/app");
  }

  await markReminderAsRead(user.id, reminderId);
  revalidatePath("/app");
  redirect("/app");
}
