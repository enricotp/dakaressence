import { createServerFn } from "@tanstack/react-start";

const SHEET_ID = "1YDXLWaevUB9LnrQGImIV9iGBT9ayCbZYdkzaWkXZrWw";
const SHEET_NAME = "Pedidos";
const GATEWAY = "https://connector-gateway.lovable.dev/google_sheets/v4";

function sheetsHeaders() {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const sheetsKey = process.env.GOOGLE_SHEETS_API_KEY;
  if (!lovableKey || !sheetsKey) throw new Error("Sheets connector não configurado");
  return {
    Authorization: `Bearer ${lovableKey}`,
    "X-Connection-Api-Key": sheetsKey,
  };
}

export type PedidoPublico = {
  id: string;
  data: string;
  cliente: string;
  itens: string;
  total: number;
  pagamento: string;
  parcelas: string;
  status: string;
  rastreio: string;
};

export const rastrearPedido = createServerFn({ method: "GET" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }): Promise<PedidoPublico | null> => {
    const url = `${GATEWAY}/spreadsheets/${SHEET_ID}/values/${SHEET_NAME}!A2:I10000`;
    const res = await fetch(url, { headers: sheetsHeaders() });
    if (!res.ok) return null;
    const json = (await res.json()) as { values?: string[][] };
    const rows = json.values ?? [];
    const alvo = data.id.trim().toUpperCase();
    const row = rows.find((r) => (r[0] ?? "").toUpperCase() === alvo);
    if (!row) return null;
    const totalRaw = (row[4] ?? "0").toString().replace(/\./g, "").replace(",", ".");
    return {
      id: row[0] ?? "",
      data: row[1] ?? "",
      cliente: (row[2] ?? "").split(" ")[0] ?? "",
      itens: row[3] ?? "",
      total: parseFloat(totalRaw) || 0,
      pagamento: row[5] ?? "",
      parcelas: row[6] ?? "",
      status: row[7] ?? "Pendente",
      rastreio: (row[8] ?? "").trim(),
    };
  });

