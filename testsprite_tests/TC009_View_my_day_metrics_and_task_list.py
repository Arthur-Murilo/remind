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
        
        # -> Fill the 'Email' field with arthur@remind.local, fill the 'Senha' field with remind123, then click the 'Entrar' button to sign in.
        # voce@remind.local email field
        elem = page.locator('[id="email"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("arthur@remind.local")
        
        # -> Fill the 'Email' field with arthur@remind.local, fill the 'Senha' field with remind123, then click the 'Entrar' button to sign in.
        # Sua senha password field
        elem = page.locator('[id="password"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("remind123")
        
        # -> Fill the 'Email' field with arthur@remind.local, fill the 'Senha' field with remind123, then click the 'Entrar' button to sign in.
        # Entrar button
        elem = page.get_by_role('button', name='Entrar', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify daily metrics are displayed
        # Assert: The 'Tarefas abertas' daily metric is displayed.
        await expect(page.locator("xpath=/html/body/div[3]/div/main/div/div[2]/a[1]").nth(0)).to_contain_text("Tarefas abertas", timeout=15000), "The 'Tarefas abertas' daily metric is displayed."
        # Assert: The 'Vencendo em breve' daily metric is displayed.
        await expect(page.locator("xpath=/html/body/div[3]/div/main/div/div[2]/a[2]").nth(0)).to_contain_text("Vencendo em breve", timeout=15000), "The 'Vencendo em breve' daily metric is displayed."
        # Assert: The 'Atrasadas' daily metric is displayed.
        await expect(page.locator("xpath=/html/body/div[3]/div/main/div/div[2]/a[3]").nth(0)).to_contain_text("Atrasadas", timeout=15000), "The 'Atrasadas' daily metric is displayed."
        
        # --> Verify the task list is displayed
        # Assert: The 'Tarefas abertas' metric header is visible, indicating the task list section is present.
        await expect(page.locator("xpath=/html/body/div[3]/div/main/div/div[2]/a[1]").nth(0)).to_contain_text("Tarefas abertas", timeout=15000), "The 'Tarefas abertas' metric header is visible, indicating the task list section is present."
        # Assert: At least one task row is displayed (a task with status 'A fazer' is visible).
        await expect(page.locator("xpath=/html/body/div[3]/div/main/div/div[5]/article[1]/div[3]/span").nth(0)).to_have_text("A fazer", timeout=15000), "At least one task row is displayed (a task with status 'A fazer' is visible)."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    