import os
import requests
import json

DATABASE_ID = "38858811-29ca-83c5-b57d-0102c05505b1"
GATEWAY = "https://connector-gateway.lovable.dev/notion/v1"

def check():
    headers = {
        "Authorization": f"Bearer {os.environ.get('LOVABLE_API_KEY')}",
        "X-Connection-Api-Key": os.environ.get('NOTION_API_KEY')
    }
    res = requests.post(f"{GATEWAY}/databases/{DATABASE_ID}/query", headers=headers, json={"page_size": 10})
    results = res.json().get("results", [])
    for r in results:
        num = r["properties"].get("Número", {}).get("number")
        name = r["properties"]["Product Name"]["title"][0]["plain_text"]
        print(f"{name}: {num}")

if __name__ == "__main__":
    check()
