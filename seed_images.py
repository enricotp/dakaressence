import os
import json
import requests

LOVABLE_API_KEY = os.environ.get("LOVABLE_API_KEY")
NOTION_API_KEY = os.environ.get("NOTION_API_KEY")
CONFIG_DB_ID = "3bf58811-29ca-81f5-a605-e63c22344bdf"
GATEWAY = "https://connector-gateway.lovable.dev/notion/v1"

def notion_request(method, endpoint, body=None):
    headers = {
        "Authorization": f"Bearer {LOVABLE_API_KEY}",
        "X-Connection-Api-Key": NOTION_API_KEY,
        "Content-Type": "application/json"
    }
    url = f"{GATEWAY}/{endpoint}"
    response = requests.request(method, url, headers=headers, json=body)
    if not response.ok:
        print(f"Error: {response.status_code} - {response.text}")
    return response.json()

def seed_images():
    print("Fetching home config pages...")
    data = notion_request("POST", f"databases/{CONFIG_DB_ID}/query")
    
    pages = data.get("results", [])
    
    # Sample images for testing
    sample_images = {
        "signature": ["https://images.unsplash.com/photo-1541643600914-78b084683601?w=800&q=80"],
        "brand_collection": [
            "https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800&q=80",
            "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=800&q=80"
        ],
        "arabic_collection": [
            "https://images.unsplash.com/photo-1590736704728-f4730bb3c370?w=800&q=80",
            "https://images.unsplash.com/photo-1563170351-be82bc888aa4?w=800&q=80"
        ],
        "dream_brand_collection": [
            "https://images.unsplash.com/photo-1616948055600-a12117f73c6f?w=800&q=80",
            "https://images.unsplash.com/photo-1615484477778-ca3b77940c25?w=800&q=80"
        ]
    }
    
    for page in pages:
        props = page.get("properties", {})
        key = props.get("Key", {}).get("title", [{}])[0].get("plain_text", "")
        
        if key in sample_images:
            print(f"Updating {key} with sample images...")
            update_payload = {
                "properties": {
                    "ImagensCarrossel": {
                        "rich_text": [
                            {
                                "text": {
                                    "content": json.dumps(sample_images[key])
                                }
                            }
                        ]
                    }
                }
            }
            notion_request("PATCH", f"pages/{page['id']}", update_payload)
            print(f"Successfully updated {key}")

if __name__ == "__main__":
    seed_images()
