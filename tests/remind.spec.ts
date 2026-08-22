import { test, expect } from "@playwright/test";

async function openCreateDetails(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Detalhes" }).click();
  await expect(page.locator(".modal-title")).toHaveText("Criar Nova Tarefa");
}

async function choosePopoverOption(page: import("@playwright/test").Page, ariaLabel: string, optionLabel: string) {
  await page.locator(`.modal-body button[aria-label="${ariaLabel}"]`).click();
  await page.locator(`.inline-menu[aria-label="${ariaLabel}"] button[role="option"]`, { hasText: optionLabel }).click();
}

test.describe("Remind App E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "arthur@remind.local");
    await page.fill('input[name="password"]', "remind123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/app/);
  });

  test("deve exibir o dashboard e a marca Remind", async ({ page }) => {
    await expect(page.locator(".brand-name")).toHaveText("Remind");
    await expect(page.locator("h1")).toBeVisible();
    await expect(page.locator(".metrics-strip")).toBeVisible();
  });

  test("deve criar uma nova tarefa via detalhes", async ({ page }) => {
    const uniqueTitle = `Tarefa E2E ${Date.now()}`;

    await openCreateDetails(page);
    await page.fill("#new-task-title", uniqueTitle);
    await page.fill("#new-task-description", "Descrição da tarefa de teste E2E");
    await page.click('button:has-text("Criar Tarefa")');

    await expect(page.locator(`text=${uniqueTitle}`)).toBeVisible();
  });

  test("deve criar tarefa rapidamente pela toolbar", async ({ page }) => {
    const uniqueTitle = `Quick E2E ${Date.now()}`;
    await page.getByLabel("Título da nova tarefa").fill(uniqueTitle);
    await page.getByRole("button", { name: "Criar", exact: true }).click();
    await expect(page.locator(`text=${uniqueTitle}`)).toBeVisible();
  });

  test("deve editar uma tarefa existente via modal e fechar o modal", async ({ page }) => {
    const editBtn = page.locator('button[title="Editar tarefa"]').first();
    await expect(editBtn).toBeVisible();
    await editBtn.click();

    const modalTitle = page.locator(".modal-title");
    await expect(modalTitle).toHaveText("Editar Tarefa");

    const updatedTitle = `Tarefa Editada ${Date.now()}`;
    const titleInput = page.locator('input[name="title"]');
    await titleInput.fill(updatedTitle);

    await page.click('button:has-text("Salvar Alterações")');

    await expect(modalTitle).not.toBeVisible();
    await expect(page.locator(`text=${updatedTitle}`)).toBeVisible();
  });

  test("deve alternar status de conclusão de tarefa", async ({ page }) => {
    const checkbox = page.locator(".task-checkbox").first();
    await expect(checkbox).toBeVisible();
    await checkbox.click();
  });

  test("deve criar tarefa recorrente com checkbox de subtarefas", async ({ page }) => {
    const routineTitle = `Rotina Diaria ${Date.now()}`;

    await openCreateDetails(page);
    await page.fill("#new-task-title", routineTitle);
    await choosePopoverOption(page, "Repetir", "Diariamente");
    await expect(page.getByText("Repetir subtarefas a cada ciclo")).toBeVisible();
    await page.click('button:has-text("Criar Tarefa")');

    await expect(page.locator(`text=${routineTitle}`)).toBeVisible();
    await expect(page.locator("text=🔁 Diária").first()).toBeVisible();
  });

  test("deve aplicar filtro customizado e limpar chips", async ({ page }) => {
    await page.locator('button[aria-label="Filtrar por status"]').click();
    await page.locator('.inline-menu[aria-label="Filtrar por status"] button[role="option"]', { hasText: "A fazer" }).click();
    await expect(page.locator(".filter-chip", { hasText: "Status: A fazer" })).toBeVisible();
    await page.getByRole("button", { name: "Limpar filtros" }).click();
    await expect(page.locator(".filter-chip")).toHaveCount(0);
  });

  test("deve centralizar o diálogo de exclusão", async ({ page }) => {
    await page.locator('button[title="Excluir tarefa"]').first().click();
    const panel = page.locator(".confirm-dialog[open] .confirm-dialog-panel");
    await expect(panel).toBeVisible();
    const box = await panel.boundingBox();
    const viewport = page.viewportSize();
    expect(box).toBeTruthy();
    expect(viewport).toBeTruthy();
    const center = (box!.x + box!.width / 2);
    expect(Math.abs(center - viewport!.width / 2)).toBeLessThan(48);
    await page.locator(".confirm-dialog[open]").getByRole("button", { name: "Cancelar" }).click();
  });

  test("deve expandir subtarefas pela seta à esquerda do título", async ({ page }) => {
    const caret = page.locator(".asana-caret-btn").first();
    await expect(caret).toBeVisible();
    await caret.click();
    await expect(page.getByLabel("Nova subtarefa").first()).toBeVisible();
  });

  test("deve criar um status customizado na célula da tarefa", async ({ page }) => {
    const label = `Status ${Date.now()}`;
    await page.getByRole("button", { name: "Alterar status" }).first().click();
    await page.getByPlaceholder("Novo status...").fill(label);
    await page.locator(".catalog-menu").getByRole("button", { name: "Criar" }).click();
    await expect(page.locator(".catalog-menu-pick", { hasText: label })).toBeVisible();
  });

  test("deve abrir o modal de projeto no body sem vazar o cabeçalho da lista", async ({ page }) => {
    await page.getByRole("button", { name: "+ Novo projeto" }).click();
    const modal = page.locator("body > .modal-backdrop");
    await expect(modal.locator(".modal-title")).toHaveText("Criar Novo Projeto");
    await expect(modal).toBeVisible();
  });

  test("deve abrir o modal de criação quando o campo rápido está vazio", async ({ page }) => {
    await page.getByRole("button", { name: "Criar", exact: true }).click();
    await expect(page.locator(".modal-title")).toHaveText("Criar Nova Tarefa");
  });

  test("deve editar o título com duplo clique", async ({ page }) => {
    const title = page.locator(".issue-title-main strong").first();
    await expect(title).toBeVisible();
    const next = `Rename ${Date.now()}`;
    await title.dblclick();
    const input = page.getByLabel("Editar título da tarefa");
    await input.fill(next);
    await input.press("Enter");
    await expect(page.locator(".issue-title-main strong", { hasText: next })).toBeVisible();
  });

  test("deve iniciar o timer e exibir a visão Tempo", async ({ page }) => {
    await page.getByRole("button", { name: "Iniciar cronômetro" }).first().click();
    await expect(page.getByRole("button", { name: "Parar cronômetro" }).first()).toBeVisible();
    await page.getByRole("link", { name: "Tempo" }).click();
    await expect(page.locator("h1")).toHaveText("Tempo");
    await expect(page.getByRole("group", { name: "Período" })).toBeVisible();
  });
});
