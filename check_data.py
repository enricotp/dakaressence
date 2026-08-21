import asyncio
from playwright.async_api import async_playwright
import json

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto("http://localhost:8080/catalogo")
        await page.wait_for_selector(".group.relative.flex.flex-col", timeout=10000)
        
        # We can try to access the window.__TSR_DATA__ if TanStack Start exposes it
        # or just scrape the cards.
        
        cards = await page.locator(".group.relative.flex.flex-col").all()
        results = []
        for i in range(min(10, len(cards))):
            card = cards[i]
            name = await card.locator("h3").inner_text()
            tags = await card.locator("span.rounded-full").all_inner_texts()
            results.append({"name": name, "tags": tags})
            
        print(json.dumps(results, indent=2))
        await browser.close()

asyncio.run(main())
