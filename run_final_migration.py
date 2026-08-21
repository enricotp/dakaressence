import json
import requests
import os
import time

# Use the official Notion API URL directly to bypass potential gateway issues
# The server functions use a gateway, but here we can try direct access if LOVABLE_API_KEY is actually a Notion key
# Actually, the instructions say the connector is at notion-api.lovable.app
DATABASE_ID = "38858811-29ca-83c5-b57d-0102c05505b1"
GATEWAY = "https://connector-gateway.lovable.dev/notion/v1"

def notion_headers():
    lovable_key = os.environ.get("LOVABLE_API_KEY")
    notion_key = os.environ.get("NOTION_API_KEY")
    # If using the connector, we need both.
    # The 404 might be because the GATEWAY URL is wrong or the page IDs are stale.
    return {
        "Authorization": f"Bearer {lovable_key}",
        "X-Connection-Api-Key": notion_key,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
    }

def run_migration():
    headers = notion_headers()
    
    # First, let's fetch ALL current pages from Notion to get fresh IDs and names
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
    
    # Sort them alphabetically by Name to assign numbers
    def get_name(page):
        props = page.get("properties", {})
        title_prop = props.get("Product Name", {}).get("title", [])
        return title_prop[0].get("text", {}).get("content", "") if title_prop else ""

    notion_pages.sort(key=lambda p: get_name(p).lower())
    
    success = 0
    for i, page in enumerate(notion_pages):
        page_id = page["id"]
        name = get_name(page)
        numero = i + 1
        
        # Check if already has correct number
        current_num = page.get("properties", {}).get("Número", {}).get("number")
        if current_num == numero:
            print(f"Skipping {name} (already {numero})")
            continue
            
        print(f"Updating {name} ({page_id}) -> {numero}")
        try:
            patch_res = requests.patch(
                f"{GATEWAY}/pages/{page_id}",
                headers=headers,
                json={
                    "properties": {
                        "Número": {"number": numero}
                    }
                },
                timeout=15
            )
            if patch_res.ok:
                print(f"Success: {name}")
                success += 1
            else:
                print(f"Failed: {name} - {patch_res.status_code} - {patch_res.text}")
        except Exception as e:
            print(f"Error: {name} - {e}")
        
        time.sleep(0.5)
    
    print(f"Migration finished. Success: {success}/{len(notion_pages)}")

if __name__ == "__main__":
    run_migration()
