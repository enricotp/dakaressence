import { createServerFn } from "@tanstack/react-start";

const DATABASE_ID = "38858811-29ca-83c5-b57d-0102c05505b1";
const GATEWAY = "https://connector-gateway.lovable.dev/notion/v1";

export type Genero = "feminino" | "masculino";

export type Perfume = {
  id: string;
  nome: string;
  emEstoque: boolean;
  status: string;
  imagem: string | null;
  descricao: string;
  genero: Genero;
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
  "212 vip - this is a private party!": "feminino",
  "212 vip – this is a private party!": "feminino",
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
    }
  >;
};

type NotionQueryResponse = { results: NotionPage[] };

function extractImage(page: NotionPage): string | null {
  // 1. Page cover
  if (page.cover) {
    if (page.cover.type === "external") return page.cover.external.url;
    if (page.cover.type === "file") return page.cover.file.url;
  }
  // 2. Any Files & media property (first item), commonly named "Imagem" or "Image"
  for (const prop of Object.values(page.properties)) {
    if (prop.type === "files" && prop.files && prop.files.length > 0) {
      const f = prop.files[0];
      if (f.type === "external") return f.external.url;
      if (f.type === "file") return f.file.url;
    }
  }
  // 3. URL property named "Imagem" / "Image"
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
      return {
        id: page.id,
        nome,
        emEstoque,
        status,
        imagem: extractImage(page),
        descricao,
        genero: inferirGenero(nome),
      };
    });
  },
);
