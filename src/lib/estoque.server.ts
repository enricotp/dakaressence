// ============================================================================
// Fase 3 — Motor de movimentação de estoque (server-only)
//
// Regras centrais:
//  - Checkout NUNCA altera estoque. Pedido pendente NÃO reserva unidade.
//  - Baixa acontece somente em Pendente -> Concluído (aceite do administrador).
//  - Devolução acontece somente quando existe uma BAIXA APLICADA no ciclo.
//  - Toda movimentação é registrada na aba "MovimentacoesEstoque" com um
//    MovimentoID único (PEDIDO:CICLO-N:ACAO) que garante idempotência.
// ============================================================================

import {
  appendRow,
  colLetter,
  ensureColumns,
  ensureSheetTab,
  getHeaderRow,
  indexer,
  readRange,
  writeRange,
} from "./sheets.server";

const NOTION_GATEWAY = "https://connector-gateway.lovable.dev/notion/v1";

export const PEDIDOS_SHEET_ID = "1YDXLWaevUB9LnrQGImIV9iGBT9ayCbZYdkzaWkXZrWw";
export const PEDIDOS_SHEET_NAME = "Pedidos";
export const ITEMS_SHEET_ID = "1jDoMknc5tZ_XQbbRlo4luPGU4c6WrC5Jn5E6p8--FbM";
export const ITEMS_SHEET_NAME = "Página1";
export const MOV_SHEET_NAME = "MovimentacoesEstoque";

export const MOV_HEADERS = [
  "MovimentoID",
  "PedidoID",
  "Ciclo",
  "Ação",
  "Status",
  "DataInicio",
  "DataFim",
  "Itens",
  "Erro",
  "Usuario",
] as const;

export type MovStatus =
  | "INICIADA"
  | "APLICADA"
  | "REVERTIDA"
  | "FALHOU"
  | "PRECISA_RECONCILIACAO";

export type MovAcao = "BAIXA" | "DEVOLUCAO";

export type MovItem = {
  notionId: string;
  numero: number | null;
  nome: string;
  qtd: number;
  colecao?: string;
  volume?: string;
  precoUnit?: number;
};

export type Movimento = {
  movimentoId: string;
  pedidoId: string;
  ciclo: number;
  acao: MovAcao;
  status: MovStatus;
  dataInicio: string;
  dataFim: string;
  itens: MovItem[];
  erro: string;
  usuario: string;
  row: number;
};

function agora() {
  return new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
}

export function movimentoId(pedidoId: string, ciclo: number, acao: MovAcao) {
  return `${pedidoId}:CICLO-${ciclo}:${acao}`;
}

/* -------------------------------------------------------------------------- */
/* Notion                                                                      */
/* -------------------------------------------------------------------------- */

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

/** IDs de variações Signature vêm como `<pageId>-50ml`. O estoque é da página. */
export function normalizarNotionId(id: string): string {
  return id.replace(/-(25|50|80|100)ml$/i, "");
}

export type NotionProduto = {
  id: string;
  nome: string;
  numero: number | null;
  amount: number;
};

export async function lerProdutoNotion(id: string): Promise<NotionProduto | null> {
  const pageId = normalizarNotionId(id);
  const res = await fetch(`${NOTION_GATEWAY}/pages/${pageId}`, { headers: notionHeaders() });
  if (!res.ok) {
    console.error(`Notion page read failed [${res.status}] para ${pageId}`);
    return null;
  }
  const page = (await res.json()) as {
    id: string;
    properties: Record<string, { number?: number | null; title?: Array<{ plain_text: string }> }>;
  };
  return {
    id: page.id,
    nome: page.properties["Product Name"]?.title?.[0]?.plain_text ?? "Sem nome",
    numero: page.properties["Número"]?.number ?? null,
    amount: page.properties["Amount"]?.number ?? 0,
  };
}

