
import os
import json
import requests
import sys

lovable_key = os.environ.get("LOVABLE_API_KEY")
notion_key = os.environ.get("NOTION_API_KEY")
gateway = "https://connector-gateway.lovable.dev/notion/v1"
database_id = "38858811-29ca-83c5-b57d-0102c05505b1"

headers = {
    "Authorization": f"Bearer {lovable_key}",
    "X-Connection-Api-Key": notion_key,
    "Content-Type": "application/json",
}

def inspect_db():
    print("--- Inspecting Database ---")
    res = requests.get(f"{gateway}/databases/{database_id}", headers=headers)
    if not res.ok:
        print(f"Error: {res.status_code} {res.text}")
        return None
    db = res.json()
    props = db.get("properties", {})
    for name, info in props.items():
        print(f"Property: {name} (Type: {info.get('type')})")
    return db

def inspect_sample_pages():
    print("\n--- Inspecting Sample Pages ---")
    res = requests.post(f"{gateway}/databases/{database_id}/query", headers=headers, json={"page_size": 5})
    if not res.ok:
        print(f"Error: {res.status_code} {res.text}")
        return
    results = res.json().get("results", [])
    for page in results:
        props = page.get("properties", {})
        title = props.get("Product Name", {}).get("title", [{}])[0].get("plain_text", "Unknown")
        amount = props.get("Amount", {}).get("number")
        pe = props.get("Pronta entrega", {}).get("checkbox")
        se = props.get("Sob encomenda", {}).get("checkbox")
        oos = props.get("OoS threshold", {}).get("number")
        print(f"Product: {title} | Amount: {amount} | PE: {pe} | SE: {se} | OoS: {oos}")

if __name__ == "__main__":
    db = inspect_db()
    if db:
        inspect_sample_pages()
