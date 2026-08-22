import { createServerFn } from "@tanstack/react-start";
import { type Colecao, type Volume } from "./perfumes.functions";

const CONFIG_DB_ID = "3bf58811-29ca-81f5-a605-e63c22344bdf";
const GATEWAY = "https://connector-gateway.lovable.dev/notion/v1";

export type HomeConfig = {
  id: string;
  key: string;
  nome: string;
  descricao: string;
  ordem: number;
  precos: Partial<Record<Volume, number>>;
  tituloPrincipal: string;
  textoPrincipal: string;
  imagens: string[];
};

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

export const getHomeConfig = createServerFn({ method: "GET" }).handler(
  async (): Promise<HomeConfig[]> => {
    const res = await fetch(`${GATEWAY}/databases/${CONFIG_DB_ID}/query`, {
      method: "POST",
      headers: notionHeaders(),
      cache: "no-store",
      body: JSON.stringify({
        sorts: [{ property: "Ordem", direction: "ascending" }],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Notion config query failed [${res.status}]: ${text}`);
    }

    const data = (await res.json()) as { results: any[] };

    return data.results.map((page) => {
      const props = page.properties;
      const key = props.Key?.title?.[0]?.plain_text ?? "";
      const nome = props.Nome?.rich_text?.[0]?.plain_text ?? "";
      const descricao = props["Descrição"]?.rich_text?.map((t: any) => t.plain_text).join("") ?? "";
      const ordem = props.Ordem?.number ?? 0;
      const tituloPrincipal = props["Título Principal"]?.rich_text?.[0]?.plain_text ?? "";
      const textoPrincipal = props["Texto Principal"]?.rich_text?.map((t: any) => t.plain_text).join("") ?? "";
      const imagensRaw = props["ImagensCarrossel"]?.rich_text?.[0]?.plain_text ?? "[]";
      
      let imagens: string[] = [];
      try {
        imagens = JSON.parse(imagensRaw);
        if (!Array.isArray(imagens)) imagens = [];
      } catch {
        imagens = [];
      }

      const precos: Partial<Record<Volume, number>> = {};
      if (props["Preço 25ml"]?.number !== undefined) precos["25ml"] = props["Preço 25ml"].number;
      if (props["Preço 50ml"]?.number !== undefined) precos["50ml"] = props["Preço 50ml"].number;
      if (props["Preço 80ml"]?.number !== undefined) precos["80ml"] = props["Preço 80ml"].number;
      if (props["Preço 100ml"]?.number !== undefined) precos["100ml"] = props["Preço 100ml"].number;

      return {
        id: page.id,
        key,
        nome,
        descricao,
        ordem,
        precos,
        tituloPrincipal,
        textoPrincipal,
        imagens,
      };
    });
  }
);

export const updateHomeConfig = createServerFn({ method: "POST" })
  .validator((data: {
    id: string;
    key: string;
    nome?: string;
    descricao?: string;
    precos?: Partial<Record<Volume, number>>;
    tituloPrincipal?: string;
    textoPrincipal?: string;
    imagens?: string[];
  }) => data)
  .handler(async ({ data }) => {
    const { requireAdmin, currentAdmin } = await import("./admin.server");
    await requireAdmin("gerente");

    const properties: Record<string, any> = {};

    if (data.nome !== undefined) {
      properties.Nome = { rich_text: [{ text: { content: data.nome } }] };
    }
    if (data.descricao !== undefined) {
      properties["Descrição"] = { rich_text: [{ text: { content: data.descricao } }] };
    }
    if (data.tituloPrincipal !== undefined) {
      properties["Título Principal"] = { rich_text: [{ text: { content: data.tituloPrincipal } }] };
    }
    if (data.textoPrincipal !== undefined) {
      properties["Texto Principal"] = { rich_text: [{ text: { content: data.textoPrincipal } }] };
    }

    if (data.precos) {
      if (data.precos["25ml"] !== undefined) properties["Preço 25ml"] = { number: data.precos["25ml"] };
      if (data.precos["50ml"] !== undefined) properties["Preço 50ml"] = { number: data.precos["50ml"] };
      if (data.precos["80ml"] !== undefined) properties["Preço 80ml"] = { number: data.precos["80ml"] };
      if (data.precos["100ml"] !== undefined) properties["Preço 100ml"] = { number: data.precos["100ml"] };
    }

    const res = await fetch(`${GATEWAY}/pages/${data.id}`, {
      method: "PATCH",
      headers: notionHeaders(),
      body: JSON.stringify({ properties }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Notion update config failed [${res.status}]: ${text}`);
    }

    try {
      const { appendLog } = await import("./logs.server");
      const me = await currentAdmin();
      appendLog({
        usuario: me?.login,
        role: me?.role,
        acao: "atualizar",
        entidade: "config_home",
        id: data.key,
        depois: Object.keys(data).filter(k => k !== 'id' && k !== 'key').join(", ")
      });
    } catch {}

    return { ok: true };
  });
