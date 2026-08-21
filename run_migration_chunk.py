import json
import requests
import os
import time

DATABASE_ID = "38858811-29ca-83c5-b57d-0102c05505b1"
GATEWAY = "https://notion-api.lovable.app/v1"

def notion_headers():
    lovable_key = os.environ.get("LOVABLE_API_KEY")
    notion_key = os.environ.get("NOTION_API_KEY")
    return {
        "Authorization": f"Bearer {lovable_key}",
        "X-Connection-Api-Key": notion_key,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28"
    }

def run_migration_chunk(start=0, limit=50):
    if not os.path.exists("migration_report.json"):
        print("Error: migration_report.json not found")
        return

    with open("migration_report.json", "r") as f:
        report = json.load(f)
    
    headers = notion_headers()
    chunk = report[start : start + limit]
    
    print(f"Migrating chunk {start} to {start + limit}...")
    
    for item in chunk:
        page_id = item["id"]
        numero = item["numero_proposto"]
        
        # Verify current value first
        try:
            res = requests.get(f"{GATEWAY}/pages/{page_id}", headers=headers, timeout=10)
            if res.status_code == 200:
                page = res.json()
                current_num = page.get("properties", {}).get("Número", {}).get("number")
                if current_num == numero:
                    print(f"Skipping {item['nome']} (already {numero})")
                    continue
            else:
                print(f"Fetch failed for {item['nome']} (Status {res.status_code})")
        except Exception as e:
            print(f"Error checking {item['nome']}: {e}")
            
        print(f"Updating {item['nome']} -> {numero}")
        try:
            patch_res = requests.patch(
                f"{GATEWAY}/pages/{page_id}",
                headers=headers,
                json={
                    "properties": {
                        "Número": {"number": numero}
                    }
                },
                timeout=10
            )
            if not patch_res.ok:
                print(f"Failed to update {item['nome']}: {patch_res.text}")
        except Exception as e:
            print(f"Error updating {item['nome']}: {e}")
        
        time.sleep(1.0) # More conservative rate limit

if __name__ == "__main__":
    import sys
    start = int(sys.argv[1]) if len(sys.argv) > 1 else 0
    limit = int(sys.argv[2]) if len(sys.argv) > 2 else 50
    run_migration_chunk(start, limit)
