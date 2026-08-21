import { createServerFn } from "@tanstack/react-start";


const SHEET_ID = "1YDXLWaevUB9LnrQGImIV9iGBT9ayCbZYdkzaWkXZrWw";
const SHEET_NAME = "Pedidos";
const ITEMS_SHEET_ID = "1jDoMknc5tZ_XQbbRlo4luPGU4c6WrC5Jn5E6p8--FbM";
const ITEMS_SHEET_NAME = "Página1";
const GATEWAY = "https://connector-gateway.lovable.dev/google_sheets/v4";

function sheetsHeaders() {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const sheetsKey = process.env.GOOGLE_SHEETS_API_KEY;
  if (!lovableKey || !sheetsKey) {
    throw new Error("Google Sheets connector não configurado");
  }
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": sheetsKey,
    "Content-Type": "application/json",
  };
}

export type Pedido = {
  id: string;
  data: string;
  cliente: string;
  telefone: string;
  itens: string;
  total: number;
  pagamento: string;
  parcelas: string;
  status: string;
  rastreio: string;
  row: number;
};

async function getHeaders(sheetId: string, range: string) {
  const url = `${GATEWAY}/spreadsheets/${sheetId}/values/${range}!1:1`;
  const res = await fetch(url, { headers: sheetsHeaders() });
  if (!res.ok) return [];
  const json = await res.json() as { values?: string[][] };
  return json.values?.[0] || [];
}

async function ensureColumn(sheetId: string, range: string, columnName: string) {
  const headers = await getHeaders(sheetId, range);
  const index = headers.findIndex(h => h.toLowerCase() === columnName.toLowerCase());
  
  if (index !== -1) return index;

  // Add new column
  const nextColIndex = headers.length;
  const colLetter = String.fromCharCode(65 + nextColIndex); // Simple A-Z for now, might need better logic for >26
  const updateUrl = `${GATEWAY}/spreadsheets/${sheetId}/values/${range}!${colLetter}1?valueInputOption=USER_ENTERED`;
  
  await fetch(updateUrl, {
    method: "PUT",
    headers: sheetsHeaders(),
    body: JSON.stringify({ values: [[columnName]] }),
  });

  return nextColIndex;
}


