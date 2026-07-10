import { createServerFn } from "@tanstack/react-start";

const DATABASE_ID = "38858811-29ca-83c5-b57d-0102c05505b1";
const GATEWAY = "https://connector-gateway.lovable.dev/notion/v1";

export type Genero = "feminino" | "masculino" | "unissex";
export type Volume = "25ml" | "50ml" | "80ml" | "100ml";
export type Colecao =
  | "Signature"
  | "Brand Collection"
  | "Arabic Collection"
  | "Dream Brand Collection";

export const COLECOES: Colecao[] = [
  "Signature",
  "Brand Collection",
  "Arabic Collection",
  "Dream Brand Collection",
];

export const COLECAO_INFO: Record<
  Colecao,
  { volumes: Volume[]; defaultVolume: Volume; sobEncomenda: boolean }
> = {
  Signature: { volumes: ["50ml", "100ml"], defaultVolume: "50ml", sobEncomenda: false },
  "Brand Collection": { volumes: ["25ml"], defaultVolume: "25ml", sobEncomenda: true },
  "Arabic Collection": { volumes: ["25ml"], defaultVolume: "25ml", sobEncomenda: true },
  "Dream Brand Collection": {
    volumes: ["80ml", "100ml"],
    defaultVolume: "100ml",
    sobEncomenda: true,
  },
};

export type Perfume = {
  id: string;
  nome: string;
  emEstoque: boolean;
  status: string;
  imagem: string | null;
  descricao: string;
  genero: Genero;
  volume: Volume;
  marca: string | null;
  preco: number | null;
  custo: number | null;
  amount: number | null;
  colecao: Colecao;
  lowThreshold: number | null;
  oosThreshold: number | null;
  sobEncomenda: boolean;
};

const GENERO_MAP: Record<string, Genero> = {
  angel: "feminino",
  yara: "feminino",
  "la vie est belle": "feminino",
  "good girl": "feminino",
  eclair: "feminino",
  "éclair": "feminino",
  scandal: "feminino",
  "212 vip rose": "feminino",
  "212 vip rosé": "feminino",
  fantasy: "feminino",
  "212 vip - this is a private party!": "masculino",
  "212 vip – this is a private party!": "masculino",
  "1 million": "masculino",
  "al noble wazeer": "masculino",
  "212 vip men": "masculino",
  asad: "masculino",
  "only the brave": "masculino",
  "acqua di gio": "masculino",
  "acqua di giò": "masculino",
  "212 vip black - own the party nyc": "masculino",
  "212 vip black – own the party nyc": "masculino",
};

function inferirGenero(nome: string): Genero {
  const key = nome.trim().toLowerCase();
  if (GENERO_MAP[key]) return GENERO_MAP[key];
  for (const [k, v] of Object.entries(GENERO_MAP)) {
    if (key.includes(k)) return v;
  }
  return "masculino";
}

type NotionFile =
  | { type: "external"; external: { url: string }; name?: string }
  | { type: "file"; file: { url: string }; name?: string };

type NotionPage = {
  id: string;
  cover: NotionFile | null;
  properties: Record<
    string,
    {
      type: string;
      title?: Array<{ plain_text: string }>;
      formula?: { string?: string };
      files?: NotionFile[];
      url?: string | null;
      rich_text?: Array<{ plain_text: string }>;
      number?: number | null;
      select?: { name?: string } | null;
      checkbox?: boolean;
    }
  >;
};

type NotionQueryResponse = { results: NotionPage[] };

function extractImage(page: NotionPage): string | null {
  if (page.cover) {
    if (page.cover.type === "external") return page.cover.external.url;
    if (page.cover.type === "file") return page.cover.file.url;
  }
  for (const prop of Object.values(page.properties)) {
    if (prop.type === "files" && prop.files && prop.files.length > 0) {
      const f = prop.files[0];
      if (f.type === "external") return f.external.url;
      if (f.type === "file") return f.file.url;
    }
  }
  for (const [name, prop] of Object.entries(page.properties)) {
    if (prop.type === "url" && prop.url && /imag/i.test(name)) return prop.url;
  }
  return null;
}

