import asyncio
from playwright.async_api import async_playwright

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page(viewport={"width": 1280, "height": 3000})
        await page.goto("http://localhost:8080/catalogo")
        await page.wait_for_selector(".group.relative.flex.flex-col", timeout=10000)
        
        # Scroll down
        await page.mouse.wheel(0, 3000)
        await page.wait_for_timeout(2000)
        await page.screenshot(path="/tmp/browser/catalogo_further.png")
        
        await browser.close()

asyncio.run(main())
