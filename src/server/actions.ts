"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireCurrentUser, login, logout } from "@/server/auth";
import {
  createProject,
  renameProject,
  createTask,
  markReminderAsRead,
  updateTask,
  toggleTaskStatus,
  createSubtask,
  toggleSubtask,
  deleteSubtask,
  updateSubtaskTitle,
  createTag,
  setTaskTagsForOwner,
  createCustomStatus,
  createCustomPriority,
  deleteTask,
  deleteProject,
  patchTask,
  isAllowedStatus,
  isAllowedPriority,
  updateTag,
  deleteTag,
  setCatalogColor,
  deleteCatalogItem,
  startWorkSession,
  stopWorkSession,
  createManualSession,
  updateWorkSessionDuration,
  deleteWorkSession
} from "@/server/remind-service";
import { taskRecurrences } from "@/domain/types";

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

export async function renameProjectAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = getString(formData, "projectId");
  const name = getString(formData, "name");

  if (!projectId || !name) {
    return;
  }

  await renameProject(user.id, projectId, name);
  revalidatePath("/app", "layout");
  revalidatePath(`/app/projects/${projectId}`);
}

export async function createTaskAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = getString(formData, "projectId");
  const title = getString(formData, "title");
  const description = getString(formData, "description");
  const status = getString(formData, "status");
  const priority = getString(formData, "priority");
  const dueDate = getString(formData, "dueDate");
  const recurrence = getString(formData, "recurrence") || "none";
  const repeatSubtasksRaw = formData.get("repeatSubtasks");
  const repeatSubtasks =
    repeatSubtasksRaw == null || String(repeatSubtasksRaw) === ""
      ? true
      : ["on", "true", "1"].includes(String(repeatSubtasksRaw).toLowerCase());
  const tagIds = formData.getAll("tagIds").map((v) => String(v));

  if (!projectId || !title) {
    redirect("/app");
  }

  const nextStatus = (await isAllowedStatus(user.id, status)) ? status : "todo";
  const nextPriority = (await isAllowedPriority(user.id, priority)) ? priority : "medium";

  const task = await createTask({
    userId: user.id,
    projectId,
    title,
    description,
    status: nextStatus,
    priority: nextPriority,
    dueDate: dueDate || null,
    recurrence: taskRecurrences.includes(recurrence as any) ? (recurrence as any) : "none",
    repeatSubtasks
  });

  if (!task) {
    redirect("/app");
  }

  await setTaskTagsForOwner(user.id, task.id, tagIds);

  revalidatePath("/app");
  revalidatePath(`/app/projects/${projectId}`);
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
  const recurrence = getString(formData, "recurrence") || "none";
  const repeatSubtasksRaw = formData.get("repeatSubtasks");
  const repeatSubtasks =
    repeatSubtasksRaw == null || String(repeatSubtasksRaw) === ""
      ? true
      : ["on", "true", "1"].includes(String(repeatSubtasksRaw).toLowerCase());
  const tagIds = formData.getAll("tagIds").map((v) => String(v));

  if (!taskId || !projectId || !title) {
    redirect("/app");
  }

  const nextStatus = (await isAllowedStatus(user.id, status)) ? status : "todo";
  const nextPriority = (await isAllowedPriority(user.id, priority)) ? priority : "medium";

  const task = await updateTask({
    userId: user.id,
    taskId,
    projectId,
    title,
    description,
    status: nextStatus,
    priority: nextPriority,
    dueDate: dueDate || null,
    recurrence: taskRecurrences.includes(recurrence as any) ? (recurrence as any) : "none",
    repeatSubtasks
  });

  if (task) {
    await setTaskTagsForOwner(user.id, task.id, tagIds);
  } else {
    redirect("/app");
  }

  revalidatePath("/app");
  revalidatePath(`/app/projects/${projectId}`);
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

