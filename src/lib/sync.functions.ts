import { createServerFn } from "@tanstack/react-start";
import { getPerfumes, atualizarPerfume } from "./perfumes.functions";

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
          const res = await atualizarPerfume({
            data: {
              id: pageId,
              prontaEntrega: deveEstarPronta,
              sobEncomenda: deveEstarEncomenda,
            }
          });
          
          if (res.ok) {
            corrigidos++;
          } else {
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