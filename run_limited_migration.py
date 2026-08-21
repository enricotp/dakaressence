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

def run_limited_migration(limit=10):
    with open("migration_report.json", "r") as f:
        report = json.load(f)
    
    headers = notion_headers()
    
    success = 0
    for item in report[:limit]:
        page_id = item["id"]
        numero = item["numero_proposto"]
        
        print(f"Updating {item['nome']} -> {numero}")
        try:
            res = requests.patch(
                f"{GATEWAY}/pages/{page_id}",
                headers=headers,
                json={
                    "properties": {
                        "Número": {"number": numero}
                    }
                },
                timeout=15
            )
            if res.ok:
                print(f"Success: {item['nome']}")
                success += 1
            else:
                print(f"Failed: {item['nome']} - {res.status_code} - {res.text}")
        except Exception as e:
            print(f"Error: {item['nome']} - {e}")
        
        time.sleep(1.0)
    
    print(f"Migration finished. Success: {success}/{limit}")

if __name__ == "__main__":
    run_limited_migration(20)
