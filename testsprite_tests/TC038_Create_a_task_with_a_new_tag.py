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
        
        # -> Fill 'arthur@remind.local' into the Email field, 'remind123' into the Senha field, then click the 'Entrar' button to submit the login form.
        # voce@remind.local email field
        elem = page.locator('[id="email"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("arthur@remind.local")
        
        # -> Fill 'arthur@remind.local' into the Email field, 'remind123' into the Senha field, then click the 'Entrar' button to submit the login form.
        # Sua senha password field
        elem = page.locator('[id="password"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("remind123")
        
        # -> Fill 'arthur@remind.local' into the Email field, 'remind123' into the Senha field, then click the 'Entrar' button to submit the login form.
        # Entrar button
        elem = page.get_by_role('button', name='Entrar', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the '+ Nova tarefa' button to open the 'Nova tarefa' task composer modal.
        # + Nova tarefa button
        elem = page.get_by_role('button', name='+ Nova tarefa', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the '+ Criar Tag' button in the Tags section to open the tag creation control.
        # + Criar Tag button
        elem = page.get_by_role('button', name='+ Criar Tag', exact=True)
        await elem.click(timeout=10000)
        
        # -> Enter a new tag name into the 'Nome da tag...' field and click the 'Salvar' button to create the tag.
        # Nome da tag... text field
        elem = page.get_by_placeholder('Nome da tag...', exact=True)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("E2E Tag 2026-08-14")
        
        # -> Enter a new tag name into the 'Nome da tag...' field and click the 'Salvar' button to create the tag.
        # Salvar button
        elem = page.get_by_role('button', name='Salvar', exact=True)
        await elem.click(timeout=10000)
        
        # -> Fill the 'Título da Tarefa' field with 'Tarefa E2E Tag 2026-08-14' and click the 'Criar Tarefa' button to save the task.
        # Ex.: Implementar funcionalidade... text field
        elem = page.locator('[id="new-task-title"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Tarefa E2E Tag 2026-08-14")
        
        # -> Fill the 'Título da Tarefa' field with 'Tarefa E2E Tag 2026-08-14' and click the 'Criar Tarefa' button to save the task.
        # Criar Tarefa button
        elem = page.get_by_role('button', name='Criar Tarefa', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Editar tarefa Tarefa E2E Tag 2026-08-14' button to open the task editor and verify the 'E2E Tag 2026-08-14' tag is applied.
        # Editar tarefa Tarefa E2E Tag 2026-08-14 button
        elem = page.get_by_role('button', name='Editar tarefa Tarefa E2E Tag 2026-08-14', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify the task is created with the new tag applied
        # Assert: The task title input contains 'Tarefa E2E Tag 2026-08-14'.
        await expect(page.locator("xpath=/html/body/div[2]/div/main/div/div[5]/article[6]/div[6]/div/div/div[2]/form/div[2]/input").nth(0)).to_have_value("Tarefa E2E Tag 2026-08-14", timeout=15000), "The task title input contains 'Tarefa E2E Tag 2026-08-14'."
        # Assert: The tag 'E2E Tag 2026-08-14' is shown in the task's Tags area.
        await expect(page.locator("xpath=/html/body/div[2]/div/main/div/div[5]/article[6]/div[6]/div/div/div[2]/form/div[7]/div[2]/button[1]").nth(0)).to_have_text("E2E Tag 2026-08-14", timeout=15000), "The tag 'E2E Tag 2026-08-14' is shown in the task's Tags area."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    