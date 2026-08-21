import asyncio
from playwright.async_api import async_playwright
import json

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()
        await page.goto("http://localhost:8080/catalogo")
        await page.wait_for_selector(".group.relative.flex.flex-col", timeout=10000)
        
        # Scroll to bottom to ensure all are loaded if there is lazy loading
        # But CatalogViewer doesn't seem to have virtualization, just a long list.
        
        cards = await page.locator(".group.relative.flex.flex-col").all()
        print(f"Total cards: {len(cards)}")
        
        pronta = 0
        encomenda = 0
        none = 0
        
        for card in cards:
            text = await card.inner_text()
            if "PRONTA ENTREGA" in text:
                pronta += 1
            elif "Sob Encomenda" in text:
                encomenda += 1
            else:
                none += 1
                
        print(f"Pronta: {pronta}, Encomenda: {encomenda}, None: {none}")
        await browser.close()

asyncio.run(main())
