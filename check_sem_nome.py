import asyncio
from playwright.async_api import async_playwright
import json

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto("http://localhost:8080/catalogo")
        await page.wait_for_selector(".group.relative.flex.flex-col", timeout=10000)
        
        cards = await page.locator(".group.relative.flex.flex-col").all()
        
        sem_nome = 0
        for card in cards:
            text = await card.inner_text()
            if "Sem nome" in text:
                sem_nome += 1
                
        print(f"Sem nome: {sem_nome}")
        await browser.close()

asyncio.run(main())