export async function toggleTaskStatusAction(formData: FormData) {
  const user = await requireCurrentUser();
  const taskId = getString(formData, "taskId");
  const status = getString(formData, "status");

  if (!taskId || !status) {
    return;
  }

  if (!(await isAllowedStatus(user.id, status))) {
    return;
  }

  await toggleTaskStatus(user.id, taskId, status);
  revalidatePath("/app", "layout");
}

export async function createSubtaskAction(formData: FormData) {
  const user = await requireCurrentUser();
  const taskId = getString(formData, "taskId");
  const title = getString(formData, "title");

  if (!taskId || !title) return;

  await createSubtask(user.id, taskId, title);
  revalidatePath("/app", "layout");
}

export async function toggleSubtaskAction(formData: FormData) {
  const user = await requireCurrentUser();
  const subtaskId = getString(formData, "subtaskId");
  const completedStr = getString(formData, "completed");

  if (!subtaskId) return;

  await toggleSubtask(user.id, subtaskId, completedStr === "true");
  revalidatePath("/app", "layout");
}

export async function deleteSubtaskAction(formData: FormData) {
  const user = await requireCurrentUser();
  const subtaskId = getString(formData, "subtaskId");

  if (!subtaskId) return;

  await deleteSubtask(user.id, subtaskId);
  revalidatePath("/app", "layout");
}

export async function createTagAction(formData: FormData) {
  const user = await requireCurrentUser();
  const name = getString(formData, "name");
  const color = getString(formData, "color") || "#5b6cff";

  if (!name) return;

  await createTag(user.id, name, color);
  revalidatePath("/app");
}

export async function createCustomStatusAction(formData: FormData) {
  const user = await requireCurrentUser();
  const label = getString(formData, "label");
  const color = getString(formData, "color") || "#5b6cff";

  if (!label) return;

  await createCustomStatus(user.id, label, color);
  revalidatePath("/app");
}

export async function createCustomPriorityAction(formData: FormData) {
  const user = await requireCurrentUser();
  const label = getString(formData, "label");
  const color = getString(formData, "color") || "#e2a336";

  if (!label) return;

  await createCustomPriority(user.id, label, color);
  revalidatePath("/app");
}

export async function deleteTaskAction(formData: FormData) {
  const user = await requireCurrentUser();
  const taskId = getString(formData, "taskId");
  const projectId = getString(formData, "projectId");

  if (!taskId) return;

  await deleteTask(user.id, taskId);
  revalidatePath("/app", "layout");
  if (projectId) {
    revalidatePath(`/app/projects/${projectId}`);
  }
}

export async function deleteProjectAction(formData: FormData) {
  const user = await requireCurrentUser();
  const projectId = getString(formData, "projectId");

  if (!projectId) {
    return;
  }

  await deleteProject(user.id, projectId);
  revalidatePath("/app", "layout");
}

export async function patchTaskAction(formData: FormData) {
  const user = await requireCurrentUser();
  const taskId = getString(formData, "taskId");
  const field = getString(formData, "field");
  const value = getString(formData, "value");

  if (!taskId || !field) return;

  if (field === "status" && value && (await isAllowedStatus(user.id, value))) {
    await toggleTaskStatus(user.id, taskId, value);
  } else if (field === "priority" && value && (await isAllowedPriority(user.id, value))) {
    await patchTask(user.id, taskId, { priority: value });
  } else if (field === "dueDate") {
    await patchTask(user.id, taskId, { dueDate: value || null });
  } else if (field === "projectId" && value) {
    await patchTask(user.id, taskId, { projectId: value });
  } else if (field === "title" && value) {
    await patchTask(user.id, taskId, { title: value });
  }

  revalidatePath("/app", "layout");
}

export async function setTaskTagsAction(formData: FormData) {
  const user = await requireCurrentUser();
  const taskId = getString(formData, "taskId");
  const tagIds = formData.getAll("tagIds").map((v) => String(v));

  if (!taskId) return;

  await setTaskTagsForOwner(user.id, taskId, tagIds);
  revalidatePath("/app", "layout");
}