async function escreverAmountNotion(pageId: string, amount: number) {
  const res = await fetch(`${NOTION_GATEWAY}/pages/${normalizarNotionId(pageId)}`, {
    method: "PATCH",
    headers: notionHeaders(),
    body: JSON.stringify({ properties: { Amount: { number: Math.max(0, amount) } } }),
  });
  if (!res.ok) {
    throw new Error(`Notion update falhou [${res.status}]: ${await res.text()}`);
  }
}

/* -------------------------------------------------------------------------- */
/* Aba de movimentações                                                        */
/* -------------------------------------------------------------------------- */

let movSheetReady = false;

export async function ensureMovSheet() {
  if (movSheetReady) return;
  await ensureSheetTab(PEDIDOS_SHEET_ID, MOV_SHEET_NAME);
  await ensureColumns(PEDIDOS_SHEET_ID, MOV_SHEET_NAME, [...MOV_HEADERS]);
  movSheetReady = true;
}

export async function ensureColunasPedido() {
  return ensureColumns(PEDIDOS_SHEET_ID, PEDIDOS_SHEET_NAME, [
    "EstoqueCiclo",
    "UltimoMovimentoStatus",
  ]);
}

function parseItens(raw: string): MovItem[] {
  try {
    const v = JSON.parse(raw || "[]");
    return Array.isArray(v) ? (v as MovItem[]) : [];
  } catch {
    return [];
  }
}

export async function listarMovimentosRaw(): Promise<Movimento[]> {
  await ensureMovSheet();
  const headers = await getHeaderRow(PEDIDOS_SHEET_ID, MOV_SHEET_NAME);
  const idx = indexer(headers);
  const rows = await readRange(PEDIDOS_SHEET_ID, `${MOV_SHEET_NAME}!A2:ZZ20000`);
  const get = (r: string[], name: string) => {
    const i = idx(name);
    return i === -1 ? "" : (r[i] ?? "");
  };
  return rows
    .map((r, i) => ({
      movimentoId: get(r, "MovimentoID"),
      pedidoId: get(r, "PedidoID"),
      ciclo: parseInt(get(r, "Ciclo"), 10) || 1,
      acao: (get(r, "Ação") || "BAIXA") as MovAcao,
      status: (get(r, "Status") || "INICIADA") as MovStatus,
      dataInicio: get(r, "DataInicio"),
      dataFim: get(r, "DataFim"),
      itens: parseItens(get(r, "Itens")),
      erro: get(r, "Erro"),
      usuario: get(r, "Usuario"),
      row: i + 2,
    }))
    .filter((m) => m.movimentoId);
}

async function criarMovimento(m: {
  movimentoId: string;
  pedidoId: string;
  ciclo: number;
  acao: MovAcao;
  itens: MovItem[];
  usuario: string;
}) {
  await ensureMovSheet();
  const headers = await getHeaderRow(PEDIDOS_SHEET_ID, MOV_SHEET_NAME);
  const idx = indexer(headers);
  const row = new Array(headers.length).fill("");
  const set = (name: string, value: unknown) => {
    const i = idx(name);
    if (i !== -1) row[i] = value;
  };
  set("MovimentoID", m.movimentoId);
  set("PedidoID", m.pedidoId);
  set("Ciclo", m.ciclo);
  set("Ação", m.acao);
  set("Status", "INICIADA");
  set("DataInicio", agora());
  set("Itens", JSON.stringify(m.itens));
  set("Usuario", m.usuario);
  await appendRow(PEDIDOS_SHEET_ID, MOV_SHEET_NAME, row);
}

