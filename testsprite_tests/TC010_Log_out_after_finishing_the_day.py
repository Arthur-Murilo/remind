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
        
        # -> Fill the 'Email' field with 'arthur@remind.local' (the Email input) and then fill the 'Senha' field with 'remind123', then click the 'Entrar' button to submit the form.
        # voce@remind.local email field
        elem = page.locator('[id="email"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("arthur@remind.local")
        
        # -> Fill the 'Email' field with 'arthur@remind.local' (the Email input) and then fill the 'Senha' field with 'remind123', then click the 'Entrar' button to submit the form.
        # Sua senha password field
        elem = page.locator('[id="password"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("remind123")
        
        # -> Fill the 'Email' field with 'arthur@remind.local' (the Email input) and then fill the 'Senha' field with 'remind123', then click the 'Entrar' button to submit the form.
        # Entrar button
        elem = page.get_by_role('button', name='Entrar', exact=True)
        await elem.click(timeout=10000)
        
        # -> Open the user menu by clicking the 'Abrir menu do usuario' control (the user avatar/menu) to reveal the logout option.
        # Abrir menu do usuario
        elem = page.get_by_text('Abrir menu do usuario', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Sair' button in the user menu to log out.
        # Sair button
        elem = page.get_by_role('button', name='Sair', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify the user returns to the login page
        # Assert: User is on the login page (/login).
        await expect(page).to_have_url(re.compile("/login"), timeout=15000), "User is on the login page (/login)."
        # Assert: The login submit button 'Entrar' is present on the login page.
        await expect(page.locator("xpath=/html/body/main/section/div/form/button").nth(0)).to_have_text("Entrar", timeout=15000), "The login submit button 'Entrar' is present on the login page."
        current_url = await page.evaluate("() => window.location.href")
        # Assert: page loaded with a URL (final outcome verified by the AI judge during the run)
        assert current_url, 'Page should have loaded with a URL'
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    