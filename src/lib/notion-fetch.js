export async function notionFetchWithRetry(url, init, attempts = 3) {
    let lastError;
    for (let i = 0; i < attempts; i++) {
        try {
            const res = await fetch(url, {
                ...init,
                signal: AbortSignal.timeout(20000),
            });
            if (res.status >= 500 && i < attempts - 1) {
                await new Promise((r) => setTimeout(r, 500 * (i + 1)));
                continue;
            }
            return res;
        }
        catch (err) {
            // "TypeError: terminated" / abort / socket reset -> tenta de novo
            lastError = err;
            await new Promise((r) => setTimeout(r, 500 * (i + 1)));
        }
    }
    throw lastError instanceof Error
        ? lastError
        : new Error("Falha ao conectar ao Notion");
}