async function atualizarMovimento(
  movimentoIdValue: string,
  patch: { status?: MovStatus; erro?: string; dataFim?: string; itens?: MovItem[] },
) {
  const headers = await getHeaderRow(PEDIDOS_SHEET_ID, MOV_SHEET_NAME);
  const idx = indexer(headers);
  const movs = await listarMovimentosRaw();
  const alvo = movs.filter((m) => m.movimentoId === movimentoIdValue).pop();
  if (!alvo) return;
  const jobs: Array<Promise<unknown>> = [];
  const put = (name: string, value: unknown) => {
    const i = idx(name);
    if (i === -1) return;
    jobs.push(
      writeRange(
        PEDIDOS_SHEET_ID,
        `${MOV_SHEET_NAME}!${colLetter(i)}${alvo.row}`,
        [[value]],
      ),
    );
  };
  if (patch.status) put("Status", patch.status);
  if (patch.erro !== undefined) put("Erro", patch.erro);
  if (patch.dataFim) put("DataFim", patch.dataFim);
  if (patch.itens) put("Itens", JSON.stringify(patch.itens));
  await Promise.all(jobs);
}

/* -------------------------------------------------------------------------- */
/* Identificação segura dos itens do pedido                                    */
/* -------------------------------------------------------------------------- */

export type ItemResolvido = MovItem & { origem: "itens-sheet" | "numero-permanente" };

export type ResolucaoItens = {
  itens: ItemResolvido[];
  naoResolvidos: Array<{ texto: string; qtd: number; motivo: string }>;
};

function parseItensTexto(itens: string): Array<{ qtd: number; nome: string; numero: number | null }> {
  return itens
    .split("\n")
    .map((line) => {
      const m = line.match(/(\d+)x\s+(.+?)(?:\s+\(Nº\s*([0-9]+)\))?\s*$/);
      if (!m) return null;
      const qtd = parseInt(m[1], 10) || 0;
      if (qtd <= 0) return null;
      return {
        qtd,
        nome: m[2].trim(),
        numero: m[3] ? parseInt(m[3], 10) : null,
      };
    })
    .filter((x): x is { qtd: number; nome: string; numero: number | null } => x !== null);
}

/**
 * Prioridade de identificação:
 *  1. ID permanente da página no Notion (planilha de itens do pedido).
 *  2. Número permanente validado contra o Notion.
 *  3. Caso contrário: item fica em `naoResolvidos` — nunca casamos só por nome.
 */
export async function resolverItensPedido(
  pedidoId: string,
  itensTexto: string,
  catalogo: Array<{ id: string; numero: number | null; nome: string; colecao?: string; volume?: string }>,
): Promise<ResolucaoItens> {
  const linhas = await readRange(ITEMS_SHEET_ID, `${ITEMS_SHEET_NAME}!A2:K20000`);
  const doPedido = linhas.filter((r) => (r[1] ?? "") === pedidoId);

  const itens: ItemResolvido[] = [];
  const naoResolvidos: ResolucaoItens["naoResolvidos"] = [];

  if (doPedido.length > 0) {
    for (const r of doPedido) {
      const notionId = (r[7] ?? "").trim();
      const qtd = parseInt(r[3] ?? "0", 10) || 0;
      const nome = r[2] ?? "";
      if (qtd <= 0) continue;
      if (!notionId) {
        naoResolvidos.push({
          texto: nome,
          qtd,
          motivo: "Pedido antigo sem ID do produto registrado.",
        });
        continue;
      }
      itens.push({
        notionId: normalizarNotionId(notionId),
        numero: r[10] ? parseInt(r[10], 10) : null,
        nome,
        qtd,
        colecao: r[8] ?? "",
        volume: r[9] ?? "",
        precoUnit: parseFloat((r[4] ?? "0").replace(/\./g, "").replace(",", ".")) || 0,
        origem: "itens-sheet",
      });
    }
  } else {
    // Pedidos antigos: só aceitamos quando o número permanente está no texto.
    for (const it of parseItensTexto(itensTexto)) {
      if (it.numero == null) {
        naoResolvidos.push({
          texto: it.nome,
          qtd: it.qtd,
          motivo: "Sem número permanente no pedido — selecione o produto manualmente.",
        });
        continue;
      }
      const candidatos = catalogo.filter((p) => p.numero === it.numero);
      if (candidatos.length === 0) {
        naoResolvidos.push({
          texto: `${it.nome} (Nº ${it.numero})`,
          qtd: it.qtd,
          motivo: "Número permanente não encontrado no catálogo.",
        });
        continue;
      }
      const p = candidatos[0];
      itens.push({
        notionId: normalizarNotionId(p.id),
        numero: p.numero,
        nome: p.nome,
        qtd: it.qtd,
        colecao: p.colecao,
        volume: p.volume,
        origem: "numero-permanente",
      });
    }
  }

  return { itens: agruparItens(itens) as ItemResolvido[], naoResolvidos };
}

