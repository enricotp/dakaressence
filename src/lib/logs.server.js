// Server-only: appends a row to the "Logs" Google Sheet. Never throws to the caller.
const LOGS_SHEET_ID = "1j1FXoolbiDk3WYRY1038cfVXUJ4GBboPnh9nlBmc7EU";
const LOGS_SHEET_NAME = "Logs";
const GATEWAY = "https://connector-gateway.lovable.dev/google_sheets/v4";
export async function appendLog(entry) {
    const lovableKey = process.env.LOVABLE_API_KEY;
    const sheetsKey = process.env.GOOGLE_SHEETS_API_KEY;
    if (!lovableKey || !sheetsKey)
        return;
    try {
        const dataFmt = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
        const row = [
            dataFmt,
            entry.usuario ?? "—",
            entry.role ?? "—",
            entry.acao,
            entry.entidade,
            entry.id ?? "",
            entry.antes ?? "",
            entry.depois ?? "",
        ];
        const url = `${GATEWAY}/spreadsheets/${LOGS_SHEET_ID}/values/${LOGS_SHEET_NAME}!A:H:append?valueInputOption=USER_ENTERED`;
        const res = await fetch(url, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${lovableKey}`,
                "X-Connection-Api-Key": sheetsKey,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ values: [row] }),
        });
        if (!res.ok) {
            console.error(`Sheets log append failed [${res.status}]: ${await res.text()}`);
        }
    }
    catch (err) {
        console.error("appendLog exception:", err);
    }
}
