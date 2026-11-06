import { test, expect } from "@playwright/test";

test.describe("Captura, paleta, ritual e foco", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[name="email"]', "arthur@remind.local");
    await page.fill('input[name="password"]', "remind123");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/app/);
  });

  test("captura rápida entende a sintaxe e cria a tarefa limpa", async ({ page }) => {
    const title = `Sintaxe ${Date.now()}`;
    const input = page.getByLabel("Título da nova tarefa");
    await input.fill(`${title} hoje !alta ~20min`);
    const preview = page.locator("#quick-create-preview");
    await expect(preview).toContainText("Hoje");
    await expect(preview).toContainText("Alta");
    await expect(preview).toContainText("20min");
    await input.press("Enter");

    const row = page.locator(".issue-row", { hasText: title });
    await expect(row).toBeVisible();
    await expect(row.locator(".issue-title-main strong")).toHaveText(title);
    await expect(row.locator(".timer-estimate")).toHaveText(" / 20min");
  });

  test("paleta navega, cria com sintaxe e fecha com Esc", async ({ page }) => {
    await page.keyboard.press("Control+k");
    const palette = page.getByRole("dialog", { name: "Paleta de comandos" });
    await expect(palette).toBeVisible();
    await page.getByLabel("Comando ou nova tarefa").fill("tempo");
    await expect(palette.locator(".palette-item").first()).toHaveText("Tempo");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(/\/app\/tempo/);

    const title = `Paleta ${Date.now()}`;
    await page.getByRole("button", { name: /Abrir paleta de comandos/ }).click();
    await page.getByLabel("Comando ou nova tarefa").fill(`${title} amanhã ~1h`);
    await expect(palette.locator(".palette-item").first()).toContainText(`Criar tarefa “${title}”`);
    await page.keyboard.press("Enter");
    await expect(palette.locator(".palette-message")).toContainText(title);
    await page.keyboard.press("Escape");
    await expect(palette).toHaveCount(0);
  });

  test("planejar e encerrar o dia", async ({ page }) => {
    await page.goto("/app/dia?modo=planejar");
    await expect(page.getByRole("heading", { name: "Planejar o dia" })).toBeVisible();
    await expect(page.locator(".load-numbers")).toContainText("previstas para hoje");
    await page.getByLabel("Intenção do dia").fill("Testar o ritual");
    await page.getByRole("button", { name: /Começar o dia|Salvar e voltar/ }).click();
    await expect(page).toHaveURL(/\/app$/);

    await page.goto("/app/dia?modo=encerrar");
    await expect(page.getByRole("heading", { name: "Encerrar o dia" })).toBeVisible();
    await expect(page.locator(".ritual-summary-intention")).toContainText("Testar o ritual");
    await page.getByLabel("Destaque 1").fill("Ritual testado");
    await page.locator(".ritual-highlights button[type=submit]").click();
    await expect(page.locator(".ritual-highlights .tempo-card-meta")).toContainText("encerrado às");
  });

  test("modo foco a partir do tempo da tarefa", async ({ page }) => {
    const title = `Foco ${Date.now()}`;
    await page.getByLabel("Título da nova tarefa").fill(`${title} hoje`);
    await page.getByLabel("Título da nova tarefa").press("Enter");
    const row = page.locator(".issue-row", { hasText: title });
    await expect(row).toBeVisible();

    await row.getByRole("button", { name: "Ajustar tempo da tarefa" }).click();
    await page.locator(".timer-menu").getByRole("button", { name: "Foco 25 min" }).click();
    const panel = page.getByRole("dialog", { name: "Modo foco" });
    await expect(panel).toBeVisible();
    await expect(panel).toContainText(title);
    await expect(page.locator(".running-timer.focus")).toBeVisible();
    await expect(page).toHaveTitle(/⏳ 2\d:\d\d/);

    await panel.getByRole("button", { name: "Encerrar foco" }).click();
    await expect(panel).toHaveCount(0);
    await expect(page.locator(".running-timer")).toHaveCount(0);
  });
});
