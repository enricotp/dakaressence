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

    // Processar em pequenos lotes ou sequencialmente para evitar rate limit do Notion
    for (const p of perfumes) {
      // Ignorar IDs virtuais de expansão do Signature (ex: id-100ml)
      // para não tentar atualizar a mesma página várias vezes na mesma execução
      if (p.id.includes("-")) continue;

      const threshold = p.oosThreshold ?? 0;
      const amount = p.amount ?? 0;
      
      const deveEstarPronta = amount > threshold;
      const deveEstarEncomenda = amount <= threshold;

      // Log para debug interno (visível nos logs do servidor se necessário)
      console.log(`Verificando ${p.nome}: Amount=${amount}, Threshold=${threshold}, Atual(PE=${p.prontaEntrega}, SE=${p.sobEncomenda}), Esperado(PE=${deveEstarPronta}, SE=${deveEstarEncomenda})`);

      if (p.prontaEntrega !== deveEstarPronta || p.sobEncomenda !== deveEstarEncomenda) {
        try {
          const res = await atualizarPerfume({
            data: {
              id: p.id,
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
