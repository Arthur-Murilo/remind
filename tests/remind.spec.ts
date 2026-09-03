import { test, expect } from "@playwright/test";

async function openCreateDetails(page: import("@playwright/test").Page) {
  await page.getByRole("button", { name: "Detalhes" }).click();
  await expect(page.locator(".modal-title")).toHaveText("Criar Nova Tarefa");
}

async function pickRelativeDate(page: import("@playwright/test").Page, daysFromToday: number) {
  await page.locator(".modal-body").getByRole("button", { name: "Selecionar prazo" }).click();
  const popover = page.locator(".date-popover");
  const target = new Date();
  target.setDate(target.getDate() + daysFromToday);
  const targetMonth = new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(target);

  for (let step = 0; step < 14; step += 1) {
    const shown = ((await popover.locator("strong").textContent()) || "").toLowerCase();
    if (shown === targetMonth.toLowerCase()) break;
    if (daysFromToday < 0) {
      await popover.getByRole("button", { name: "Mês anterior" }).click();
    } else {
      await popover.getByRole("button", { name: "Próximo mês" }).click();
    }
  }

  await popover
    .locator(".date-cell:not(.muted)")
    .filter({ hasText: new RegExp(`^${target.getDate()}$`) })
    .click();
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
    await expect(page.locator(".brand-mark svg")).toBeVisible();
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
    const original = `Rename base ${Date.now()}`;
    await page.getByLabel("Título da nova tarefa").fill(original);
    await page.getByRole("button", { name: "Criar", exact: true }).click();
    const title = page.locator(".issue-title-main strong", { hasText: original });
    await expect(title).toBeVisible();

    const next = `Rename ${Date.now()}`;
    await title.dblclick();
    const input = page.getByLabel("Editar título da tarefa");
    await expect(input).toBeVisible();
    await input.fill(next);
    await input.press("Enter");
    await expect(page.locator(".issue-title-main strong", { hasText: next })).toBeVisible();
  });

  test("deve autoajustar e permitir redimensionar a coluna de tarefa", async ({ page }) => {
    await page.evaluate(() => localStorage.removeItem("remind-column-widths-v4"));
    await page.reload();
    await expect(page.locator("h1")).toBeVisible();

    const header = page.locator(".issue-head .col-head", { hasText: "Tarefa" });
    const longTitle = `Tarefa ${"W".repeat(70)} ${Date.now()}`;

    await page.getByLabel("Título da nova tarefa").fill(longTitle);
    await page.getByRole("button", { name: "Criar", exact: true }).click();
    await expect(page.locator(".issue-title-main strong", { hasText: longTitle })).toBeVisible();
    await page.waitForTimeout(80);

    const automatic = await header.boundingBox();
    expect(automatic!.width).toBeGreaterThan(360);

    const handle = header.locator(".col-resize-handle");
    const handleBox = await handle.boundingBox();
    await page.mouse.move(handleBox!.x + handleBox!.width / 2, handleBox!.y + handleBox!.height / 2);
    await page.mouse.down();
    await page.mouse.move(handleBox!.x + 42, handleBox!.y + handleBox!.height / 2);
    await page.mouse.up();

    const manual = await header.boundingBox();
    expect(manual!.width).toBeGreaterThan(automatic!.width + 20);
  });

  test("deve iniciar o timer, mostrar tempo acumulado e alternar o gráfico", async ({ page }) => {
    const timer = page.getByRole("button", { name: "Iniciar cronômetro" }).first();
    await timer.click();
    const stop = page.getByRole("button", { name: "Parar cronômetro" }).first();
    await expect(stop).toBeVisible();
    await page.waitForTimeout(1100);
    await stop.click();
    await expect(page.getByRole("button", { name: "Ajustar tempo da tarefa" }).first()).not.toHaveText("0:00");
    await expect(page.locator(".task-time-chip").first()).toBeVisible();

    await page.getByRole("link", { name: "Tempo", exact: true }).click();
    await expect(page.locator("h1")).toHaveText("Tempo");
    await expect(page.getByRole("group", { name: "Período" })).toBeVisible();
    await expect(page.getByRole("group", { name: "Agrupar gráfico" })).toBeVisible();
    await expect(page.locator(".time-bar-fill").first()).toBeVisible();
    await page.getByRole("button", { name: "Por tarefa" }).click();
    await expect(page.locator(".time-section-heading")).toContainText("Tarefas");
    await expect(page).toHaveURL(/group=task/);
    await expect(page.getByRole("heading", { name: "Sessões" })).toBeVisible();
  });

  test("deve remover o lembrete ao concluir a tarefa", async ({ page }) => {
    const title = `Lembrete concluído ${Date.now()}`;
    await openCreateDetails(page);
    await page.fill("#new-task-title", title);
    await page.getByRole("button", { name: "Selecionar prazo" }).click();
    await page.locator(".date-popover").getByRole("button", { name: "Hoje" }).click();
    await page.getByRole("button", { name: "Criar Tarefa" }).click();

    const bell = page.locator(".notification-bell-btn");
    await bell.click();
    await expect(page.locator(".notification-item", { hasText: title })).toBeVisible();
    await bell.click();

    const taskRow = page.locator(".issue-row", { hasText: title });
    await taskRow.locator(".task-checkbox").click();
    await bell.click();
    await expect(page.locator(".notification-item", { hasText: title })).toHaveCount(0);

    await page.locator('a.metric-pill[href="/app?due=soon"]').click();
    await expect(page.locator("h1")).toHaveText("Lembretes");
    await expect(page.locator(".issue-title-main strong", { hasText: title })).toHaveCount(0);
  });

  test("deve abrir o menu em viewport móvel", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const viewport = page.viewportSize()!;
    const menu = page.getByRole("button", { name: "Abrir menu" });
    await expect(menu).toBeVisible();
    await expect(page.locator(".sidebar .brand-name")).not.toBeInViewport();

    const metrics = await page.locator(".metrics-strip").boundingBox();
    expect(metrics!.width).toBeLessThanOrEqual(viewport.width);

    await page.getByLabel("Buscar tarefa").fill("zzzz-sem-resultado");
    const empty = page.locator(".empty-state");
    await expect(empty.getByText("Limpe os filtros ou crie uma tarefa dentro de um projeto.")).toBeVisible();
    const emptyBox = await empty.boundingBox();
    expect(emptyBox!.x + emptyBox!.width).toBeLessThanOrEqual(viewport.width + 1);

    await menu.click();
    await expect(page.locator(".sidebar .brand-name")).toBeInViewport();
    await expect(page.getByRole("link", { name: "Meu dia" })).toBeVisible();

    await page.getByRole("link", { name: "Tempo", exact: true }).click();
    await expect(page.locator("h1")).toHaveText("Tempo");
    await expect(page.getByRole("button", { name: "Abrir menu" })).toBeVisible();
    await expect(page.locator(".time-report")).toBeVisible();
  });

  test("concluir subtarefas não fecha a tarefa; concluir a pai fecha as subtarefas", async ({ page }) => {
    const title = `Cascata ${Date.now()}`;
    await page.getByLabel("Título da nova tarefa").fill(title);
    await page.getByRole("button", { name: "Criar", exact: true }).click();

    const row = page.locator(".issue-row", { hasText: title });
    await expect(row.locator(".issue-title-main strong")).toHaveText(title);

    await row.locator(".asana-caret-btn").click();
    const input = row.getByLabel("Nova subtarefa");
    await input.fill("Passo 1");
    await input.press("Enter");
    await expect(row.locator(".asana-subtask-title", { hasText: "Passo 1" })).toBeVisible();
    await input.fill("Passo 2");
    await input.press("Enter");
    await expect(row.locator(".asana-subtask-title", { hasText: "Passo 2" })).toBeVisible();

    const subChecks = row.locator(".asana-subtask-row .task-checkbox");
    await subChecks.nth(0).click();
    await expect(row.locator(".asana-subtask-row.done")).toHaveCount(1);
    await row.locator(".asana-subtask-row:not(.done) .task-checkbox").click();
    await expect(row.locator(".asana-subtask-row.done")).toHaveCount(2);
    await expect(row.locator(".col-check .task-checkbox")).not.toHaveClass(/checked/);
    await expect(row.getByRole("button", { name: "Marcar como concluída" })).toBeVisible();
    await expect(row.locator(".issue-title-main strong")).toHaveCSS("text-decoration-line", "none");

    await row.locator(".col-check .task-checkbox").click();
    await expect(row.locator(".col-check .task-checkbox")).toHaveClass(/checked/);
    await expect(row.locator(".issue-title-main strong")).toHaveCSS("text-decoration-line", "line-through");
    await expect(row.locator(".asana-subtask-row.done")).toHaveCount(2);
    await expect(row.locator(".asana-subtask-row .task-checkbox.checked")).toHaveCount(2);
  });

  test("sininho só mostra prazo de hoje em amarelo e atrasado em vermelho", async ({ page }) => {
    const suffix = Date.now();
    const futureTitle = `Futuro ${suffix}`;
    const todayTitle = `Hoje ${suffix}`;
    const overdueTitle = `Atrasada ${suffix}`;

    await openCreateDetails(page);
    await page.fill("#new-task-title", futureTitle);
    await pickRelativeDate(page, 7);
    await page.click('button:has-text("Criar Tarefa")');
    await expect(page.locator(".issue-title-main strong", { hasText: futureTitle })).toBeVisible();

    await openCreateDetails(page);
    await page.fill("#new-task-title", todayTitle);
    await page.locator(".modal-body").getByRole("button", { name: "Selecionar prazo" }).click();
    await page.locator(".date-popover").getByRole("button", { name: "Hoje" }).click();
    await page.click('button:has-text("Criar Tarefa")');
    await expect(page.locator(".issue-title-main strong", { hasText: todayTitle })).toBeVisible();

    await openCreateDetails(page);
    await page.fill("#new-task-title", overdueTitle);
    await pickRelativeDate(page, -1);
    await page.click('button:has-text("Criar Tarefa")');
    await expect(page.locator(".issue-title-main strong", { hasText: overdueTitle })).toBeVisible();

    const bell = page.locator(".notification-bell-btn");
    await bell.click();
    const dropdown = page.locator(".notification-dropdown");
    await expect(dropdown).toBeVisible();
    await expect(dropdown.locator(".notification-item", { hasText: futureTitle })).toHaveCount(0);

    const todayItem = dropdown.locator(".notification-item", { hasText: todayTitle });
    const overdueItem = dropdown.locator(".notification-item", { hasText: overdueTitle });
    await todayItem.scrollIntoViewIfNeeded();
    await expect(todayItem).toBeVisible();
    await expect(todayItem.locator(".due-tag")).toHaveClass(/due-today/);
    await overdueItem.scrollIntoViewIfNeeded();
    await expect(overdueItem).toBeVisible();
    await expect(overdueItem.locator(".due-tag")).toHaveClass(/due-overdue/);
    await bell.click();

    await expect(page.locator(".issue-row", { hasText: todayTitle }).locator(".date-trigger")).toHaveClass(/due-today/);
    await expect(page.locator(".issue-row", { hasText: overdueTitle }).locator(".date-trigger")).toHaveClass(/due-overdue/);
    await expect(page.locator(".issue-row", { hasText: futureTitle }).locator(".date-trigger")).not.toHaveClass(/due-today|due-overdue/);
  });

  test("reordenar prioridade customizada coloca as tarefas no topo", async ({ page }) => {
    const suffix = Date.now();
    const priorityLabel = `Urgente ${suffix}`;
    const title = `Topo ${suffix}`;

    await page.getByLabel("Título da nova tarefa").fill(title);
    await page.getByRole("button", { name: "Criar", exact: true }).click();
    const row = page.locator(".issue-row", { hasText: title });
    await expect(row.locator(".issue-title-main strong")).toHaveText(title);

    await row.scrollIntoViewIfNeeded();
    await row.getByRole("button", { name: "Alterar prioridade" }).click();
    const menu = page.locator(".catalog-menu");
    await expect(menu).toBeVisible();
    await menu.getByPlaceholder("Nova prioridade...").fill(priorityLabel);
    await menu.getByRole("button", { name: "Criar" }).click({ force: true });
    await expect(menu.locator(".catalog-menu-pick", { hasText: priorityLabel })).toBeVisible();
    await menu.locator(".catalog-menu-pick", { hasText: priorityLabel }).click();
    await expect(row.locator(".catalog-badge", { hasText: priorityLabel })).toBeVisible();

    await row.getByRole("button", { name: "Alterar prioridade" }).click();
    const handle = page.getByRole("button", { name: `Reordenar ${priorityLabel}` });
    await expect(handle).toBeVisible();
    for (let step = 0; step < 8; step += 1) {
      const firstRow = page.locator(".catalog-menu-row").first();
      if ((await firstRow.innerText()).includes(priorityLabel)) break;
      await page.getByRole("button", { name: `Reordenar ${priorityLabel}` }).press("ArrowUp");
    }
    await expect(page.locator(".catalog-menu-row").first()).toContainText(priorityLabel);
    await page.keyboard.press("Escape");

    await expect(page.locator(".issue-row").first().locator(".issue-title-main strong")).toHaveText(title);
  });
});
