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
        results = []
        for card in cards:
            text = await card.inner_text()
            if "PRONTA ENTREGA" not in text and "Sob Encomenda" not in text:
                name = await card.locator("h3").inner_text()
                results.append(name)
            if len(results) >= 10:
                break
                
        print(json.dumps(results, indent=2))
        await browser.close()

asyncio.run(main())
