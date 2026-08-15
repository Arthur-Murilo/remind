import { test, expect } from "@playwright/test";

test.describe("Remind App E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login
    await page.goto("/login");
    await page.fill('input[name="email"]', "arthur@remind.local");
    await page.fill('input[name="password"]', "remind123");
    await page.click('button[type="submit"]');

    // Should redirect to /app
    await expect(page).toHaveURL(/\/app/);
  });

  test("deve exibir o dashboard e a marca Remind", async ({ page }) => {
    await expect(page.locator(".brand-name")).toHaveText("Remind");
    await expect(page.locator("h1")).toBeVisible();
  });

  test("deve criar uma nova tarefa via modal", async ({ page }) => {
    const uniqueTitle = `Tarefa E2E ${Date.now()}`;

    // Click Nova Tarefa button
    await page.click('button:has-text("+ Nova tarefa")');

    // Fill form inside modal
    await page.fill('#new-task-title', uniqueTitle);
    await page.fill('#new-task-description', 'Descrição da tarefa de teste E2E');
    await page.click('button:has-text("Criar Tarefa")');

    // Modal should close and task title should appear in the list
    await expect(page.locator(`text=${uniqueTitle}`)).toBeVisible();
  });

  test("deve editar uma tarefa existente via modal e fechar o modal", async ({ page }) => {
    const editBtn = page.locator('button[title="Editar tarefa"]').first();
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    // Modal de edição deve abrir
    const modalTitle = page.locator('.modal-title');
    await expect(modalTitle).toHaveText("Editar Tarefa");

    const updatedTitle = `Tarefa Editada ${Date.now()}`;
    const titleInput = page.locator('input[name="title"]');
    await titleInput.fill(updatedTitle);

    // Salvar
    await page.click('button:has-text("Salvar Alterações")');

    // Modal deve fechar e a tarefa atualizada deve aparecer
    await expect(modalTitle).not.toBeVisible();
    await expect(page.locator(`text=${updatedTitle}`)).toBeVisible();
  });

  test("deve alternar status de conclusão de tarefa", async ({ page }) => {
    const checkbox = page.locator('.task-checkbox').first();
    await expect(checkbox).toBeVisible();
    await checkbox.click();
  });

  test("deve criar tarefa recorrente e exibir badge de rotina", async ({ page }) => {
    const routineTitle = `Rotina Diaria ${Date.now()}`;

    await page.click('button:has-text("+ Nova tarefa")');
    await page.fill('#new-task-title', routineTitle);
    await page.selectOption('#new-task-recurrence', 'daily');
    await page.click('button:has-text("Criar Tarefa")');

    await expect(page.locator(`text=${routineTitle}`)).toBeVisible();
    await expect(page.locator('text=🔁 Diária').first()).toBeVisible();
  });
});
