import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1280, "height": 3000}) # Tall viewport
        await page.goto("http://localhost:8080/catalogo")
        await page.wait_for_selector(".group.relative.flex.flex-col", timeout=10000)
        
        # Scroll to the middle/end
        await page.evaluate("window.scrollTo(0, 5000)")
        await page.wait_for_timeout(1000)
        await page.screenshot(path="/tmp/browser/catalogo_middle.png")
        
        await browser.close()

asyncio.run(main())