export const getPerfumes = createServerFn({ method: "GET" }).handler(
  async (): Promise<Perfume[]> => {
    const lovableKey = process.env.LOVABLE_API_KEY;
    const notionKey = process.env.NOTION_API_KEY;
    if (!lovableKey || !notionKey) {
      throw new Error("Notion connector não configurado");
    }

    const res = await fetch(`${GATEWAY}/databases/${DATABASE_ID}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": notionKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ page_size: 100 }),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Notion query failed [${res.status}]: ${text}`);
    }

    const data = (await res.json()) as NotionQueryResponse;

    return data.results.map((page) => {
      const nome =
        page.properties["Product Name"]?.title?.[0]?.plain_text ?? "Sem nome";
      const status = page.properties["Available?"]?.formula?.string ?? "";
      const emEstoque = status.includes("In Stock") || status.includes("Low");
      const descricao =
        page.properties["Descrição"]?.rich_text?.map((t) => t.plain_text).join("") ?? "";
      const preco = page.properties["Preço"]?.number ?? null;
      const custo = page.properties["Custo"]?.number ?? null;
      const amount = page.properties["Amount"]?.number ?? null;
      const volumeRaw = page.properties["Volume"]?.select?.name ?? "50ml";
      const volume: Volume = (["25ml", "50ml", "80ml", "100ml"] as const).includes(
        volumeRaw as Volume,
      )
        ? (volumeRaw as Volume)
        : "50ml";
      const marca = page.properties["Marca"]?.select?.name ?? null;
      const generoRaw = page.properties["Gênero"]?.select?.name?.toLowerCase() ?? "";
      const genero: Genero =
        generoRaw === "feminino" || generoRaw === "masculino" || generoRaw === "unissex"
          ? (generoRaw as Genero)
          : inferirGenero(nome);
      const colecaoRaw = page.properties["Coleção"]?.select?.name ?? "";
      const colecao: Colecao = (COLECOES as string[]).includes(colecaoRaw)
        ? (colecaoRaw as Colecao)
        : "Signature";
      const lowThreshold = page.properties["Low threshold "]?.number ?? null;
      const oosThreshold = page.properties["OoS threshold"]?.number ?? null;
      const sobEncomenda = page.properties["Sob encomenda"]?.checkbox ?? false;
      return {
        id: page.id,
        nome,
        emEstoque,
        status,
        imagem: extractImage(page),
        descricao,
        genero,
        volume,
        marca,
        preco,
        custo,
        amount,
        colecao,
        lowThreshold,
        oosThreshold,
        sobEncomenda,
      };
    });
  },
);

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