/** Agrupa produtos repetidos no mesmo pedido somando as quantidades. */
export function agruparItens<T extends MovItem>(itens: T[]): T[] {
  const map = new Map<string, T>();
  for (const it of itens) {
    const key = normalizarNotionId(it.notionId);
    const found = map.get(key);
    if (found) found.qtd += it.qtd;
    else map.set(key, { ...it, notionId: key });
  }
  return [...map.values()];
}

/* -------------------------------------------------------------------------- */
/* Validação                                                                   */
/* -------------------------------------------------------------------------- */

export type LinhaValidacao = {
  notionId: string;
  numero: number | null;
  nome: string;
  solicitado: number;
  disponivel: number;
  previsto: number;
  suficiente: boolean;
};

export async function validarEstoque(
  itens: MovItem[],
  delta: -1 | 1,
): Promise<{ linhas: LinhaValidacao[]; erros: string[] }> {
  const produtos = await Promise.all(itens.map((it) => lerProdutoNotion(it.notionId)));
  const linhas: LinhaValidacao[] = [];
  const erros: string[] = [];

  itens.forEach((it, i) => {
    const p = produtos[i];
    if (!p) {
      erros.push(`Produto não encontrado no Notion: ${it.nome} (${it.notionId}).`);
      linhas.push({
        notionId: it.notionId,
        numero: it.numero,
        nome: it.nome,
        solicitado: it.qtd,
        disponivel: 0,
        previsto: 0,
        suficiente: false,
      });
      return;
    }
    const previsto = p.amount + delta * it.qtd;
    const suficiente = delta > 0 || p.amount >= it.qtd;
    linhas.push({
      notionId: it.notionId,
      numero: p.numero ?? it.numero,
      nome: p.nome || it.nome,
      solicitado: it.qtd,
      disponivel: p.amount,
      previsto: Math.max(0, previsto),
      suficiente,
    });
    if (!suficiente) {
      const num = p.numero != null ? `Nº ${String(p.numero).padStart(3, "0")}` : "Nº —";
      erros.push(
        `${num} · ${p.nome}: solicitado ${it.qtd}, disponível ${p.amount}.`,
      );
    }
  });

  return { linhas, erros };
}

/* -------------------------------------------------------------------------- */
/* Aplicação protegida com compensação                                         */
/* -------------------------------------------------------------------------- */

export type ResultadoMovimento = {
  ok: boolean;
  status: MovStatus;
  movimentoId: string;
  erro?: string;
  linhas?: LinhaValidacao[];
};

