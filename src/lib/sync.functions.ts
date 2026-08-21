import { createServerFn } from "@tanstack/react-start";
import { getPerfumes, atualizarPerfume, Colecao, Volume } from "./perfumes.functions";

export const sincronizarCheckboxesNotion = createServerFn({ method: "POST" })
  .handler(async () => {
    const { requireAdmin } = await import("./admin.server");
    await requireAdmin();

    const perfumes = await getPerfumes();
    let total = perfumes.length;
    let corrigidos = 0;
    let falhas = 0;

    for (const p of perfumes) {
      // Para perfumes expandidos (Signature com múltiplos volumes), o ID contém um sufixo (ex: pageId-100ml)
      // Precisamos do ID real da página no Notion.
      const pageId = p.id.split("-")[0];
      
      const threshold = p.oosThreshold ?? 0;
      const amount = p.amount ?? 0;
      
      const deveEstarPronta = amount > threshold;
      const deveEstarEncomenda = amount <= threshold;

      // Só atualizamos se houver divergência entre o estado calculado e o estado atual no Notion
      if (p.prontaEntrega !== deveEstarPronta || p.sobEncomenda !== deveEstarEncomenda) {
        try {
          await atualizarPerfume({
            data: {
              id: pageId,
              prontaEntrega: deveEstarPronta,
              sobEncomenda: deveEstarEncomenda,
              // Não passamos o amount aqui para não disparar a lógica de automação interna do atualizarPerfume 
              // que já existe no handler, pois queremos forçar o estado baseado no amount atual do Notion.
              // Na verdade, o handler de atualizarPerfume usa data.amount para decidir se automatiza.
              // Se passarmos apenas os checkboxes, ele deve aceitá-los.
            }
          });
          corrigidos++;
        } catch (e) {
          console.error(`Erro ao sincronizar perfume ${p.nome} (${p.id}):`, e);
          falhas++;
        }
      }
    }

    return { ok: true, total, corrigidos, falhas };
  });
