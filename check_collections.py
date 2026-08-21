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
        print(f"Total cards: {len(cards)}")
        
        # We can't easily see the collection from the card UI without more scraping
        # but we can try to find if there are hidden ones.
        
        visible_cards = 0
        for card in cards:
            if await card.is_visible():
                visible_cards += 1
        
        print(f"Visible cards: {visible_cards}")
        await browser.close()

asyncio.run(main())