async function registrarLogs(
  usuario: string,
  role: string,
  pedidoId: string,
  ciclo: number,
  acao: MovAcao,
  aplicados: Array<{ item: MovItem; antes: number; depois: number }>,
  resultado: string,
  erro?: string,
) {
  try {
    const { appendLog } = await import("./logs.server");
    for (const a of aplicados) {
      await appendLog({
        usuario,
        role,
        acao: `estoque:${acao.toLowerCase()}`,
        entidade: "movimentacao",
        id: `${pedidoId}:CICLO-${ciclo}`,
        antes: `${a.item.nome} (Nº ${a.item.numero ?? "—"} / ${a.item.notionId}) estoque ${a.antes}`,
        depois: `qtd ${a.item.qtd} → estoque ${a.depois} · ${resultado}${erro ? ` · erro: ${erro}` : ""}`,
      });
    }
  } catch (err) {
    console.error("Falha ao registrar log de estoque:", err);
  }
}

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
          ? "Esta movimentação já foi aplicada anteriormente. Nada foi alterado."
          : bloqueante.status === "INICIADA"
            ? "Já existe uma movimentação em andamento para este pedido e ciclo. Verifique a área de reconciliação."
            : "Este pedido e ciclo estão marcados como PRECISA_RECONCILIACAO. Resolva manualmente antes de repetir.",
    };
  }

  // --- Validação completa ANTES de qualquer escrita no Notion ---
  const { linhas, erros } = await validarEstoque(itens, delta);
  if (erros.length > 0) {
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
    for (const a of aplicados.reverse()) {
      try {
        const atual = await lerProdutoNotion(a.item.notionId);
        const base = atual?.amount ?? a.depois;
        await escreverAmountNotion(a.item.notionId, Math.max(0, base - delta * a.item.qtd));
      } catch (err) {
        falhasCompensacao.push(
          `${a.item.nome}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
    const status: MovStatus = falhasCompensacao.length === 0
      ? aplicados.length === 0
        ? "FALHOU"
        : "REVERTIDA"
      : "PRECISA_RECONCILIACAO";
    const erroFinal =
      `${falha}` +
      (falhasCompensacao.length > 0
        ? `\nFalha também na compensação: ${falhasCompensacao.join(" | ")}`
        : aplicados.length > 0
          ? "\nAs alterações anteriores foram revertidas."
          : "");
    await atualizarMovimento(movId, { status, erro: erroFinal, dataFim: agora() });
    await registrarLogs(usuario, role, pedidoId, ciclo, acao, aplicados, status, erroFinal);
    return { ok: false, status, movimentoId: movId, erro: erroFinal, linhas };
  }

  await atualizarMovimento(movId, { status: "APLICADA", dataFim: agora(), erro: "" });
  await registrarLogs(usuario, role, pedidoId, ciclo, acao, aplicados, "APLICADA");
  return { ok: true, status: "APLICADA", movimentoId: movId, linhas };
}

/* -------------------------------------------------------------------------- */
/* Coluna EstoqueCiclo / UltimoMovimentoStatus na aba Pedidos                  */
/* -------------------------------------------------------------------------- */

export async function lerCicloPedido(row: number): Promise<number> {
  const map = await ensureColunasPedido();
  const i = map["EstoqueCiclo"];
  const rows = await readRange(
    PEDIDOS_SHEET_ID,
    `${PEDIDOS_SHEET_NAME}!${colLetter(i)}${row}`,
  );
  const v = parseInt(rows?.[0]?.[0] ?? "", 10);
  return Number.isFinite(v) && v > 0 ? v : 1;
}

export async function escreverCicloPedido(row: number, ciclo: number) {
  const map = await ensureColunasPedido();
  await writeRange(
    PEDIDOS_SHEET_ID,
    `${PEDIDOS_SHEET_NAME}!${colLetter(map["EstoqueCiclo"])}${row}`,
    [[ciclo]],
  );
}

export async function escreverUltimoMovimentoStatus(row: number, status: string) {
  const map = await ensureColunasPedido();
  await writeRange(
    PEDIDOS_SHEET_ID,
    `${PEDIDOS_SHEET_NAME}!${colLetter(map["UltimoMovimentoStatus"])}${row}`,
    [[status]],
  );
}

export async function escreverStatusPedido(row: number, status: string) {
  const headers = await getHeaderRow(PEDIDOS_SHEET_ID, PEDIDOS_SHEET_NAME);
  const idx = indexer(headers);
  const i = idx("Status");
  await writeRange(
    PEDIDOS_SHEET_ID,
    `${PEDIDOS_SHEET_NAME}!${colLetter(i === -1 ? 7 : i)}${row}`,
    [[status]],
  );
}
