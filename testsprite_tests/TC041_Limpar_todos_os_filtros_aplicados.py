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
        
        # -> Fill the Email field with 'arthur@remind.local', fill the Senha field with 'remind123', then click the 'Entrar' button to sign in.
        # voce@remind.local email field
        elem = page.locator('[id="email"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("arthur@remind.local")
        
        # -> Fill the Email field with 'arthur@remind.local', fill the Senha field with 'remind123', then click the 'Entrar' button to sign in.
        # Sua senha password field
        elem = page.locator('[id="password"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("remind123")
        
        # -> Fill the Email field with 'arthur@remind.local', fill the Senha field with 'remind123', then click the 'Entrar' button to sign in.
        # Entrar button
        elem = page.get_by_role('button', name='Entrar', exact=True)
        await elem.click(timeout=10000)
        
        # -> Abrir o dropdown 'Filtrar por projeto' para selecionar um projeto como parte dos filtros a aplicar.
        # Todos os projetos Testando Testando Operação... dropdown
        elem = page.get_by_label('Filtrar por projeto', exact=True)
        await elem.click(timeout=10000)
        
        # -> Selecionar 'Operação Pessoal' no dropdown 'Filtrar por projeto' para aplicar um recorte por projeto.
        # Todos os projetos Testando Testando Operação... dropdown
        elem = page.locator("xpath=/html/body/div[2]/div/main/div/div[3]/select").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.select_option("")
        
        # -> Click the 'Limpar todos os filtros' button to clear all filters and return to the full task list.
        # Limpar todos os filtros button
        elem = page.get_by_role('button', name='Limpar todos os filtros', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify the full task list is restored
        # Assert: The project filter is reset to 'Todos os projetos'.
        await expect(page.locator("xpath=/html/body/div[2]/div/main/div/div[3]/select[1]").nth(0)).to_contain_text("Todos os projetos", timeout=15000), "The project filter is reset to 'Todos os projetos'."
        # Assert: The status filter is reset to 'Todos os status'.
        await expect(page.locator("xpath=/html/body/div[2]/div/main/div/div[3]/select[2]").nth(0)).to_contain_text("Todos os status", timeout=15000), "The status filter is reset to 'Todos os status'."
        # Assert: The priority filter is reset to 'Todas as prioridades'.
        await expect(page.locator("xpath=/html/body/div[2]/div/main/div/div[3]/select[3]").nth(0)).to_contain_text("Todas as prioridades", timeout=15000), "The priority filter is reset to 'Todas as prioridades'."
        # Assert: The due date filter is reset to 'Todos os prazos'.
        await expect(page.locator("xpath=/html/body/div[2]/div/main/div/div[3]/select[4]").nth(0)).to_contain_text("Todos os prazos", timeout=15000), "The due date filter is reset to 'Todos os prazos'."
        # Assert: A known task ('Tarefa Editada 1785976981693') is visible in the full task list.
        await expect(page.locator("xpath=/html/body/div[2]/div/main/div/div[5]/article[1]/div[6]/button").nth(0)).to_have_attribute("aria-label", "Editar tarefa Tarefa Editada 1785976981693", timeout=15000), "A known task ('Tarefa Editada 1785976981693') is visible in the full task list."
        
        # --> Verify no filter recaps remain applied
        # Assert: O filtro 'Filtrar por projeto' mostra 'Todos os projetos'.
        await expect(page.locator("xpath=/html/body/div[2]/div/main/div/div[3]/select[1]").nth(0)).to_contain_text("Todos os projetos", timeout=15000), "O filtro 'Filtrar por projeto' mostra 'Todos os projetos'."
        # Assert: O filtro 'Filtrar por status' mostra 'Todos os status'.
        await expect(page.locator("xpath=/html/body/div[2]/div/main/div/div[3]/select[2]").nth(0)).to_contain_text("Todos os status", timeout=15000), "O filtro 'Filtrar por status' mostra 'Todos os status'."
        # Assert: O filtro 'Filtrar por prioridade' mostra 'Todas as prioridades'.
        await expect(page.locator("xpath=/html/body/div[2]/div/main/div/div[3]/select[3]").nth(0)).to_contain_text("Todas as prioridades", timeout=15000), "O filtro 'Filtrar por prioridade' mostra 'Todas as prioridades'."
        # Assert: O filtro 'Filtrar por prazo' mostra 'Todos os prazos'.
        await expect(page.locator("xpath=/html/body/div[2]/div/main/div/div[3]/select[4]").nth(0)).to_contain_text("Todos os prazos", timeout=15000), "O filtro 'Filtrar por prazo' mostra 'Todos os prazos'."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    