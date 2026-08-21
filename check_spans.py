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
        for i in range(min(5, len(cards))):
            card = cards[i]
            name = await card.locator("h3").inner_text()
            spans = await card.locator("span").all_inner_texts()
            results.append({"name": name, "spans": [s.strip() for s in spans if s.strip()]})
            
        print(json.dumps(results, indent=2))
        await browser.close()

asyncio.run(main())
