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
  { volumes: Volume[]; defaultVolume: Volume; sobEncomenda: boolean; prazoEncomendaDias: number }
> = {
  Signature: { volumes: ["50ml", "100ml"], defaultVolume: "50ml", sobEncomenda: false, prazoEncomendaDias: 6 },
  "Brand Collection": { volumes: ["25ml"], defaultVolume: "25ml", sobEncomenda: true, prazoEncomendaDias: 6 },
  "Arabic Collection": { volumes: ["25ml"], defaultVolume: "25ml", sobEncomenda: true, prazoEncomendaDias: 6 },
  "Dream Brand Collection": {
    volumes: ["80ml", "100ml"],
    defaultVolume: "100ml",
    sobEncomenda: true,
    prazoEncomendaDias: 6,
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
  prontaEntrega: boolean;
  notasTopo: string;
  notasCoracao: string;
  notasFundo: string;
  volumesSignature: Volume[];
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
      multi_select?: Array<{ name: string }>;
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

    const allResults: NotionQueryResponse["results"] = [];
    let startCursor: string | undefined = undefined;
    let hasMore = true;
    while (hasMore) {
      const body: Record<string, unknown> = { page_size: 100 };
      if (startCursor) body.start_cursor = startCursor;
      const res = await fetch(`${GATEWAY}/databases/${DATABASE_ID}/query`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "X-Connection-Api-Key": notionKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`Notion query failed [${res.status}]: ${text}`);
      }
      const pageData = (await res.json()) as NotionQueryResponse & { has_more?: boolean; next_cursor?: string | null };
      allResults.push(...pageData.results);
      hasMore = Boolean(pageData.has_more);
      startCursor = pageData.next_cursor ?? undefined;
    }
    const data = { results: allResults } as NotionQueryResponse;


    return data.results.flatMap((page) => {
      const nome =
        page.properties["Product Name"]?.title?.[0]?.plain_text ?? "Sem nome";
      const amount = page.properties["Amount"]?.number ?? null;
      const oosThreshold = page.properties["OoS threshold"]?.number ?? 0;
      const status = page.properties["Available?"]?.formula?.string ?? "";

      const descricao =
        page.properties["Descrição"]?.rich_text?.map((t) => t.plain_text).join("") ?? "";
      const preco = page.properties["Preço"]?.number ?? null;
      const custo = page.properties["Custo"]?.number ?? null;
      
      const volumeRaw = page.properties["Volume"]?.select?.name ?? "50ml";
      const volumePrincipal: Volume = (["25ml", "50ml", "80ml", "100ml"] as const).includes(
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
      const notionSobEncomenda = page.properties["Sob encomenda"]?.checkbox ?? false;
      const notionProntaEntrega = page.properties["Pronta entrega"]?.checkbox ?? false;

      const effectiveAmount = amount ?? 0;
      
      // Prioridade:
      // 1. Se "Pronta entrega" estiver marcado no Notion -> Pronta Entrega
      // 2. Se "Sob encomenda" estiver marcado no Notion -> Sob Encomenda
      // 3. Se nenhum estiver marcado:
      //    Se Amount > OoS -> Pronta Entrega
      //    Senão -> Sob Encomenda
      
      let prontaEntrega = notionProntaEntrega;
      let sobEncomenda = notionSobEncomenda;
      
      // Se AMBOS estiverem marcados, respeitamos ambos (o site mostrará as duas tags).
      // Mas se o usuário quiser que o saldo automático funcione, ele deve desmarcar os checkboxes.
      
      if (!notionProntaEntrega && !notionSobEncomenda) {
        if (effectiveAmount > oosThreshold) {
          prontaEntrega = true;
          sobEncomenda = false;
        } else {
          prontaEntrega = false;
          sobEncomenda = true;
        }
      }
      
      // Caso especial: se o usuário colocou saldo (Amount > OoS) mas o checkbox "Sob encomenda" 
      // ainda está marcado no Notion, o checkbox TEM precedência sobre o cálculo automático.
      // O usuário provavelmente esqueceu de desmarcar o "Sob encomenda" no Notion.
      
      const emEstoque = prontaEntrega;

      const notasTopo =
        page.properties["Notas de topo"]?.rich_text?.map((t) => t.plain_text).join("") ?? "";
      const notasCoracao =
        page.properties["Notas de coração"]?.rich_text?.map((t) => t.plain_text).join("") ?? "";
      const notasFundo =
        page.properties["Notas de fundo"]?.rich_text?.map((t) => t.plain_text).join("") ?? "";
      
      const volumesSignatureRaw = page.properties["Volumes Signature"]?.multi_select ?? [];
      const volumesSignature = volumesSignatureRaw
        .map((v) => v.name as Volume)
        .filter((v) => (["25ml", "50ml", "80ml", "100ml"] as const).includes(v));

      const extractBasePerfume = {
        id: page.id,
        nome,
        emEstoque,
        status,
        imagem: extractImage(page),
        descricao,
        genero,
        marca,
        preco,
        custo,
        amount,
        colecao,
        lowThreshold,
        oosThreshold,
        sobEncomenda,
        prontaEntrega,
        notasTopo,
        notasCoracao,
        notasFundo,
        volumesSignature,
      };

      // Se for Signature e tiver múltiplos volumes, expandimos.
      // Se não, retornamos apenas o volume principal definido.
      if (colecao === "Signature" && volumesSignature.length > 0) {
        return volumesSignature.map((v) => ({
          ...extractBasePerfume,
          id: `${page.id}-${v}`,
          volume: v,
          // Caso existam preços específicos por volume no futuro, poderíamos mapear aqui.
          // Por enquanto, o catálogo calcula preço baseado na coleção na Home, 
          // mas no PerfumeDetail ele usa o p.preco se existir.
        }));
      }

      return [{ ...extractBasePerfume, volume: volumePrincipal }];
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
      prontaEntrega?: boolean;
      notasTopo?: string;
      notasCoracao?: string;
      notasFundo?: string;
      volumesSignature?: Volume[];
    }) => data,
  )
  .handler(async ({ data }) => {
    const { requireAdmin, currentAdmin } = await import("./admin.server");
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
    if (data.prontaEntrega !== undefined) properties["Pronta entrega"] = { checkbox: data.prontaEntrega };
    if (data.notasTopo !== undefined)
      properties["Notas de topo"] = { rich_text: [{ text: { content: data.notasTopo } }] };
    if (data.notasCoracao !== undefined)
      properties["Notas de coração"] = { rich_text: [{ text: { content: data.notasCoracao } }] };
    if (data.notasFundo !== undefined)
      properties["Notas de fundo"] = { rich_text: [{ text: { content: data.notasFundo } }] };
    if (data.volumesSignature !== undefined)
      properties["Volumes Signature"] = { multi_select: data.volumesSignature.map((v) => ({ name: v })) };

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
    try {
      const { appendLog } = await import("./logs.server");
      const me = await currentAdmin();
      const campos = Object.keys(data).filter((k) => k !== "id").join(", ");
      appendLog({ usuario: me?.login, role: me?.role, acao: "atualizar", entidade: "perfume", id: data.id, depois: campos });
    } catch {}
    return { ok: true };
  });

export const excluirPerfume = createServerFn({ method: "POST" })
  .validator((data: { id: string }) => data)
  .handler(async ({ data }) => {
    const { requireAdmin, currentAdmin } = await import("./admin.server");
    await requireAdmin();
    const res = await fetch(`${GATEWAY}/pages/${data.id}`, {
      method: "PATCH",
      headers: notionHeaders(),
      body: JSON.stringify({ archived: true }),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Notion archive failed [${res.status}]: ${text}`);
    }
    try {
      const { appendLog } = await import("./logs.server");
      const me = await currentAdmin();
      appendLog({ usuario: me?.login, role: me?.role, acao: "excluir", entidade: "perfume", id: data.id });
    } catch {}
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
      sobEncomenda?: boolean;
      prontaEntrega?: boolean;
      notasTopo?: string;
      notasCoracao?: string;
      notasFundo?: string;
      volumesSignature?: Volume[];
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
    if (data.sobEncomenda !== undefined) properties["Sob encomenda"] = { checkbox: data.sobEncomenda };
    if (data.prontaEntrega !== undefined) properties["Pronta entrega"] = { checkbox: data.prontaEntrega };
    if (data.notasTopo)
      properties["Notas de topo"] = { rich_text: [{ text: { content: data.notasTopo } }] };
    if (data.notasCoracao)
      properties["Notas de coração"] = { rich_text: [{ text: { content: data.notasCoracao } }] };
    if (data.notasFundo)
      properties["Notas de fundo"] = { rich_text: [{ text: { content: data.notasFundo } }] };
    if (data.volumesSignature)
      properties["Volumes Signature"] = { multi_select: data.volumesSignature.map((v) => ({ name: v })) };

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

// Custos padrão por coleção/volume (definidos pelo dono).
export function custoPadrao(colecao: Colecao, volume: Volume): number | null {
  if (colecao === "Signature") {
    if (volume === "50ml") return 17;
    if (volume === "100ml") return 19;
    return null;
  }
  if (colecao === "Brand Collection") return 45;
  if (colecao === "Arabic Collection") return 60;
  if (colecao === "Dream Brand Collection") return 120;
  return null;
}

export const aplicarCustosPadrao = createServerFn({ method: "POST" })
  .validator((data: { sobrescrever?: boolean }) => data)
  .handler(async ({ data }) => {
    const { requireAdmin } = await import("./admin.server");
    await requireAdmin();
    const perfumes = await getPerfumes();
    let atualizados = 0;
    let pulados = 0;
    for (const p of perfumes) {
      const alvo = custoPadrao(p.colecao, p.volume);
      if (alvo == null) {
        pulados++;
        continue;
      }
      if (!data.sobrescrever && p.custo != null) {
        pulados++;
        continue;
      }
      if (p.custo === alvo) {
        pulados++;
        continue;
      }
      const res = await fetch(`${GATEWAY}/pages/${p.id}`, {
        method: "PATCH",
        headers: notionHeaders(),
        body: JSON.stringify({ properties: { Custo: { number: alvo } } }),
      });
      if (res.ok) atualizados++;
    }
    return { ok: true, atualizados, pulados, total: perfumes.length };
  });

