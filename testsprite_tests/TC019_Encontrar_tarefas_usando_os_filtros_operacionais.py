import asyncio
import re
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None

    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()

        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",
                "--disable-dev-shm-usage",
                "--ipc=host",
                "--single-process"
            ],
        )

        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        # Wider default timeout to match the agent's DOM-stability budget;
        # auto-waiting Playwright APIs (expect, locator.wait_for) inherit this.
        context.set_default_timeout(15000)

        # Open a new page in the browser context
        page = await context.new_page()

        # Interact with the page elements to simulate user flow
        # -> navigate
        await page.goto("http://localhost:3000/login")
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=5000)
        except Exception:
            pass
        
        # -> Preencher o campo Email com 'arthur@remind.local', preencher o campo Senha com 'remind123' e clicar no botão 'Entrar'.
        # voce@remind.local email field
        elem = page.locator('[id="email"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("arthur@remind.local")
        
        # -> Preencher o campo Email com 'arthur@remind.local', preencher o campo Senha com 'remind123' e clicar no botão 'Entrar'.
        # Sua senha password field
        elem = page.locator('[id="password"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("remind123")
        
        # -> Preencher o campo Email com 'arthur@remind.local', preencher o campo Senha com 'remind123' e clicar no botão 'Entrar'.
        # Entrar button
        elem = page.get_by_role('button', name='Entrar', exact=True)
        await elem.click(timeout=10000)
        
        # -> Type 'E2E' into the search field labeled 'Buscar tarefa ou projeto...' to narrow the task list by text.
        # Buscar tarefa text field
        elem = page.get_by_label('Buscar tarefa', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("E2E")
        
        # -> Open the 'Filtrar por status' dropdown so its options (Todos os status, A fazer, Em andamento, Concluída) are visible.
        # Todos os status A fazer Em andamento Concluída dropdown
        elem = page.get_by_label('Filtrar por status', exact=True)
        await elem.click(timeout=10000)
        
        # -> Select 'A fazer' in the 'Filtrar por status' dropdown and verify the UI updates.
        # Todos os status A fazer Em andamento Concluída dropdown
        elem = page.locator("xpath=/html/body/div[2]/div/main/div/div[3]/select[2]").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.select_option("")
        
        # -> Open the 'Filtrar por projeto' dropdown and select the 'Testando' project.
        # Todos os projetos Teste Projeto Testando Testando... dropdown
        elem = page.locator("xpath=/html/body/div[2]/div/main/div/div[3]/select").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.select_option("")
        
        # -> Select the 'Alta' option in the 'Filtrar por prioridade' dropdown.
        # Todas as prioridades Alta Média Baixa dropdown
        elem = page.locator("xpath=/html/body/div[2]/div/main/div/div[3]/select[3]").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.select_option("")
        
        # -> Select the 'Alta' option in the 'Filtrar por prioridade' dropdown.
        # Todos os prazos Atrasadas Vencendo Sem prazo dropdown
        elem = page.locator("xpath=/html/body/div[2]/div/main/div/div[3]/select[4]").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.select_option("")
        
        # --> Assertions to verify final state
        
        # --> Verify the task list is narrowed by the selected filters
        # Assert: URL shows the selected search, status, project, priority and due filters.
        await expect(page).to_have_url(re.compile("search=E2E\\&status=todo\\&projectId=d0537f8f\\-e89c\\-4179\\-94a4\\-7c8ebd3bc937\\&priority=high\\&due=none"), timeout=15000), "URL shows the selected search, status, project, priority and due filters."
        # Assert: The search field contains 'E2E'.
        await expect(page.locator("xpath=/html/body/div[2]/div/main/div/div[3]/div/input").nth(0)).to_have_value("E2E", timeout=15000), "The search field contains 'E2E'."
        # Assert: The visible task row shows status 'A fazer'.
        await expect(page.locator("xpath=/html/body/div[2]/div/main/div/div[5]/article/div[3]/span").nth(0)).to_have_text("A fazer", timeout=15000), "The visible task row shows status 'A fazer'."
        # Assert: The visible task row shows priority 'Alta'.
        await expect(page.locator("xpath=/html/body/div[2]/div/main/div/div[5]/article/div[4]/span").nth(0)).to_have_text("Alta", timeout=15000), "The visible task row shows priority 'Alta'."
        
        # --> Verify the filtered results remain visible
        await page.locator("xpath=/html/body/div[2]/div/main/div/div[5]/article/div[6]/button").nth(0).scroll_into_view_if_needed()
        # Assert: The filtered task row's edit button is visible, indicating the filtered result remains visible.
        await expect(page.locator("xpath=/html/body/div[2]/div/main/div/div[5]/article/div[6]/button").nth(0)).to_be_visible(timeout=15000), "The filtered task row's edit button is visible, indicating the filtered result remains visible."
        # Assert: The filtered task's edit button has the expected aria-label with the task title.
        await expect(page.locator("xpath=/html/body/div[2]/div/main/div/div[5]/article/div[6]/button").nth(0)).to_have_attribute("aria-label", "Editar tarefa Tarefa E2E 1785976975332 - edit", timeout=15000), "The filtered task's edit button has the expected aria-label with the task title."
        # Assert: The filtered task displays the status 'A fazer'.
        await expect(page.locator("xpath=/html/body/div[2]/div/main/div/div[5]/article/div[3]/span").nth(0)).to_have_text("A fazer", timeout=15000), "The filtered task displays the status 'A fazer'."
        # Assert: The filtered task displays the priority 'Alta'.
        await expect(page.locator("xpath=/html/body/div[2]/div/main/div/div[5]/article/div[4]/span").nth(0)).to_have_text("Alta", timeout=15000), "The filtered task displays the priority 'Alta'."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    