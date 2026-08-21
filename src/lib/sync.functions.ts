import { createServerFn } from "@tanstack/react-start";
import { getPerfumes } from "./perfumes.functions";

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

export const sincronizarCheckboxesNotion = createServerFn({ method: "POST" })
  .handler(async () => {
    const { requireAdmin } = await import("./admin.server");
    await requireAdmin();

    // Usamos uma busca fresca do Notion
    const perfumes = await getPerfumes();
    const total = perfumes.length;
    let corrigidos = 0;
    let falhas = 0;

    const processados = new Set<string>();
    
    for (const p of perfumes) {
      // Extrair o ID real da página do Notion (removendo sufixo de volume se houver)
      const pageId = p.id.split("-")[0];
      
      // Evitar processar a mesma página do Notion múltiplas vezes
      if (processados.has(pageId)) continue;
      processados.add(pageId);

      const threshold = p.oosThreshold ?? 0;
      const amount = p.amount ?? 0;
      
      const deveEstarPronta = amount > threshold;
      const deveEstarEncomenda = !deveEstarPronta;

      if (p.prontaEntrega !== deveEstarPronta || p.sobEncomenda !== deveEstarEncomenda) {
        console.log(`Sincronizando ${p.nome} (${pageId}): Amount=${amount}, Threshold=${threshold}, PE=${p.prontaEntrega}->${deveEstarPronta}, SE=${p.sobEncomenda}->${deveEstarEncomenda}`);
        try {
          // Chamada direta ao Notion via PATCH para evitar a lógica de automação 
          // do atualizarPerfume que pode interferir na sincronização manual.
          const res = await fetch(`${GATEWAY}/pages/${pageId}`, {
            method: "PATCH",
            headers: notionHeaders(),
            body: JSON.stringify({
              properties: {
                "Pronta entrega": { checkbox: deveEstarPronta },
                "Sob encomenda": { checkbox: deveEstarEncomenda },
              }
            }),
          });
          
          if (res.ok) {
            corrigidos++;
          } else {
            const errText = await res.text();
            console.error(`Erro API Notion (${p.nome}):`, errText);
            falhas++;
          }
        } catch (e) {
          console.error(`Falha ao sincronizar ${p.nome}:`, e);
          falhas++;
        }
      }
    }

    return { ok: true, total, corrigidos, falhas };
  });