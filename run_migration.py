import os
import requests
import json
import time

DATABASE_ID = "38858811-29ca-83c5-b57d-0102c05505b1"
GATEWAY = "https://connector-gateway.lovable.dev/notion/v1"

def run_migration():
    lovable_key = os.environ.get("LOVABLE_API_KEY")
    notion_key = os.environ.get("NOTION_API_KEY")
    
    if not lovable_key or not notion_key:
        print("Keys missing")
        return

    headers = {
        "Authorization": f"Bearer {lovable_key}",
        "X-Connection-Api-Key": notion_key,
        "Content-Type": "application/json",
    }
    
    with open("migration_report.json", "r") as f:
        report = json.load(f)

    print(f"Starting migration for {len(report)} items...")
    
    success_count = 0
    fail_count = 0
    
    for item in report:
        page_id = item["id"]
        number = item["numero_proposto"]
        
        url = f"{GATEWAY}/pages/{page_id}"
        payload = {
            "properties": {
                "Número": {
                    "number": number
                }
            }
        }
        
        try:
            res = requests.patch(url, headers=headers, json=payload)
            if res.ok:
                success_count += 1
                if success_count % 50 == 0:
                    print(f"Progress: {success_count} updated...")
            else:
                print(f"Failed to update {item['nome']} (ID: {page_id}): {res.text}")
                fail_count += 1
        except Exception as e:
            print(f"Error updating {item['nome']}: {str(e)}")
            fail_count += 1
            
        # Rate limit safety
        time.sleep(0.3)

    print(f"Migration finished. Success: {success_count}, Failed: {fail_count}")

if __name__ == "__main__":
    run_migration()
