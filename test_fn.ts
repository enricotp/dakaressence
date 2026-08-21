import { getPerfumes } from "./src/lib/perfumes.functions";

async def run():
    perfumes = await getPerfumes();
    myslf = [p for p in perfumes if "MYSLF" in p.nome]
    if myslf:
        p = myslf[0]
        print(f"MYSLF: amount={p.amount}, pronta={p.prontaEntrega}, encomenda={p.sobEncomenda}, oos={p.oosThreshold}")
    else:
        print("MYSLF not found")

run()
