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
        
        # --> Assertions to verify final state
        
        # --> Verify the user lands on the dashboard
        # Assert: URL contains '/app', confirming the dashboard route is loaded.
        await expect(page).to_have_url(re.compile("/app"), timeout=15000), "URL contains '/app', confirming the dashboard route is loaded."
        await page.locator("xpath=/html/body/div[3]/aside/nav/a").nth(0).scroll_into_view_if_needed()
        # Assert: The 'Meu dia' navigation/header is visible on the dashboard.
        await expect(page.locator("xpath=/html/body/div[3]/aside/nav/a").nth(0)).to_be_visible(timeout=15000), "The 'Meu dia' navigation/header is visible on the dashboard."
        await page.locator("xpath=/html/body/div[3]/div/main/div/div[2]/a[1]").nth(0).scroll_into_view_if_needed()
        # Assert: The 'Tarefas abertas' metric card is visible on the dashboard.
        await expect(page.locator("xpath=/html/body/div[3]/div/main/div/div[2]/a[1]").nth(0)).to_be_visible(timeout=15000), "The 'Tarefas abertas' metric card is visible on the dashboard."
        
        # --> Verify the daily metrics and task list are displayed
        # Assert: The 'Tarefas abertas' metric card is visible and shows 7.
        await expect(page.locator("xpath=/html/body/div[3]/div/main/div/div[2]/a[1]").nth(0)).to_have_text("Tarefas abertas\n\ud83d\udccb\n7", timeout=15000), "The 'Tarefas abertas' metric card is visible and shows 7."
        # Assert: The 'Vencendo em breve' metric card is visible and shows 0.
        await expect(page.locator("xpath=/html/body/div[3]/div/main/div/div[2]/a[2]").nth(0)).to_have_text("Vencendo em breve\n\u23f3\n0", timeout=15000), "The 'Vencendo em breve' metric card is visible and shows 0."
        # Assert: The 'Atrasadas' metric card is visible and shows 2.
        await expect(page.locator("xpath=/html/body/div[3]/div/main/div/div[2]/a[3]").nth(0)).to_have_text("Atrasadas\n\u26a0\ufe0f\n2", timeout=15000), "The 'Atrasadas' metric card is visible and shows 2."
        # Assert: A task row is displayed (edit button for 'Tarefa Editada 1785976981693' is present).
        await expect(page.locator("xpath=/html/body/div[3]/div/main/div/div[5]/article[1]/div[6]/button").nth(0)).to_have_attribute("aria-label", "Editar tarefa Tarefa Editada 1785976981693", timeout=15000), "A task row is displayed (edit button for 'Tarefa Editada 1785976981693' is present)."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    