import os
import requests
import json

DATABASE_ID = "38858811-29ca-83c5-b57d-0102c05505b1"
GATEWAY = "https://connector-gateway.lovable.dev/notion/v1"

def create_number_property():
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
    
    payload = {
        "properties": {
            "Número": {
                "number": {}
            }
        }
    }
    
    url = f"{GATEWAY}/databases/{DATABASE_ID}"
    res = requests.patch(url, headers=headers, json=payload)
    
    if res.ok:
        print("Property 'Número' created/verified successfully.")
        print(res.json().get("properties", {}).get("Número"))
    else:
        print(f"Error: {res.status_code}")
        print(res.text)

if __name__ == "__main__":
    create_number_property()