export async function updateSubtaskTitleAction(formData: FormData) {
  const user = await requireCurrentUser();
  const subtaskId = getString(formData, "subtaskId");
  const title = getString(formData, "title");

  if (!subtaskId || !title) return;

  await updateSubtaskTitle(user.id, subtaskId, title);
  revalidatePath("/app", "layout");
}

export async function createTagAndAssignAction(formData: FormData) {
  const user = await requireCurrentUser();
  const taskId = getString(formData, "taskId");
  const name = getString(formData, "name");
  const color = getString(formData, "color") || "#5b6cff";
  const existingTagIds = formData.getAll("tagIds").map((v) => String(v));

  if (!taskId || !name) return null;

  const tag = await createTag(user.id, name, color);
  const nextIds = [...existingTagIds, tag.id].slice(0, 5);
  await setTaskTagsForOwner(user.id, taskId, nextIds);
  revalidatePath("/app", "layout");
  return tag;
}

export async function updateTagAction(formData: FormData) {
  const user = await requireCurrentUser();
  const tagId = getString(formData, "tagId");
  const name = getString(formData, "name");
  const color = getString(formData, "color");

  if (!tagId) return;

  await updateTag(user.id, tagId, { name: name || undefined, color: color || undefined });
  revalidatePath("/app", "layout");
}

export async function deleteTagAction(formData: FormData) {
  const user = await requireCurrentUser();
  const tagId = getString(formData, "tagId");
  if (!tagId) return;
  await deleteTag(user.id, tagId);
  revalidatePath("/app", "layout");
}

export async function setCatalogColorAction(formData: FormData) {
  const user = await requireCurrentUser();
  const kind = getString(formData, "kind");
  const key = getString(formData, "key");
  const color = getString(formData, "color");
  if ((kind !== "status" && kind !== "priority") || !key || !color) return;
  await setCatalogColor(user.id, kind, key, color);
  revalidatePath("/app", "layout");
}

export async function deleteCatalogItemAction(formData: FormData) {
  const user = await requireCurrentUser();
  const kind = getString(formData, "kind");
  const key = getString(formData, "key");
  if ((kind !== "status" && kind !== "priority") || !key) return;
  await deleteCatalogItem(user.id, kind, key);
  revalidatePath("/app", "layout");
}

export async function startWorkSessionAction(formData: FormData) {
  const user = await requireCurrentUser();
  const taskId = getString(formData, "taskId");
  if (!taskId) return;
  await startWorkSession(user.id, taskId);
  revalidatePath("/app", "layout");
}

export async function stopWorkSessionAction() {
  const user = await requireCurrentUser();
  await stopWorkSession(user.id);
  revalidatePath("/app", "layout");
}

export async function createManualSessionAction(formData: FormData) {
  const user = await requireCurrentUser();
  const taskId = getString(formData, "taskId");
  const date = getString(formData, "date");
  const hours = Number(getString(formData, "hours") || "0");
  const minutes = Number(getString(formData, "minutes") || "0");
  const durationSeconds = Math.round((hours * 60 + minutes) * 60);
  if (!taskId || !date || durationSeconds < 60) return;
  await createManualSession(user.id, taskId, date, durationSeconds);
  revalidatePath("/app", "layout");
}

export async function updateWorkSessionDurationAction(formData: FormData) {
  const user = await requireCurrentUser();
  const sessionId = getString(formData, "sessionId");
  const hours = Number(getString(formData, "hours") || "0");
  const minutes = Number(getString(formData, "minutes") || "0");
  const durationSeconds = Math.round((hours * 60 + minutes) * 60);
  if (!sessionId || durationSeconds < 60) return;
  await updateWorkSessionDuration(user.id, sessionId, durationSeconds);
  revalidatePath("/app", "layout");
}

export async function deleteWorkSessionAction(formData: FormData) {
  const user = await requireCurrentUser();
  const sessionId = getString(formData, "sessionId");
  if (!sessionId) return;
  await deleteWorkSession(user.id, sessionId);
  revalidatePath("/app", "layout");
}
