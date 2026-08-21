import json
import requests
import os
import time
import concurrent.futures

DATABASE_ID = "38858811-29ca-83c5-b57d-0102c05505b1"
GATEWAY = "https://connector-gateway.lovable.dev/notion/v1"

def notion_headers():
    lovable_key = os.environ.get("LOVABLE_API_KEY")
    notion_key = os.environ.get("NOTION_API_KEY")
    return {
        "Authorization": f"Bearer {lovable_key}",
        "X-Connection-Api-Key": notion_key,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
    }

def update_page(page_info):
    page_id, name, numero, headers = page_info
    try:
        patch_res = requests.patch(
            f"{GATEWAY}/pages/{page_id}",
            headers=headers,
            json={
                "properties": {
                    "Número": {"number": numero}
                }
            },
            timeout=20
        )
        if patch_res.ok:
            return True, name
        else:
            return False, f"{name}: {patch_res.status_code}"
    except Exception as e:
        return False, f"{name}: {str(e)}"

def run_migration():
    headers = notion_headers()
    print("Fetching fresh data from Notion...")
    url = f"{GATEWAY}/databases/{DATABASE_ID}/query"
    has_more = True
    next_cursor = None
    notion_pages = []
    
    while has_more:
        body = {"page_size": 100}
        if next_cursor:
            body["start_cursor"] = next_cursor
        
        res = requests.post(url, headers=headers, json=body)
        if not res.ok:
            print(f"Failed to query database: {res.status_code} {res.text}")
            return
            
        data = res.json()
        notion_pages.extend(data.get("results", []))
        has_more = data.get("has_more", False)
        next_cursor = data.get("next_cursor")
    
    print(f"Found {len(notion_pages)} pages in Notion.")
    
    def get_name(page):
        props = page.get("properties", {})
        title_prop = props.get("Product Name", {}).get("title", [])
        return title_prop[0].get("text", {}).get("content", "") if title_prop else ""

    notion_pages.sort(key=lambda p: get_name(p).lower())
    
    pages_to_update = []
    for i, page in enumerate(notion_pages):
        name = get_name(page)
        numero = i + 1
        current_num = page.get("properties", {}).get("Número", {}).get("number")
        if current_num != numero:
            pages_to_update.append((page["id"], name, numero, headers))
    
    print(f"Need to update {len(pages_to_update)} perfumes.")
    
    success = 0
    # Notion API has a rate limit, but we can try small concurrency
    with concurrent.futures.ThreadPoolExecutor(max_workers=5) as executor:
        future_to_page = {executor.submit(update_page, p): p for p in pages_to_update}
        for future in concurrent.futures.as_completed(future_to_page):
            ok, msg = future.result()
            if ok:
                success += 1
                print(f"Success: {msg} ({success}/{len(pages_to_update)})")
            else:
                print(f"Error: {msg}")
            # Add a small delay between batches
            time.sleep(0.1)
    
    print(f"Migration finished. Success: {success}/{len(pages_to_update)}")

if __name__ == "__main__":
    run_migration()
