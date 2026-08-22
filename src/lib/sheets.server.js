// Server-only helpers para Google Sheets via connector gateway.
// Sempre localiza colunas pelo NOME do cabeçalho, nunca por letra fixa.
const GATEWAY = "https://connector-gateway.lovable.dev/google_sheets/v4";
export function sheetsHeaders() {
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
export function colLetter(index) {
    let n = index;
    let s = "";
    while (n >= 0) {
        s = String.fromCharCode(65 + (n % 26)) + s;
        n = Math.floor(n / 26) - 1;
    }
    return s;
}
export async function readRange(sheetId, range) {
    const res = await fetch(`${GATEWAY}/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`, {
        headers: sheetsHeaders(),
    });
    if (!res.ok) {
        const text = await res.text();
        // Aba inexistente devolve 400 — tratamos como vazio para o caller decidir.
        if (res.status === 400 || res.status === 404)
            return [];
        throw new Error(`Sheets read failed [${res.status}]: ${text}`);
    }
    const json = (await res.json());
    return json.values ?? [];
}
export async function writeRange(sheetId, range, values) {
    const res = await fetch(`${GATEWAY}/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`, { method: "PUT", headers: sheetsHeaders(), body: JSON.stringify({ values }) });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Sheets write failed [${res.status}]: ${text}`);
    }
}
export async function appendRow(sheetId, sheetName, values) {
    const res = await fetch(`${GATEWAY}/spreadsheets/${sheetId}/values/${encodeURIComponent(`${sheetName}!A:ZZ`)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`, { method: "POST", headers: sheetsHeaders(), body: JSON.stringify({ values: [values] }) });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Sheets append failed [${res.status}]: ${text}`);
    }
}
export async function getHeaderRow(sheetId, sheetName) {
    const rows = await readRange(sheetId, `${sheetName}!1:1`);
    return rows[0] ?? [];
}
/** Garante que a aba existe (cria se necessário). */
export async function ensureSheetTab(sheetId, sheetName) {
    const metaRes = await fetch(`${GATEWAY}/spreadsheets/${sheetId}`, { headers: sheetsHeaders() });
    if (!metaRes.ok)
        return;
    const meta = (await metaRes.json());
    const exists = (meta.sheets ?? []).some((s) => s.properties?.title === sheetName);
    if (exists)
        return;
    const res = await fetch(`${GATEWAY}/spreadsheets/${sheetId}:batchUpdate`, {
        method: "POST",
        headers: sheetsHeaders(),
        body: JSON.stringify({ requests: [{ addSheet: { properties: { title: sheetName } } }] }),
    });
    if (!res.ok) {
        console.error(`Falha ao criar aba ${sheetName}: ${await res.text()}`);
    }
}
/**
 * Garante que todas as colunas existam, acrescentando as faltantes DEPOIS da
 * última coluna ocupada. Nunca sobrescreve dados existentes.
 * Retorna o mapa nome -> índice (0-based).
 */
export async function ensureColumns(sheetId, sheetName, names) {
    const headers = await getHeaderRow(sheetId, sheetName);
    const lower = headers.map((h) => (h ?? "").trim().toLowerCase());
    const map = {};
    const toAdd = [];
    for (const name of names) {
        const idx = lower.indexOf(name.trim().toLowerCase());
        if (idx !== -1)
            map[name] = idx;
        else
            toAdd.push(name);
    }
    if (toAdd.length > 0) {
        const start = headers.length;
        const range = `${sheetName}!${colLetter(start)}1:${colLetter(start + toAdd.length - 1)}1`;
        await writeRange(sheetId, range, [toAdd]);
        toAdd.forEach((name, i) => {
            map[name] = start + i;
        });
    }
    return map;
}
export function indexer(headers) {
    const lower = headers.map((h) => (h ?? "").trim().toLowerCase());
    return (name) => lower.indexOf(name.trim().toLowerCase());
}
