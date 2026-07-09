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
  row: number; // 1-indexed sheet row
};

export const criarPedido = createServerFn({ method: "POST" })
  .validator(
    (data: {
      cliente: string;
      itens: string;
      itensDetalhados: Array<{ nome: string; qtd: number; precoUnit: number }>;
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

    // Registra cada item vendido na 2ª planilha
    if (data.itensDetalhados.length > 0) {
      const itemRows = data.itensDetalhados.map((it) => [
        dataFmt,
        id,
        it.nome,
        it.qtd,
        it.precoUnit.toFixed(2).replace(".", ","),
        (it.precoUnit * it.qtd).toFixed(2).replace(".", ","),
        data.cliente,
      ]);
      const itemsUrl = `${GATEWAY}/spreadsheets/${ITEMS_SHEET_ID}/values/${ITEMS_SHEET_NAME}!A:G:append?valueInputOption=USER_ENTERED`;
      const itemsRes = await fetch(itemsUrl, {
        method: "POST",
        headers: sheetsHeaders(),
        body: JSON.stringify({ values: itemRows }),
      });
      if (!itemsRes.ok) {
        const text = await itemsRes.text();
        console.error(`Sheets items append failed [${itemsRes.status}]: ${text}`);
        // não falha o pedido se o log de itens falhar
      }
    }

    return { id };
  });

export const listarPedidos = createServerFn({ method: "GET" }).handler(
  async (): Promise<Pedido[]> => {
    const { requireAdmin } = await import("./admin.server"); await requireAdmin();
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

export const atualizarStatusPedido = createServerFn({ method: "POST" })
  .validator(
    (data: { row: number; status: "Concluído" | "Cancelado" | "Pendente" }) => data,
  )
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("./admin.server"); await requireAdmin();
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
    return { ok: true };
  });
