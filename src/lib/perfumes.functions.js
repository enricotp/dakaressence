import { notionFetchWithRetry } from "./notion-fetch";
import { createServerFn } from "@tanstack/react-start";
const DATABASE_ID = "38858811-29ca-83c5-b57d-0102c05505b1";
const GATEWAY = "https://connector-gateway.lovable.dev/notion/v1";
export const COLECOES = [
    "Signature",
    "Brand Collection",
    "Arabic Collection",
    "Dream Brand Collection",
];
export const COLECAO_INFO = {
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
export function formatarNumeroPerfume(n) {
    if (n == null)
        return "Nº —";
    return `Nº ${String(n).padStart(3, "0")}`;
}
const GENERO_MAP = {
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
function inferirGenero(nome) {
    const key = nome.trim().toLowerCase();
    if (GENERO_MAP[key])
        return GENERO_MAP[key];
    for (const [k, v] of Object.entries(GENERO_MAP)) {
        if (key.includes(k))
            return v;
    }
    return "masculino";
}
function extractImage(page) {
    if (page.cover) {
        if (page.cover.type === "external")
            return page.cover.external.url;
        if (page.cover.type === "file")
            return page.cover.file.url;
    }
    for (const [name, prop] of Object.entries(page.properties)) {
        if (prop.type === "url" && prop.url && /imag/i.test(name))
            return prop.url;
    }
    for (const [name, prop] of Object.entries(page.properties)) {
        if (prop.type === "rich_text" && prop.rich_text && prop.rich_text.length > 0) {
            const text = prop.rich_text[0].plain_text;
            if (text.startsWith("http") && (text.includes(".jpg") || text.includes(".png") || text.includes(".webp") || text.includes(".jpeg"))) {
                return text;
            }
        }
    }
    for (const prop of Object.values(page.properties)) {
        if (prop.type === "files" && prop.files && prop.files.length > 0) {
            const f = prop.files[0];
            if (f.type === "external")
                return f.external.url;
            if (f.type === "file")
                return f.file.url;
        }
    }
    return null;
}
export const getPerfumes = createServerFn({ method: "GET" }).handler(async () => {
    const lovableKey = process.env.LOVABLE_API_KEY;
    const notionKey = process.env.NOTION_API_KEY;
    if (!lovableKey || !notionKey) {
        throw new Error("Notion connector não configurado");
    }
    const allResults = [];
    let startCursor = undefined;
    let hasMore = true;
    while (hasMore) {
        const body = { page_size: 100 };
        if (startCursor)
            body.start_cursor = startCursor;
        const res = await notionFetchWithRetry(`${GATEWAY}/databases/${DATABASE_ID}/query`, {
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
        const pageData = (await res.json());
        allResults.push(...pageData.results);
        hasMore = Boolean(pageData.has_more);
        startCursor = pageData.next_cursor ?? undefined;
    }
    const data = { results: allResults };
    return data.results.flatMap((page) => {
        const imagem = extractImage(page);
        const nome = (page.properties["Product Name"]?.title?.[0]?.plain_text ?? "Sem nome").trim();
        const numero = page.properties["Número"]?.number ?? null;
        const amount = page.properties["Amount"]?.number ?? null;
        const oosThreshold = page.properties["OoS threshold"]?.number ?? 0;
        const status = (page.properties["Available?"]?.formula?.string ?? "").trim();
        const disponibilidade = (page.properties["Disponibilidade"]?.formula?.string ?? "").trim();
        const descricao = page.properties["Descrição"]?.rich_text?.map((t) => t.plain_text).join("") ?? "";
        const preco = page.properties["Preço"]?.number ?? null;
        const custo = page.properties["Custo"]?.number ?? null;
        const volumeRaw = page.properties["Volume"]?.select?.name ?? "50ml";
        const volumePrincipal = ["25ml", "50ml", "80ml", "100ml"].includes(volumeRaw)
            ? volumeRaw
            : "50ml";
        const marca = page.properties["Marca"]?.select?.name ?? null;
        const generoRaw = (page.properties["Gênero"]?.select?.name ?? "").trim().toLowerCase();
        const genero = generoRaw === "feminino" || generoRaw === "masculino" || generoRaw === "unissex"
            ? generoRaw
            : inferirGenero(nome);
        const colecaoRaw = page.properties["Coleção"]?.select?.name ?? "";
        const colecao = COLECOES.includes(colecaoRaw)
            ? colecaoRaw
            : "Signature";
        const lowThreshold = page.properties["Low threshold "]?.number ?? null;
        const threshold = oosThreshold ?? 0;
        const prontaEntrega = disponibilidade === "Pronta Entrega" || (amount !== null && amount > threshold);
        const emEstoque = prontaEntrega;
        const notasTopo = page.properties["Notas de topo"]?.rich_text?.map((t) => t.plain_text).join("") ?? "";
        const notasCoracao = page.properties["Notas de coração"]?.rich_text?.map((t) => t.plain_text).join("") ?? "";
        const notasFundo = page.properties["Notas de fundo"]?.rich_text?.map((t) => t.plain_text).join("") ?? "";
        // Volumes Signature foi removido do Notion schema (causava erro 400 no update)
        // Mantemos o tipo no frontend para compatibilidade, mas ignoramos no fetch se não existir.
        const volumesSignatureRaw = page.properties["Volumes Signature"]?.multi_select ?? [];
        const volumesSignature = volumesSignatureRaw
            .map((v) => v.name)
            .filter((v) => ["25ml", "50ml", "80ml", "100ml"].includes(v));
        const extractBasePerfume = {
            id: page.id,
            nome,
            numero,
            emEstoque,
            status,
            imagem,
            descricao,
            genero,
            marca,
            preco,
            custo,
            amount,
            colecao,
            lowThreshold,
            oosThreshold,
            disponibilidade,
            notasTopo,
            notasCoracao,
            notasFundo,
            volumesSignature: volumesSignature.length > 0 ? volumesSignature : null,
        };
        if (colecao === "Signature" && volumesSignature.length > 0) {
            return volumesSignature.map((v) => ({
                ...extractBasePerfume,
                id: `${page.id}-${v}`,
                volume: v,
            }));
        }
        return [{ ...extractBasePerfume, volume: volumePrincipal }];
    });
});
function notionHeaders() {
    const lovableKey = process.env.LOVABLE_API_KEY;
    const notionKey = process.env.NOTION_API_KEY;
    if (!lovableKey || !notionKey)
        throw new Error("Notion connector não configurado");
    return {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": notionKey,
        "Content-Type": "application/json",
    };
}
export const atualizarPerfume = createServerFn({ method: "POST" })
    .validator((data) => data)
    .handler(async ({ data }) => {
    const { requireAdmin, currentAdmin } = await import("./admin.server");
    await requireAdmin();
    const properties = {};
    const perfumeId = data.id;
    if (data.numero !== undefined)
        properties["Número"] = { number: data.numero };
    if (data.amount !== undefined)
        properties["Amount"] = { number: data.amount };
    if (data.nome !== undefined)
        properties["Product Name"] = { title: [{ text: { content: data.nome } }] };
    if (data.descricao !== undefined)
        properties["Descrição"] = { rich_text: [{ text: { content: data.descricao } }] };
    if (data.preco !== undefined)
        properties["Preço"] = { number: data.preco };
    if (data.custo !== undefined)
        properties["Custo"] = { number: data.custo };
    if (data.volume !== undefined)
        properties["Volume"] = { select: { name: data.volume } };
    if (data.marca !== undefined)
        properties["Marca"] = data.marca ? { select: { name: data.marca } } : { select: null };
    if (data.colecao !== undefined)
        properties["Coleção"] = { select: { name: data.colecao } };
    if (data.genero !== undefined)
        properties["Gênero"] = { select: { name: generoNotionName(data.genero) } };
    // "Low threshold " tem espaço final no Notion
    if (data.lowThreshold !== undefined)
        properties["Low threshold "] = { number: data.lowThreshold };
    if (data.oosThreshold !== undefined)
        properties["OoS threshold"] = { number: data.oosThreshold };
    if (data.notasTopo !== undefined)
        properties["Notas de topo"] = { rich_text: [{ text: { content: data.notasTopo } }] };
    if (data.notasCoracao !== undefined)
        properties["Notas de coração"] = { rich_text: [{ text: { content: data.notasCoracao } }] };
    if (data.notasFundo !== undefined)
        properties["Notas de fundo"] = { rich_text: [{ text: { content: data.notasFundo } }] };
    // REMOVIDO: Volumes Signature (Property does not exist error 400)
    const body = { properties };
    if (data.imagemUrl !== undefined && data.imagemUrl) {
        body.cover = { type: "external", external: { url: data.imagemUrl } };
    }
    const res = await fetch(`${GATEWAY}/pages/${perfumeId}`, {
        method: "PATCH",
        headers: notionHeaders(),
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const responseText = await res.text();
        let errorData;
        try {
            errorData = JSON.parse(responseText);
        }
        catch {
            errorData = responseText;
        }
        console.error("Notion update failed", {
            status: res.status,
            perfumeId,
            nome: data.nome,
            error: errorData,
        });
        throw new Error(`Notion update failed [${res.status}]: ${JSON.stringify(errorData)}`);
    }
    try {
        const { appendLog } = await import("./logs.server");
        const me = await currentAdmin();
        const campos = Object.keys(data).filter((k) => k !== "id").join(", ");
        appendLog({ usuario: me?.login, role: me?.role, acao: "atualizar", entidade: "perfume", id: perfumeId, depois: campos });
    }
    catch { }
    return { ok: true };
});
export const excluirPerfume = createServerFn({ method: "POST" })
    .validator((data) => data)
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
    }
    catch { }
    return { ok: true };
});
function generoNotionName(g) {
    if (g === "feminino")
        return "Feminino";
    if (g === "masculino")
        return "Masculino";
    return "Unissex";
}
export async function ajustarEstoqueInterno(id, delta) {
    const getRes = await fetch(`${GATEWAY}/pages/${id}`, { headers: notionHeaders() });
    if (!getRes.ok)
        return { ok: false };
    const page = (await getRes.json());
    const current = page.properties["Amount"]?.number ?? 0;
    const next = Math.max(0, current + delta);
    const res = await fetch(`${GATEWAY}/pages/${id}`, {
        method: "PATCH",
        headers: notionHeaders(),
        body: JSON.stringify({
            properties: {
                Amount: { number: next }
            }
        }),
    });
    return { ok: res.ok, novoEstoque: next };
}
export async function baixarEstoqueInterno(id, qtd) {
    return ajustarEstoqueInterno(id, -qtd);
}
export const criarPerfume = createServerFn({ method: "POST" })
    .validator((data) => data)
    .handler(async ({ data }) => {
    const { requireAdmin } = await import("./admin.server");
    await requireAdmin();
    const properties = {
        "Product Name": { title: [{ text: { content: data.nome } }] },
        Volume: { select: { name: data.volume } },
    };
    if (data.numero != null)
        properties["Número"] = { number: data.numero };
    if (data.amount != null)
        properties["Amount"] = { number: data.amount };
    if (data.descricao)
        properties["Descrição"] = { rich_text: [{ text: { content: data.descricao } }] };
    if (data.preco != null)
        properties["Preço"] = { number: data.preco };
    if (data.custo != null)
        properties["Custo"] = { number: data.custo };
    if (data.marca)
        properties["Marca"] = { select: { name: data.marca } };
    if (data.colecao)
        properties["Coleção"] = { select: { name: data.colecao } };
    if (data.genero)
        properties["Gênero"] = { select: { name: generoNotionName(data.genero) } };
    if (data.lowThreshold != null)
        properties["Low threshold "] = { number: data.lowThreshold };
    if (data.oosThreshold != null)
        properties["OoS threshold"] = { number: data.oosThreshold };
    if (data.notasTopo)
        properties["Notas de topo"] = { rich_text: [{ text: { content: data.notasTopo } }] };
    if (data.notasCoracao)
        properties["Notas de coração"] = { rich_text: [{ text: { content: data.notasCoracao } }] };
    if (data.notasFundo)
        properties["Notas de fundo"] = { rich_text: [{ text: { content: data.notasFundo } }] };
    // REMOVIDO: Volumes Signature
    const body = {
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
        const responseText = await res.text();
        let errorData;
        try {
            errorData = JSON.parse(responseText);
        }
        catch {
            errorData = responseText;
        }
        console.error("Notion creation failed", {
            status: res.status,
            nome: data.nome,
            error: errorData,
        });
        throw new Error(`Notion creation failed [${res.status}]: ${JSON.stringify(errorData)}`);
    }
    return { ok: true };
});
export const aplicarCustosPadrao = createServerFn({ method: "POST" })
    .validator((data) => data)
    .handler(async ({ data }) => {
    const { requireAdmin } = await import("./admin.server");
    await requireAdmin();
    const perfumes = await getPerfumes();
    const CUSTOS = {
        "Brand Collection": 17,
        "Arabic Collection": 17,
        "Dream Brand Collection": 27,
        Signature: 27,
    };
    let atualizados = 0;
    let pulados = 0;
    const details = [];
    for (const p of perfumes) {
        const deveAtualizar = data.sobrescrever || p.custo === null || p.custo === 0;
        if (deveAtualizar) {
            const custo = CUSTOS[p.colecao];
            try {
                await atualizarPerfume({ data: { id: p.id.split('-')[0], custo } });
                atualizados++;
                details.push({ id: p.id, nome: p.nome, custo });
            }
            catch (e) {
                console.error(`Falha ao aplicar custo padrao para ${p.nome}:`, e);
            }
        }
        else {
            pulados++;
        }
    }
    return { updated: atualizados, atualizados, pulados, details };
});
