import os
import requests
import json

DATABASE_ID = "38858811-29ca-83c5-b57d-0102c05505b1"
GATEWAY = "https://connector-gateway.lovable.dev/notion/v1"

def generate_report():
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
    
    all_pages = []
    has_more = True
    start_cursor = None
    
    while has_more:
        payload = {"page_size": 100}
        if start_cursor:
            payload["start_cursor"] = start_cursor
            
        url = f"{GATEWAY}/databases/{DATABASE_ID}/query"
        res = requests.post(url, headers=headers, json=payload)
        
        if not res.ok:
            print(f"Error querying Notion: {res.text}")
            break
            
        data = res.json()
        all_pages.extend(data.get("results", []))
        has_more = data.get("has_more", False)
        start_cursor = data.get("next_cursor")

    # The current site sorts by Product Name to generate numbers
    sorted_pages = sorted(all_pages, key=lambda p: (p["properties"]["Product Name"]["title"][0]["plain_text"] if p["properties"]["Product Name"]["title"] else "Sem nome"))
    
    report = []
    seen_numbers = {}
    
    for i, page in enumerate(sorted_pages):
        props = page["properties"]
        name = props["Product Name"]["title"][0]["plain_text"] if props["Product Name"]["title"] else "Sem nome"
        colecao = props["Coleção"]["select"]["name"] if props["Coleção"]["select"] else "N/A"
        volume = props["Volume"]["select"]["name"] if props["Volume"]["select"] else "N/A"
        marca = props["Marca"]["select"]["name"] if props["Marca"]["select"] else "N/A"
        numero_atual_notion = props.get("Número", {}).get("number")
        
        # Proposed number is the index + 1
        proposed = i + 1
        
        status = "Novo"
        if numero_atual_notion is not None:
            status = f"Já existe ({numero_atual_notion})"
            
        item = {
            "id": page["id"],
            "nome": name,
            "marca": marca,
            "colecao": colecao,
            "volume": volume,
            "numero_exibido_atual": f"Nº {(i+1):03d}",
            "numero_proposto": proposed,
            "status_propriedade": status
        }
        report.append(item)
        
    print(json.dumps(report, indent=2, ensure_ascii=False))

if __name__ == "__main__":
    generate_report()