export const criarPedido = createServerFn({ method: "POST" })
  .validator(
    (data: {
      cliente: string;
      telefone: string;
      itens: string;
      itensDetalhados: Array<{ 
        id: string; 
        nome: string; 
        qtd: number; 
        precoUnit: number;
        numero?: number | null;
        colecao?: string;
        volume?: string;
        marca?: string | null;
      }>;
      total: number;
      pagamento: "Pix" | "Cartão";
      parcelas: number;
    }) => data,
  )
  .handler(async ({ data }) => {
    const id = `PED-${Date.now().toString(36).toUpperCase()}`;
    const now = new Date();
    const dataFmt = now.toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
    const parcelasStr = data.pagamento === "Cartão" ? `${data.parcelas}x` : "-";

    // Ensure Telefone column exists
    await ensureColumn(SHEET_ID, SHEET_NAME, "Telefone");
    
    // Get headers to determine indices
    const headers = await getHeaders(SHEET_ID, SHEET_NAME);
    const getIdx = (name: string) => headers.findIndex(h => h.toLowerCase() === name.toLowerCase());

    const colIndices = {
      id: getIdx("ID"),
      data: getIdx("Data"),
      cliente: getIdx("Cliente"),
      telefone: getIdx("Telefone"),
      itens: getIdx("Itens"),
      total: getIdx("Total"),
      pagamento: getIdx("Pagamento"),
      parcelas: getIdx("Parcelas"),
      status: getIdx("Status"),
    };

    // Create a row with the correct length based on headers
    const row = new Array(headers.length).fill("");
    if (colIndices.id !== -1) row[colIndices.id] = id;
    if (colIndices.data !== -1) row[colIndices.data] = dataFmt;
    if (colIndices.cliente !== -1) row[colIndices.cliente] = data.cliente;
    if (colIndices.telefone !== -1) row[colIndices.telefone] = data.telefone;
    if (colIndices.itens !== -1) row[colIndices.itens] = data.itens;
    if (colIndices.total !== -1) row[colIndices.total] = data.total.toFixed(2).replace(".", ",");
    if (colIndices.pagamento !== -1) row[colIndices.pagamento] = data.pagamento;
    if (colIndices.parcelas !== -1) row[colIndices.parcelas] = parcelasStr;
    if (colIndices.status !== -1) row[colIndices.status] = "Pendente";

    const url = `${GATEWAY}/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}!A:Z:append?valueInputOption=USER_ENTERED`;
    const res = await fetch(url, {
      method: "POST",
      headers: sheetsHeaders(),
      body: JSON.stringify({ values: [row] }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`Sheets append failed [${res.status}]: ${text}`);
      throw new Error(`Sheets append failed [${res.status}]: ${text}`);
    }

    if (data.itensDetalhados.length > 0) {
      // Enriquecer com coleção/volume via Notion.
      let porId = new Map<string, { colecao: string; volume: string; numero: number | null }>();
      try {
        const { getPerfumes } = await import("./perfumes.functions");
        const perfumes = await getPerfumes();
        porId = new Map(
          perfumes.map((p) => [p.id, { colecao: p.colecao, volume: p.volume, numero: p.numero }]),
        );
      } catch (err) {
        console.error("Falha ao enriquecer itens com coleção/volume:", err);
      }
      const itemRows = data.itensDetalhados.map((it) => {
        const extra = porId.get(it.id) ?? { colecao: "", volume: "", numero: null };
        // Salva uma fotografia do produto no momento da compra
        return [
          dataFmt,
          id,
          it.nome,
          it.qtd,
          it.precoUnit.toFixed(2).replace(".", ","),
          (it.precoUnit * it.qtd).toFixed(2).replace(".", ","),
          data.cliente,
          it.id,
          it.colecao || extra.colecao,
          it.volume || extra.volume,
          it.numero !== undefined ? it.numero : extra.numero,
        ];
      });
      const itemsUrl = `${GATEWAY}/spreadsheets/${ITEMS_SHEET_ID}/values/${ITEMS_SHEET_NAME}!A:K:append?valueInputOption=USER_ENTERED`;
      const itemsRes = await fetch(itemsUrl, {
        method: "POST",
        headers: sheetsHeaders(),
        body: JSON.stringify({ values: itemRows }),
      });
      if (!itemsRes.ok) {
        const text = await itemsRes.text();
        console.error(`Sheets items append failed [${itemsRes.status}]: ${text}`);
      }
    }

    return { id };
  });

export const listarPedidos = createServerFn({ method: "GET" }).handler(
  async (): Promise<Pedido[]> => {
    const { requireAdmin } = await import("./admin.server");
    await requireAdmin();
    
    // Get headers first
    const headers = await getHeaders(SHEET_ID, SHEET_NAME);
    const getIdx = (name: string) => headers.findIndex(h => h.toLowerCase() === name.toLowerCase());

    const colIndices = {
      id: getIdx("ID"),
      data: getIdx("Data"),
      cliente: getIdx("Cliente"),
      telefone: getIdx("Telefone"),
      itens: getIdx("Itens"),
      total: getIdx("Total"),
      pagamento: getIdx("Pagamento"),
      parcelas: getIdx("Parcelas"),
      status: getIdx("Status"),
      rastreio: getIdx("Rastreio"),
    };

    const url = `${GATEWAY}/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}!A2:Z10000`;
    const res = await fetch(url, { headers: sheetsHeaders() });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Sheets read failed [${res.status}]: ${text}`);
    }
    const json = (await res.json()) as { values?: string[][] };
    const rows = json.values ?? [];
    
    return rows
      .map((r, i) => {
        const val = (idx: number) => (idx !== -1 ? r[idx] : "") ?? "";
        const totalRaw = val(colIndices.total).toString().replace(/\./g, "").replace(",", ".");
        const total = parseFloat(totalRaw) || 0;
        
        return {
          id: val(colIndices.id),
          data: val(colIndices.data),
          cliente: val(colIndices.cliente),
          telefone: val(colIndices.telefone),
          itens: val(colIndices.itens),
          total,
          pagamento: val(colIndices.pagamento),
          parcelas: val(colIndices.parcelas),
          status: val(colIndices.status),
          rastreio: val(colIndices.rastreio),
          row: i + 2,
        };
      })
      .filter((p) => p.id);
  },
);

export type ItemVendido = {
  data: string;
  pedidoId: string;
  perfume: string;
  perfumeId: string;
  qtd: number;
  precoUnit: number;
  subtotal: number;
  cliente: string;
  statusPedido: string;
};

// Parse "• 2x Angel (Nº 001)" lines from a pedido.itens text field.
function parseItensTexto(itens: string): Array<{ qtd: number; nome: string }> {
  return itens
    .split("\n")
    .map((line) => {
      const m = line.match(/(\d+)x\s+(.+?)(?:\s+\(Nº[^)]*\))?\s*$/);
      if (!m) return null;
      return { qtd: parseInt(m[1], 10) || 0, nome: m[2].trim() };
    })
    .filter((x): x is { qtd: number; nome: string } => x !== null && x.qtd > 0);
}

// Deriva a lista de itens vendidos combinando: (1) a segunda planilha, quando existir,
// e (2) o campo "Itens" do pedido, parseado — para que pedidos antigos também apareçam.
export const listarItensVendidos = createServerFn({ method: "GET" }).handler(
  async (): Promise<ItemVendido[]> => {
    const { requireAdmin } = await import("./admin.server");
    await requireAdmin();

    const headers = await getHeaders(SHEET_ID, SHEET_NAME);
    const getIdx = (name: string) => headers.findIndex(h => h.toLowerCase() === name.toLowerCase());

    const [itensRes, pedidosRes, perfumesModule] = await Promise.all([
      fetch(`${GATEWAY}/spreadsheets/${ITEMS_SHEET_ID}/values/${ITEMS_SHEET_NAME}!A2:K10000`, {
        headers: sheetsHeaders(),
      }),
      fetch(`${GATEWAY}/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}!A2:Z10000`, {
        headers: sheetsHeaders(),
      }),
      import("./perfumes.functions"),
    ]);
    const perfumes = await perfumesModule.getPerfumes();
    const perfumePorNome = new Map(perfumes.map((p) => [p.nome.toLowerCase(), p]));

    const pedidosRows = pedidosRes.ok
      ? ((await pedidosRes.json()) as { values?: string[][] }).values ?? []
      : [];

    const itensRows = itensRes.ok
      ? ((await itensRes.json()) as { values?: string[][] }).values ?? []
      : [];

    // Pedidos que já têm linhas na planilha de itens (não duplicar).
    const pedidosComItens = new Set(itensRows.map((r) => r[1]).filter(Boolean));

    const doSheet: ItemVendido[] = itensRows
      .map((r) => {
        const preco = parseFloat((r[4] ?? "0").toString().replace(/\./g, "").replace(",", "."));
        const sub = parseFloat((r[5] ?? "0").toString().replace(/\./g, "").replace(",", "."));
        return {
          data: r[0] ?? "",
          pedidoId: r[1] ?? "",
          perfume: r[2] ?? "",
          qtd: parseInt(r[3] ?? "0", 10) || 0,
          precoUnit: preco || 0,
          subtotal: sub || 0,
          cliente: r[6] ?? "",
          perfumeId: r[7] ?? "",
          statusPedido: "",
        };
      })
      .filter((i) => i.pedidoId);

    const derivados: ItemVendido[] = [];
    const colIndices = {
      id: getIdx("ID"),
      data: getIdx("Data"),
      cliente: getIdx("Cliente"),
      itens: getIdx("Itens"),
      status: getIdx("Status"),
    };

    for (const r of pedidosRows) {
      const pedidoId = colIndices.id !== -1 ? r[colIndices.id] : r[0];
      if (!pedidoId || pedidosComItens.has(pedidoId)) continue;
      const dataFmt = colIndices.data !== -1 ? r[colIndices.data] : r[1];
      const cliente = colIndices.cliente !== -1 ? r[colIndices.cliente] : r[2];
      const status = colIndices.status !== -1 ? r[colIndices.status] : r[7];
      const itensRaw = colIndices.itens !== -1 ? r[colIndices.itens] : r[3];
      const itens = parseItensTexto(itensRaw ?? "");
      for (const it of itens) {
        const p = perfumePorNome.get(it.nome.toLowerCase());
        const precoUnit = p?.preco ?? 0;
        derivados.push({
          data: dataFmt,
          pedidoId,
          perfume: it.nome,
          qtd: it.qtd,
          precoUnit,
          subtotal: precoUnit * it.qtd,
          cliente,
          perfumeId: p?.id ?? "",
          statusPedido: status,
        });
      }
    }

    // Preencher status nos que vieram da planilha de itens
    const statusPorPedido = new Map<string, string>();
    pedidosRows.forEach((r) => {
      if (r[0]) statusPorPedido.set(r[0], r[7] ?? "");
    });
    doSheet.forEach((it) => {
      it.statusPedido = statusPorPedido.get(it.pedidoId) ?? "";
    });

    return [...doSheet, ...derivados];
  },
);

export const atualizarStatusPedido = createServerFn({ method: "POST" })
  .validator(
    (data: {
      row: number;
      pedidoId: string;
      statusAtual: string;
      itensTexto: string;
      status: "Concluído" | "Cancelado" | "Pendente";
    }) => data,
  )
  .handler(async ({ data }) => {
    const { requireAdmin, currentAdmin } = await import("./admin.server");
    await requireAdmin();
    const headers = await getHeaders(SHEET_ID, SHEET_NAME);
    const getIdx = (name: string) => headers.findIndex(h => h.toLowerCase() === name.toLowerCase());
    const statusIdx = getIdx("Status");
    const colLetter = statusIdx !== -1 ? String.fromCharCode(65 + statusIdx) : "H";

    const url = `${GATEWAY}/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}!${colLetter}${data.row}?valueInputOption=USER_ENTERED`;
    const res = await fetch(url, {
      method: "PUT",
      headers: sheetsHeaders(),
      body: JSON.stringify({ values: [[data.status]] }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Sheets update failed [${res.status}]: ${text}`);
    }

    try {
      const { appendLog } = await import("./logs.server");
      const me = await currentAdmin();
      appendLog({
        usuario: me?.login,
        role: me?.role,
        acao: "atualizar",
        entidade: "pedido",
        id: data.pedidoId,
        antes: data.statusAtual,
        depois: data.status,
      });
    } catch {}

    // Ajuste de estoque conforme transição (idempotente por transição).
    // Concluído → baixa. Sair de Concluído (Cancelado/Pendente) → devolve.
    const saiuDeConcluido =
      data.statusAtual === "Concluído" && data.status !== "Concluído";
    const entrouEmConcluido =
      data.statusAtual !== "Concluído" && data.status === "Concluído";

    if (entrouEmConcluido || saiuDeConcluido) {
      try {
        const { getPerfumes, ajustarEstoqueInterno } = await import("./perfumes.functions");
        const perfumes = await getPerfumes();
        const porNome = new Map(perfumes.map((p) => [p.nome.toLowerCase(), p]));
        const itens = parseItensTextoLocal(data.itensTexto);
        const delta = entrouEmConcluido ? -1 : 1;
        await Promise.all(
          itens.map(async (it) => {
            const p = porNome.get(it.nome.toLowerCase());
            if (!p) {
              console.error(`Perfume não encontrado para ajuste: "${it.nome}"`);
              return;
            }
            try {
              await ajustarEstoqueInterno(p.id, delta * it.qtd);
            } catch (err) {
              console.error("ajustarEstoque falhou:", err);
            }
          }),
        );
      } catch (err) {
        console.error("Erro ao processar ajuste de estoque:", err);
      }
    }

    return { ok: true };
  });

