import { createServerFn } from "@tanstack/react-start";

const DATABASE_ID = "38858811-29ca-83c5-b57d-0102c05505b1";
const GATEWAY = "https://connector-gateway.lovable.dev/notion/v1";

export type Perfume = {
  id: string;
  nome: string;
  emEstoque: boolean;
  status: string; // "✅ In Stock" | "⚠️ Low Stock" | "❌ Out of Stock"
};

type NotionQueryResponse = {
  results: Array<{
    id: string;
    properties: {
      "Product Name"?: { title: Array<{ plain_text: string }> };
      "Available?"?: { formula: { string?: string } };
    };
  }>;
};

export const getPerfumes = createServerFn({ method: "GET" }).handler(
  async (): Promise<Perfume[]> => {
    const lovableKey = process.env.LOVABLE_API_KEY;
    const notionKey = process.env.NOTION_API_KEY;
    if (!lovableKey || !notionKey) {
      throw new Error("Notion connector não configurado");
    }

    const res = await fetch(`${GATEWAY}/databases/${DATABASE_ID}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": notionKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ page_size: 100 }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Notion query failed [${res.status}]: ${text}`);
    }

    const data = (await res.json()) as NotionQueryResponse;

    return data.results.map((page) => {
      const nome =
        page.properties["Product Name"]?.title?.[0]?.plain_text ?? "Sem nome";
      const status = page.properties["Available?"]?.formula?.string ?? "";
      const emEstoque = status.includes("In Stock") || status.includes("Low");
      return { id: page.id, nome, emEstoque, status };
    });
  },
);
