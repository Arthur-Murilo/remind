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
        
        # -> Fill the Email field with 'arthur@remind.local', fill the Senha (password) field with 'remind123', then click the 'Entrar' button to submit the login form.
        # voce@remind.local email field
        elem = page.locator('[id="email"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("arthur@remind.local")
        
        # -> Fill the Email field with 'arthur@remind.local', fill the Senha (password) field with 'remind123', then click the 'Entrar' button to submit the login form.
        # Sua senha password field
        elem = page.locator('[id="password"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("remind123")
        
        # -> Fill the Email field with 'arthur@remind.local', fill the Senha (password) field with 'remind123', then click the 'Entrar' button to submit the login form.
        # Entrar button
        elem = page.get_by_role('button', name='Entrar', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the 'Testando' project in the left sidebar to open that project's context.
        # Testando 3 link
        elem = page.get_by_role('link', name='Testando 3', exact=True)
        await elem.click(timeout=10000)
        
        # -> Click the '+ Nova tarefa' button to open the 'Nova tarefa' modal and observe its visible fields.
        # + Nova tarefa button
        elem = page.get_by_role('button', name='+ Nova tarefa', exact=True)
        await elem.click(timeout=10000)
        
        # -> Fill the 'Título da Tarefa' field and other form fields, then open the 'Repetir (Rotina)' dropdown.
        # Ex.: Implementar funcionalidade... text field
        elem = page.locator('[id="new-task-title"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Tarefa QA - recorr\u00eancia di\u00e1ria 2026-08-15")
        
        # -> Fill the 'Título da Tarefa' field and other form fields, then open the 'Repetir (Rotina)' dropdown.
        # Contexto curto ou detalhes adicionais... text area
        elem = page.locator('[id="new-task-description"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("Descri\u00e7\u00e3o de teste E2E para verificar prazo e recorr\u00eancia.")
        
        # -> Fill the 'Título da Tarefa' field and other form fields, then open the 'Repetir (Rotina)' dropdown.
        # dueDate date field
        elem = page.locator('[id="new-task-dueDate"]')
        await elem.wait_for(state="visible", timeout=10000)
        await elem.fill("2026-08-15")
        
        # -> Fill the 'Título da Tarefa' field and other form fields, then open the 'Repetir (Rotina)' dropdown.
        # Não repete Diariamente Semanalmente Mensalmente dropdown
        elem = page.locator('[id="new-task-recurrence"]')
        await elem.click(timeout=10000)
        
        # -> Select 'Diariamente' from the 'Repetir (Rotina)' dropdown in the 'Criar Nova Tarefa' modal.
        # Não repete Diariamente Semanalmente Mensalmente dropdown
        elem = page.locator("xpath=/html/body/div[2]/div/main/div/div/div[2]/div/div/div[2]/form/div[5]/div[2]/select").nth(0)
        await elem.wait_for(state="visible", timeout=10000)
        await elem.select_option("")
        
        # -> Click the 'Criar Tarefa' button to save the new task and then verify it appears in the project's task list with a recurrence indicator.
        # Criar Tarefa button
        elem = page.get_by_role('button', name='Criar Tarefa', exact=True)
        await elem.click(timeout=10000)
        
        # --> Assertions to verify final state
        
        # --> Verify the task appears in the project task list with recurrence indicated
        # Assert: The task 'Tarefa QA - recorrência diária 2026-08-15' is present in the project task list (edit button aria-label matches).
        await expect(page.locator("xpath=/html/body/div[2]/div/main/div/div[4]/article[2]/div[6]/button").nth(0)).to_have_attribute("aria-label", "Editar tarefa Tarefa QA - recorr\u00eancia di\u00e1ria 2026-08-15", timeout=15000), "The task 'Tarefa QA - recorr\u00eancia di\u00e1ria 2026-08-15' is present in the project task list (edit button aria-label matches)."
        # Assert: A recurring task entry is present in the list (recurrence indicated by the edit button aria-label 'Rotina Diaria').
        await expect(page.locator("xpath=/html/body/div[2]/div/main/div/div[4]/article[3]/div[6]/button").nth(0)).to_have_attribute("aria-label", "Editar tarefa Rotina Diaria 1785976991268", timeout=15000), "A recurring task entry is present in the list (recurrence indicated by the edit button aria-label 'Rotina Diaria')."
        await asyncio.sleep(5)

    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()

asyncio.run(run_test())
    