export const processarSaidaEstoque = createServerFn({ method: "POST" })
  .validator((data: { row: number; pedidoId: string; itensTexto: string }) => data)
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("./admin.server");
    await requireAdmin();

    return atualizarStatusPedido({
      data: {
        row: data.row,
        pedidoId: data.pedidoId,
        statusAtual: "Pendente",
        itensTexto: data.itensTexto,
        status: "Concluído"
      }
    });
  });


export const atualizarRastreio = createServerFn({ method: "POST" })
  .validator((data: { row: number; pedidoId: string; rastreio: string; rastreioAtual: string }) => data)
  .handler(async ({ data }) => {
    const { requireAdmin, currentAdmin } = await import("./admin.server");
    await requireAdmin();
    const headers = await getHeaders(SHEET_ID, SHEET_NAME);
    const getIdx = (name: string) => headers.findIndex(h => h.toLowerCase() === name.toLowerCase());
    const rastreioIdx = getIdx("Rastreio");
    const colLetter = rastreioIdx !== -1 ? String.fromCharCode(65 + rastreioIdx) : "I";

    const url = `${GATEWAY}/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}!${colLetter}${data.row}?valueInputOption=USER_ENTERED`;
    const res = await fetch(url, {
      method: "PUT",
      headers: sheetsHeaders(),
      body: JSON.stringify({ values: [[data.rastreio]] }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Sheets update failed [${res.status}]: ${text}`);
    }
    try {
      const { appendLog } = await import("./logs.server");
      const me = await currentAdmin();
      appendLog({
        usuario: me?.login,
        role: me?.role,
        acao: "atualizar",
        entidade: "pedido.rastreio",
        id: data.pedidoId,
        antes: data.rastreioAtual,
        depois: data.rastreio,
      });
    } catch {}
    return { ok: true };
  });


function parseItensTextoLocal(itens: string): Array<{ qtd: number; nome: string }> {
  return itens
    .split("\n")
    .map((line) => {
      const m = line.match(/(\d+)x\s+(.+?)(?:\s+\(Nº[^)]*\))?\s*$/);
      if (!m) return null;
      return { qtd: parseInt(m[1], 10) || 0, nome: m[2].trim() };
    })
    .filter((x): x is { qtd: number; nome: string } => x !== null && x.qtd > 0);
}
