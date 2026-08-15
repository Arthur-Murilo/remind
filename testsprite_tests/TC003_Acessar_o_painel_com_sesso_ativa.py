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
        
        # -> Fill 'arthur@remind.local' into the Email field, 'remind123' into the Senha field, then click the 'Entrar' button.
        # voce@remind.local email field
        elem = page.locator('[id="email"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("arthur@remind.local")
        
        # -> Fill 'arthur@remind.local' into the Email field, 'remind123' into the Senha field, then click the 'Entrar' button.
        # Sua senha password field
        elem = page.locator('[id="password"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("remind123")
        
        # -> Fill 'arthur@remind.local' into the Email field, 'remind123' into the Senha field, then click the 'Entrar' button.
        # Entrar button
        elem = page.get_by_role('button', name='Entrar', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify the dashboard with daily metrics is displayed
        # Assert: URL contém '/app', indicando que o dashboard foi aberto.
        await expect(page).to_have_url(re.compile("/app"), timeout=15000), "URL cont\u00e9m '/app', indicando que o dashboard foi aberto."
        # Assert: Cartão 'Tarefas abertas' está visível com contagem 7.
        await expect(page.locator("xpath=/html/body/div[3]/div/main/div/div[2]/a[1]").nth(0)).to_have_text("Tarefas abertas\n\ud83d\udccb\n7", timeout=15000), "Cart\u00e3o 'Tarefas abertas' est\u00e1 vis\u00edvel com contagem 7."
        # Assert: Cartão 'Vencendo em breve' está visível com contagem 0.
        await expect(page.locator("xpath=/html/body/div[3]/div/main/div/div[2]/a[2]").nth(0)).to_have_text("Vencendo em breve\n\u23f3\n0", timeout=15000), "Cart\u00e3o 'Vencendo em breve' est\u00e1 vis\u00edvel com contagem 0."
        # Assert: Cartão 'Atrasadas' está visível com contagem 2.
        await expect(page.locator("xpath=/html/body/div[3]/div/main/div/div[2]/a[3]").nth(0)).to_have_text("Atrasadas\n\u26a0\ufe0f\n2", timeout=15000), "Cart\u00e3o 'Atrasadas' est\u00e1 vis\u00edvel com contagem 2."
        
        # --> Verify the task list is displayed
        # Assert: O botão de editar para 'Tarefa Editada 1785976981693' está presente na lista de tarefas.
        await expect(page.locator("xpath=/html/body/div[3]/div/main/div/div[5]/article[1]/div[6]/button").nth(0)).to_have_attribute("aria-label", "Editar tarefa Tarefa Editada 1785976981693", timeout=15000), "O bot\u00e3o de editar para 'Tarefa Editada 1785976981693' est\u00e1 presente na lista de tarefas."
        # Assert: O botão de editar para 'Definir critérios dos lembretes' está presente na lista de tarefas.
        await expect(page.locator("xpath=/html/body/div[3]/div/main/div/div[5]/article[2]/div[6]/button").nth(0)).to_have_attribute("aria-label", "Editar tarefa Definir crit\u00e9rios dos lembretes", timeout=15000), "O bot\u00e3o de editar para 'Definir crit\u00e9rios dos lembretes' est\u00e1 presente na lista de tarefas."
        # Assert: O botão de editar para 'Tarefa E2E 1785976975332' está presente na lista de tarefas.
        await expect(page.locator("xpath=/html/body/div[3]/div/main/div/div[5]/article[4]/div[6]/button").nth(0)).to_have_attribute("aria-label", "Editar tarefa Tarefa E2E 1785976975332", timeout=15000), "O bot\u00e3o de editar para 'Tarefa E2E 1785976975332' est\u00e1 presente na lista de tarefas."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    