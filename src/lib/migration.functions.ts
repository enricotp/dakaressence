import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const DATABASE_ID = "38858811-29ca-83c5-b57d-0102c05505b1";
const GATEWAY = "https://connector-gateway.lovable.dev/notion/v1";

function notionHeaders() {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const notionKey = process.env.NOTION_API_KEY;
  if (!lovableKey || !notionKey) throw new Error("Notion connector não configurado");
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": notionKey,
    "Content-Type": "application/json",
  };
}

export const getPerfumeNumbersReport = createServerFn({ method: "GET" }).handler(
  async () => {
    const lovableKey = process.env.LOVABLE_API_KEY;
    const notionKey = process.env.NOTION_API_KEY;
    if (!lovableKey || !notionKey) throw new Error("Notion connector não configurado");

    const allResults: any[] = [];
    let startCursor: string | undefined = undefined;
    let hasMore = true;
    while (hasMore) {
      const body: any = { page_size: 100 };
      if (startCursor) body.start_cursor = startCursor;
      const res = await fetch(`${GATEWAY}/databases/${DATABASE_ID}/query`, {
        method: "POST",
        headers: notionHeaders(),
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Query failed");
      const pageData = await res.json();
      allResults.push(...pageData.results);
      hasMore = pageData.has_more;
      startCursor = pageData.next_cursor;
    }

    // Sort items to simulate current "index" behavior if possible, or just use natural order
    const sortedItems = [...allResults].sort((a, b) => {
        const nameA = a.properties["Product Name"]?.title?.[0]?.plain_text ?? "";
        const nameB = b.properties["Product Name"]?.title?.[0]?.plain_text ?? "";
        return nameA.localeCompare(nameB);
    });

    return sortedItems.map((page, index) => ({
      id: page.id,
      nome: page.properties["Product Name"]?.title?.[0]?.plain_text ?? "Sem nome",
      colecao: page.properties["Coleção"]?.select?.name ?? "N/A",
      volume: page.properties["Volume"]?.select?.name ?? "N/A",
      numeroAtual: `Nº ${(index + 1).toString().padStart(3, "0")}`,
      numeroProposto: index + 1
    }));
  }
);
