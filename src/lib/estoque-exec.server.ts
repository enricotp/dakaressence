import { formatarCiclo, movimentoId, agruparItens, ensureMovSheet, listarMovimentosRaw, validarEstoque, criarMovimento, atualizarMovimento, agora, lerProdutoNotion, escreverAmountNotion } from "./estoque.server";
import type { MovAcao, MovItem, ResultadoMovimento } from "./estoque.server";

/**
 * Executa uma movimentação de estoque de forma idempotente e com compensação.
 * delta -1 = baixa, +1 = devolução.
 */
export async function executarMovimento(params: {
  pedidoId: string;
  ciclo: number;
  acao: MovAcao;
  itens: MovItem[];
  usuario: string;
  role: string;
}): Promise<ResultadoMovimento> {
  const { pedidoId, ciclo, acao, usuario, role } = params;
  const delta: -1 | 1 = acao === "BAIXA" ? -1 : 1;
  const movId = movimentoId(pedidoId, ciclo, acao);
  const itens = agruparItens(params.itens);

  if (itens.length === 0) {
    return { ok: false, status: "FALHOU", movimentoId: movId, erro: "Nenhum item identificado com segurança para movimentar." };
  }

  await ensureMovSheet();

  // --- Idempotência: já existe movimento equivalente? ---
  const existentes = (await listarMovimentosRaw()).filter((m) => m.movimentoId === movId);
  const bloqueante = existentes.find(
    (m) => m.status === "APLICADA" || m.status === "INICIADA" || m.status === "PRECISA_RECONCILIACAO",
  );
  if (bloqueante) {
    return {
      ok: bloqueante.status === "APLICADA",
      status: bloqueante.status,
      movimentoId: movId,
      erro:
        bloqueante.status === "APLICADA"
          ? `Esta movimentação (${acao}) já foi aplicada anteriormente. Nada foi alterado.`
          : bloqueante.status === "INICIADA"
            ? "Já existe uma movimentação em andamento para este pedido e ciclo. Verifique a área de reconciliação."
            : "Este pedido e ciclo estão marcados como PRECISA_RECONCILIACAO. Resolva manualmente antes de repetir.",
    };
  }

  // Se for DEVOLUCAO, precisamos garantir que existe uma BAIXA APLICADA no mesmo ciclo
  if (acao === "DEVOLUCAO") {
    const todosMovs = await listarMovimentosRaw();
    const baixaId = movimentoId(pedidoId, ciclo, "BAIXA");
    const baixaAplicada = todosMovs.find(m => m.movimentoId === baixaId && m.status === "APLICADA");
    if (!baixaAplicada) {
      return { ok: false, status: "FALHOU", movimentoId: movId, erro: "Impossível devolver: não existe uma baixa aplicada para este ciclo." };
    }
  }

  // --- Validação completa ANTES de qualquer escrita no Notion ---
  const { linhas, erros } = await validarEstoque(itens, delta);
  if (erros.length > 0 && delta < 0) { // Na devolução (delta 1) permitimos mesmo se estoque estiver inconsistente no Notion
    return {
      ok: false,
      status: "FALHOU",
      movimentoId: movId,
      erro: `Estoque insuficiente — nenhum produto foi alterado:\n${erros.join("\n")}`,
      linhas,
    };
  }

  // --- Lock de concorrência: cria a linha e confere se somos os primeiros ---
  await criarMovimento({ movimentoId: movId, pedidoId, ciclo, acao, itens, usuario });
  const apos = (await listarMovimentosRaw()).filter((m) => m.movimentoId === movId);
  if (apos.length > 1) {
    const primeiro = apos[0];
    const nosso = apos[apos.length - 1];
    if (nosso.row !== primeiro.row) {
      await atualizarMovimento(movId, {
        status: "FALHOU",
        erro: "Execução simultânea detectada — outra requisição já assumiu este ciclo.",
        dataFim: agora(),
      });
      return {
        ok: false,
        status: "FALHOU",
        movimentoId: movId,
        erro: "Outra requisição já está processando este pedido e ciclo.",
      };
    }
  }

  // --- Aplicação item a item, registrando o que já foi alterado ---
  const aplicados: Array<{ item: MovItem; antes: number; depois: number }> = [];
  let falha: string | null = null;

  for (const it of itens) {
    try {
      const atual = await lerProdutoNotion(it.notionId);
      if (!atual) throw new Error(`Produto ${it.nome} não encontrado no Notion.`);
      if (delta < 0 && atual.amount < it.qtd) {
        throw new Error(
          `Estoque mudou durante o processamento: ${atual.nome} tem ${atual.amount}, solicitado ${it.qtd}.`,
        );
      }
      const novo = Math.max(0, atual.amount + delta * it.qtd);
      await escreverAmountNotion(it.notionId, novo);
      aplicados.push({ item: it, antes: atual.amount, depois: novo });
    } catch (err) {
      falha = err instanceof Error ? err.message : String(err);
      break;
    }
  }

  if (falha) {
    // --- Compensação: desfaz o que já tinha sido aplicado ---
    const falhasCompensacao: string[] = [];
    for (const applied of aplicados.reverse()) {
      try {
        await escreverAmountNotion(applied.item.notionId, applied.antes);
      } catch (err) {
        falhasCompensacao.push(applied.item.nome);
      }
    }

    const statusFinal = falhasCompensacao.length > 0 ? "PRECISA_RECONCILIACAO" : "FALHOU";
    const msgErro = falhasCompensacao.length > 0
      ? `Falha fatal durante atualização e falha na compensação dos itens: ${falhasCompensacao.join(", ")}. Reconciliação manual necessária.`
      : `Falha durante atualização (nenhum produto foi alterado): ${falha}`;

    await atualizarMovimento(movId, {
      status: statusFinal,
      erro: msgErro,
      dataFim: agora(),
    });

    return { ok: false, status: statusFinal, movimentoId: movId, erro: msgErro };
  }

  // --- Sucesso ---
  await atualizarMovimento(movId, {
    status: "APLICADA",
    dataFim: agora(),
  });

  return { ok: true, status: "APLICADA", movimentoId: movId };
}
