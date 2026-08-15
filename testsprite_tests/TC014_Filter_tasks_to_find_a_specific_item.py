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
        
        # -> Fill 'arthur@remind.local' into the Email field, fill 'remind123' into the Senha field, then click the 'Entrar' button to submit the login form.
        # voce@remind.local email field
        elem = page.locator('[id="email"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("arthur@remind.local")
        
        # -> Fill 'arthur@remind.local' into the Email field, fill 'remind123' into the Senha field, then click the 'Entrar' button to submit the login form.
        # Sua senha password field
        elem = page.locator('[id="password"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("remind123")
        
        # -> Fill 'arthur@remind.local' into the Email field, fill 'remind123' into the Senha field, then click the 'Entrar' button to submit the login form.
        # Entrar button
        elem = page.get_by_role('button', name='Entrar', exact=True)
        await elem.click(timeout=10000)
        
        # -> Enter 'Rotina Diaria' into the search box and set the 'Filtrar por status' dropdown to 'A fazer' to narrow the task list.
        # Buscar tarefa text field
        elem = page.get_by_label('Buscar tarefa', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Rotina Diaria")
        
        # -> Enter 'Rotina Diaria' into the search box and set the 'Filtrar por status' dropdown to 'A fazer' to narrow the task list.
        # Todos os status A fazer Em andamento Concluída dropdown
        elem = page.locator("xpath=/html/body/div[2]/div/main/div/div[3]/select[2]").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.select_option("")
        
        # --> Assertions to verify final state
        
        # --> Verify the task list is narrowed to matching results
        # Assert: Search box is set to 'Rotina Diaria'.
        await expect(page.locator("xpath=/html/body/div[2]/div/main/div/div[3]/div/input").nth(0)).to_have_value("Rotina Diaria", timeout=15000), "Search box is set to 'Rotina Diaria'."
        # Assert: URL contains 'status=todo', indicating the 'A fazer' filter is active.
        await expect(page).to_have_url(re.compile("status=todo"), timeout=15000), "URL contains 'status=todo', indicating the 'A fazer' filter is active."
        # Assert: An edit button exists for the task titled 'Rotina Diaria 1785976991268'.
        await expect(page.locator("xpath=/html/body/div[2]/div/main/div/div[5]/article/div[6]/button").nth(0)).to_have_attribute("aria-label", "Editar tarefa Rotina Diaria 1785976991268", timeout=15000), "An edit button exists for the task titled 'Rotina Diaria 1785976991268'."
        # Assert: The task's status badge reads 'A fazer'.
        await expect(page.locator("xpath=/html/body/div[2]/div/main/div/div[5]/article/div[3]/span[1]").nth(0)).to_have_text("A fazer", timeout=15000), "The task's status badge reads 'A fazer'."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    