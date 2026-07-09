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
  itens: string;
  total: number;
  pagamento: string;
  parcelas: string;
  status: string;
  row: number;
};

export const criarPedido = createServerFn({ method: "POST" })
  .validator(
    (data: {
      cliente: string;
      itens: string;
      itensDetalhados: Array<{ id: string; nome: string; qtd: number; precoUnit: number }>;
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

    const row = [
      id,
      dataFmt,
      data.cliente,
      data.itens,
      data.total.toFixed(2).replace(".", ","),
      data.pagamento,
      parcelasStr,
      "Pendente",
    ];

    const url = `${GATEWAY}/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}!A:H:append?valueInputOption=USER_ENTERED`;
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
      let porId = new Map<string, { colecao: string; volume: string }>();
      try {
        const { getPerfumes } = await import("./perfumes.functions");
        const perfumes = await getPerfumes();
        porId = new Map(
          perfumes.map((p) => [p.id, { colecao: p.colecao, volume: p.volume }]),
        );
      } catch (err) {
        console.error("Falha ao enriquecer itens com coleção/volume:", err);
      }
      const itemRows = data.itensDetalhados.map((it) => {
        const extra = porId.get(it.id) ?? { colecao: "", volume: "" };
        return [
          dataFmt,
          id,
          it.nome,
          it.qtd,
          it.precoUnit.toFixed(2).replace(".", ","),
          (it.precoUnit * it.qtd).toFixed(2).replace(".", ","),
          data.cliente,
          it.id,
          extra.colecao,
          extra.volume,
        ];
      });
      const itemsUrl = `${GATEWAY}/spreadsheets/${ITEMS_SHEET_ID}/values/${ITEMS_SHEET_NAME}!A:J:append?valueInputOption=USER_ENTERED`;
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
    const url = `${GATEWAY}/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}!A2:H10000`;
    const res = await fetch(url, { headers: sheetsHeaders() });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Sheets read failed [${res.status}]: ${text}`);
    }
    const json = (await res.json()) as { values?: string[][] };
    const rows = json.values ?? [];
    return rows
      .map((r, i) => {
        const totalRaw = (r[4] ?? "0").toString().replace(/\./g, "").replace(",", ".");
        const total = parseFloat(totalRaw) || 0;
        return {
          id: r[0] ?? "",
          data: r[1] ?? "",
          cliente: r[2] ?? "",
          itens: r[3] ?? "",
          total,
          pagamento: r[5] ?? "",
          parcelas: r[6] ?? "",
          status: r[7] ?? "",
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

    const [itensRes, pedidosRes, perfumesModule] = await Promise.all([
      fetch(`${GATEWAY}/spreadsheets/${ITEMS_SHEET_ID}/values/${ITEMS_SHEET_NAME}!A2:H10000`, {
        headers: sheetsHeaders(),
      }),
      fetch(`${GATEWAY}/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}!A2:H10000`, {
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
    for (const r of pedidosRows) {
      const pedidoId = r[0] ?? "";
      if (!pedidoId || pedidosComItens.has(pedidoId)) continue;
      const dataFmt = r[1] ?? "";
      const cliente = r[2] ?? "";
      const status = r[7] ?? "";
      const itens = parseItensTexto(r[3] ?? "");
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
    const { requireAdmin } = await import("./admin.server");
    await requireAdmin();
    const url = `${GATEWAY}/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}!H${data.row}?valueInputOption=USER_ENTERED`;
    const res = await fetch(url, {
      method: "PUT",
      headers: sheetsHeaders(),
      body: JSON.stringify({ values: [[data.status]] }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Sheets update failed [${res.status}]: ${text}`);
    }

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
