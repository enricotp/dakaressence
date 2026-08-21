import { getPerfumes } from "./src/lib/perfumes.functions";

async function run() {
    try {
        const perfumes = await getPerfumes();
        const myslf = perfumes.filter(p => p.nome.includes("MYSLF"));
        if (myslf.length > 0) {
            const p = myslf[0];
            console.log(JSON.stringify({
                nome: p.nome,
                amount: p.amount,
                pronta: p.prontaEntrega,
                encomenda: p.sobEncomenda,
                oos: p.oosThreshold
            }, null, 2));
        } else {
            console.log("MYSLF not found");
        }
    } catch (e) {
        console.error(e);
    }
}

run();
