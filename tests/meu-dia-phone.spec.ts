import { test, expect } from "@playwright/test";

test.describe("Meu dia phone pilot", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "arthur@remind.local");
    await page.fill('input[name="password"]', "remind123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/app/);
  });

  test("mostra cards, bottom nav e FAB em vez de tabela", async ({ page }) => {
    const nav = page.getByRole("navigation", { name: "Navegação do telefone" });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link", { name: "Meu dia" })).toHaveAttribute("aria-current", "page");
    await expect(page.getByRole("button", { name: "Abrir menu" })).toHaveCount(0);
    await expect(page.locator(".issue-head")).toHaveCount(0);
    await expect(page.locator(".task-table-scroll")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Nova tarefa" })).toBeVisible();

    const empty = page.locator(".task-empty");
    const cards = page.locator(".task-card");
    if (await empty.isVisible()) {
      await expect(empty.getByText("Nada para hoje")).toBeVisible();
      await expect(empty.getByText("Quando criar tarefas com prazo de hoje, elas aparecem aqui.")).toBeVisible();
      await expect(empty.getByRole("button", { name: "Nova tarefa" })).toBeVisible();
    } else {
      await expect(cards.first()).toBeVisible();
      await expect(page.getByRole("heading", { name: /Atrasadas|Hoje/ })).toBeVisible();
    }
  });

  test("cria tarefa pelo FAB em bottom sheet", async ({ page }) => {
    const title = `Phone E2E ${Date.now()}`;
    await page.getByRole("button", { name: "Nova tarefa" }).last().click();

    const dialog = page.locator(".task-dialog[open]");
    await expect(dialog).toBeVisible();
    await expect(dialog.locator(".modal-title")).toHaveText("Nova tarefa");
    await expect(dialog.locator(".task-form-submit")).toBeVisible();

    await dialog.locator("#new-task-title").fill(title);
    await dialog.getByRole("button", { name: "Criar", exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(page.locator(".task-card", { hasText: title })).toBeVisible();
  });

  test("menu ⋯ edita no sheet e navega sem tabela comprimida", async ({ page }) => {
    const title = `Card E2E ${Date.now()}`;
    await page.getByRole("button", { name: "Nova tarefa" }).last().click();
    const create = page.locator(".task-dialog[open]");
    await create.locator("#new-task-title").fill(title);
    await create.getByRole("button", { name: "Criar", exact: true }).click();

    const card = page.locator(".task-card", { hasText: title });
    await expect(card).toBeVisible();
    await card.getByRole("button", { name: `Mais ações para ${title}` }).click();
    await page.getByRole("menuitem", { name: "Editar" }).click();

    const edit = page.locator(".task-dialog[open]");
    await expect(edit.locator(".modal-title")).toHaveText("Editar tarefa");
    const updated = `${title} editada`;
    await edit.locator('input[name="title"]').fill(updated);
    await edit.getByRole("button", { name: "Salvar", exact: true }).click();
    await expect(page.locator(".task-card", { hasText: updated })).toBeVisible();

    await page.getByRole("navigation", { name: "Navegação do telefone" }).getByRole("link", { name: "Projetos" }).click();
    await expect(page.locator(".phone-page-title")).toHaveText("Projetos");
    await expect(page.locator(".issue-head")).toHaveCount(0);

    await page.getByRole("navigation", { name: "Navegação do telefone" }).getByRole("link", { name: "Tempo" }).click();
    await expect(page.locator(".time-report")).toBeVisible();
  });
});
