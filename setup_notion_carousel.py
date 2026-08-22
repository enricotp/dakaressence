
import os
import requests
import json

lovable_key = os.environ.get("LOVABLE_API_KEY")
notion_key = os.environ.get("NOTION_API_KEY")
gateway = "https://connector-gateway.lovable.dev/notion/v1"
database_id = "3bf58811-29ca-81f5-a605-e63c22344bdf"

headers = {
    "Authorization": f"Bearer {lovable_key}",
    "X-Connection-Api-Key": notion_key,
    "Content-Type": "application/json",
}

def check_db():
    res = requests.get(f"{gateway}/databases/{database_id}", headers=headers)
    if not res.ok:
        print(f"Error fetching DB: {res.status_code} {res.text}")
        return
    db = res.json()
    props = db.get("properties", {})
    print(f"Properties: {list(props.keys())}")
    
    # Se não existir ImagensCarrossel, criar
    if "ImagensCarrossel" not in props:
        print("Creating 'ImagensCarrossel' property...")
        payload = {
            "properties": {
                "ImagensCarrossel": {
                    "rich_text": {}
                }
            }
        }
        patch_res = requests.patch(f"{gateway}/databases/{database_id}", headers=headers, json=payload)
        if patch_res.ok:
            print("Property 'ImagensCarrossel' (rich_text) created successfully.")
        else:
            print(f"Failed to create property: {patch_res.status_code} {patch_res.text}")
    else:
        print(f"Property 'ImagensCarrossel' already exists with type: {props['ImagensCarrossel'].get('type')}")

if __name__ == "__main__":
    check_db()
