import asyncio
import os
import json
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(viewport={"width": 1280, "height": 1800})
        page = await context.new_page()
        
        # We need to wait for the data to load.
        # Since it's TanStack Start, we can check the initial state or just wait for the cards.
        await page.goto("http://localhost:8080/catalogo")
        
        # Wait for perfumes to be rendered
        await page.wait_for_selector(".group.relative.flex.flex-col", timeout=10000)
        
        # Get perfumes from the page state if possible, or just count them
        perfumes_count = await page.locator(".group.relative.flex.flex-col").count()
        print(f"Total perfumes rendered: {perfumes_count}")
        
        # Let's try to find a perfume that is out of stock (sob encomenda)
        encomenda_tags = await page.locator("text='Sob Encomenda'").count()
        print(f"Perfumes with 'Sob Encomenda' tag: {encomenda_tags}")
        
        # Screenshot to see the state
        await page.screenshot(path="/tmp/browser/catalogo.png")
        
        await browser.close()

asyncio.run(main())