export const atualizarPerfume = createServerFn({ method: "POST" })
  .validator(
    (data: {
      id: string;
      nome?: string;
      descricao?: string;
      preco?: number | null;
      custo?: number | null;
      amount?: number | null;
      volume?: Volume;
      marca?: string | null;
      imagemUrl?: string | null;
      colecao?: Colecao;
      genero?: Genero;
      lowThreshold?: number | null;
      oosThreshold?: number | null;
      sobEncomenda?: boolean;
    }) => data,
  )
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("./admin.server");
    await requireAdmin();

    const properties: Record<string, unknown> = {};
    if (data.nome !== undefined)
      properties["Product Name"] = { title: [{ text: { content: data.nome } }] };
    if (data.descricao !== undefined)
      properties["Descrição"] = { rich_text: [{ text: { content: data.descricao } }] };
    if (data.preco !== undefined) properties["Preço"] = { number: data.preco };
    if (data.custo !== undefined) properties["Custo"] = { number: data.custo };
    if (data.amount !== undefined) properties["Amount"] = { number: data.amount };
    if (data.volume !== undefined) properties["Volume"] = { select: { name: data.volume } };
    if (data.marca !== undefined)
      properties["Marca"] = data.marca ? { select: { name: data.marca } } : { select: null };
    if (data.colecao !== undefined)
      properties["Coleção"] = { select: { name: data.colecao } };
    if (data.genero !== undefined)
      properties["Gênero"] = { select: { name: generoNotionName(data.genero) } };
    if (data.lowThreshold !== undefined)
      properties["Low threshold "] = { number: data.lowThreshold };
    if (data.oosThreshold !== undefined)
      properties["OoS threshold"] = { number: data.oosThreshold };
    if (data.sobEncomenda !== undefined) properties["Sob encomenda"] = { checkbox: data.sobEncomenda };

    const body: Record<string, unknown> = { properties };
    if (data.imagemUrl !== undefined && data.imagemUrl) {
      body.cover = { type: "external", external: { url: data.imagemUrl } };
    }

    const res = await fetch(`${GATEWAY}/pages/${data.id}`, {
      method: "PATCH",
      headers: notionHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Notion update failed [${res.status}]: ${text}`);
    }
    return { ok: true };
  });

function generoNotionName(g: Genero): string {
  if (g === "feminino") return "Feminino";
  if (g === "masculino") return "Masculino";
  return "Unissex";
}

// Ajuste direto usado internamente pelo servidor. delta negativo = baixa, positivo = devolve.
export async function ajustarEstoqueInterno(id: string, delta: number) {
  const getRes = await fetch(`${GATEWAY}/pages/${id}`, { headers: notionHeaders() });
  if (!getRes.ok) return { ok: false as const };
  const page = (await getRes.json()) as NotionPage;
  const current = page.properties["Amount"]?.number ?? 0;
  const next = Math.max(0, current + delta);
  const res = await fetch(`${GATEWAY}/pages/${id}`, {
    method: "PATCH",
    headers: notionHeaders(),
    body: JSON.stringify({ properties: { Amount: { number: next } } }),
  });
  return { ok: res.ok, novoEstoque: next };
}

// Compat: baixa (delta negativo).
export async function baixarEstoqueInterno(id: string, qtd: number) {
  return ajustarEstoqueInterno(id, -qtd);
}

export const criarPerfume = createServerFn({ method: "POST" })
  .validator(
    (data: {
      nome: string;
      descricao?: string;
      preco?: number | null;
      custo?: number | null;
      amount?: number | null;
      volume: Volume;
      marca?: string | null;
      imagemUrl?: string | null;
      colecao?: Colecao;
      genero?: Genero;
      lowThreshold?: number | null;
      oosThreshold?: number | null;
      checkbox?: boolean;
    }) => data,
  )
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("./admin.server");
    await requireAdmin();

    const properties: Record<string, unknown> = {
      "Product Name": { title: [{ text: { content: data.nome } }] },
      Volume: { select: { name: data.volume } },
    };
    if (data.descricao)
      properties["Descrição"] = { rich_text: [{ text: { content: data.descricao } }] };
    if (data.preco != null) properties["Preço"] = { number: data.preco };
    if (data.custo != null) properties["Custo"] = { number: data.custo };
    if (data.amount != null) properties["Amount"] = { number: data.amount };
    if (data.marca) properties["Marca"] = { select: { name: data.marca } };
    if (data.colecao) properties["Coleção"] = { select: { name: data.colecao } };
    if (data.genero)
      properties["Gênero"] = { select: { name: generoNotionName(data.genero) } };
    if (data.lowThreshold != null)
      properties["Low threshold "] = { number: data.lowThreshold };
    if (data.oosThreshold != null)
      properties["OoS threshold"] = { number: data.oosThreshold };
    if (data.checkbox !== undefined) properties["Checkbox"] = { checkbox: data.checkbox };

    const body: Record<string, unknown> = {
      parent: { database_id: DATABASE_ID },
      properties,
    };
    if (data.imagemUrl) {
      body.cover = { type: "external", external: { url: data.imagemUrl } };
    }

    const res = await fetch(`${GATEWAY}/pages`, {
      method: "POST",
      headers: notionHeaders(),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Notion create failed [${res.status}]: ${text}`);
    }
    const created = (await res.json()) as { id: string };
    return { ok: true, id: created.id };
  });

