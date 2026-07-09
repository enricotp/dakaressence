import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useCart } from "@/lib/cart-context";
import { getPerfumes, type Perfume } from "@/lib/perfumes.functions";
import { criarPedido } from "@/lib/orders.functions";
import { formatBRL } from "@/lib/format";
import perfume1 from "@/assets/perfume-1.jpg";
import perfume2 from "@/assets/perfume-2.jpg";
import perfume3 from "@/assets/perfume-3.jpg";

const WHATSAPP_NUMBER = "5515997261852";
const fallbacks = [perfume1, perfume2, perfume3];
const codigoDoPerfume = (index: number) => `Nº ${String(index + 1).padStart(3, "0")}`;
const waLink = (msg: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;

type Pagamento = "Pix" | "Cartão";

export function CartButton() {
  const { open, cartCount } = useCart();
  return (
    <button
      type="button"
      onClick={open}
      className="relative inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-xs font-medium uppercase tracking-wider text-gold transition hover:bg-gold hover:text-primary-foreground"
    >
      Carrinho
      {cartCount > 0 && (
        <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-gold px-1.5 text-[11px] font-semibold text-primary-foreground">
          {cartCount}
        </span>
      )}
    </button>
  );
}

export function CartDrawer() {
  const { cart, cartCount, add, remove, clear, isOpen, close } = useCart();
  const { data: perfumes = [] } = useQuery({
    queryKey: ["perfumes"],
    queryFn: () => getPerfumes(),
    staleTime: 0,
  });
  const criar = useServerFn(criarPedido);

  const [etapa, setEtapa] = useState<"carrinho" | "checkout">("carrinho");
  const [nome, setNome] = useState("");
  const [pagamento, setPagamento] = useState<Pagamento>("Pix");
  const [parcelas, setParcelas] = useState(1);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const perfumeById = useMemo(() => {
    const m = new Map<string, { p: Perfume; codigo: string }>();
    perfumes.forEach((p, i) => m.set(p.id, { p, codigo: codigoDoPerfume(i) }));
    return m;
  }, [perfumes]);

  const total = useMemo(() => {
    return Object.entries(cart).reduce((acc, [id, qtd]) => {
      const item = perfumeById.get(id);
      if (!item || item.p.preco == null) return acc;
      return acc + item.p.preco * qtd;
    }, 0);
  }, [cart, perfumeById]);

  const itensDetalhados = useMemo(() => {
    return Object.entries(cart)
      .map(([id, qtd]) => {
        const item = perfumeById.get(id);
        if (!item || item.p.preco == null) return null;
        return { nome: item.p.nome, qtd, precoUnit: item.p.preco };
      })
      .filter((x): x is { nome: string; qtd: number; precoUnit: number } => x !== null);
  }, [cart, perfumeById]);

  const linhasItens = useMemo(() => {
    return Object.entries(cart)
      .map(([id, qtd]) => {
        const item = perfumeById.get(id);
        if (!item) return null;
        return `• ${qtd}x ${item.p.nome} (${item.codigo})`;
      })
      .filter(Boolean) as string[];
  }, [cart, perfumeById]);

  function montarMensagem(pedidoId: string) {
    const linhaPagamento =
      pagamento === "Pix"
        ? "Pagamento: Pix à vista"
        : `Pagamento: Cartão em ${parcelas}x de ${formatBRL(total / parcelas)}`;
    const nomeLinha = nome ? `Nome: ${nome}\n` : "";
    return `Olá! Gostaria de fechar o pedido ${pedidoId}:\n\n${linhasItens.join(
      "\n",
    )}\n\nTotal: ${formatBRL(total)}\n${linhaPagamento}\n${nomeLinha}\nPodemos confirmar?`;
  }

  async function confirmar() {
    setErro(null);
    setEnviando(true);
    try {
      const { id } = await criar({
        data: {
          cliente: nome,
          itens: linhasItens.join("\n"),
          itensDetalhados,
          total,
          pagamento,
          parcelas: pagamento === "Cartão" ? parcelas : 1,
        },
      });
      const msg = montarMensagem(id);
      window.open(waLink(msg), "_blank");
      clear();
      setEtapa("carrinho");
      setNome("");
      setPagamento("Pix");
      setParcelas(1);
      close();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao registrar pedido");
    } finally {
      setEnviando(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <button
        type="button"
        aria-label="Fechar carrinho"
        onClick={close}
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
      />
      <aside className="relative flex h-full w-full max-w-md flex-col border-l border-border/60 bg-card">
        <div className="flex items-center justify-between border-b border-border/60 px-6 py-5">
          <h3 className="font-display text-xl font-semibold">
            {etapa === "carrinho" ? "Seu carrinho" : "Finalizar pedido"}
          </h3>
          <button
            type="button"
            onClick={close}
            className="text-2xl text-muted-foreground transition hover:text-foreground"
            aria-label="Fechar"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {cartCount === 0 ? (
            <p className="mt-16 text-center text-sm text-muted-foreground">
              Seu carrinho está vazio.
            </p>
          ) : etapa === "carrinho" ? (
            <ul className="space-y-4">
              {Object.entries(cart).map(([id, qtd]) => {
                const item = perfumeById.get(id);
                if (!item) return null;
                const img = item.p.imagem ?? fallbacks[0];
                return (
                  <li key={id} className="flex gap-4 rounded-xl border border-border/60 p-3">
                    <img
                      src={img}
                      alt={item.p.nome}
                      className="h-16 w-16 rounded-lg object-cover"
                    />
                    <div className="flex flex-1 flex-col">
                      <span className="text-[10px] uppercase tracking-[0.2em] text-gold">
                        {item.codigo}
                      </span>
                      <span className="font-medium">{item.p.nome}</span>
                      {item.p.preco != null && (
                        <span className="text-xs text-muted-foreground">
                          {formatBRL(item.p.preco)} cada
                        </span>
                      )}
                      <div className="mt-auto flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => remove(id)}
                            className="h-7 w-7 rounded-full bg-background text-sm font-semibold transition hover:bg-gold hover:text-primary-foreground"
                          >
                            −
                          </button>
                          <span className="min-w-6 text-center text-sm">{qtd}</span>
                          <button
                            type="button"
                            onClick={() => add(id)}
                            className="h-7 w-7 rounded-full bg-background text-sm font-semibold transition hover:bg-gold hover:text-primary-foreground"
                          >
                            +
                          </button>
                        </div>
                        {item.p.preco != null && (
                          <span className="text-sm font-semibold text-gold">
                            {formatBRL(item.p.preco * qtd)}
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="space-y-5">
              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Seu nome
                </label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Como podemos te chamar?"
                  className="mt-2 w-full rounded-lg border border-border/60 bg-background px-4 py-3 text-sm focus:border-gold focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs uppercase tracking-wider text-muted-foreground">
                  Forma de pagamento
                </label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {(["Pix", "Cartão"] as const).map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setPagamento(opt)}
                      className={`rounded-lg border px-4 py-3 text-sm transition ${
                        pagamento === opt
                          ? "border-gold bg-gold/10 text-gold"
                          : "border-border/60 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {opt === "Pix" ? "Pix à vista" : "Cartão parcelado"}
                    </button>
                  ))}
                </div>
              </div>

              {pagamento === "Cartão" && (
                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground">
                    Parcelas
                  </label>
                  <select
                    value={parcelas}
                    onChange={(e) => setParcelas(Number(e.target.value))}
                    className="mt-2 w-full rounded-lg border border-border/60 bg-background px-4 py-3 text-sm focus:border-gold focus:outline-none"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                      <option key={n} value={n}>
                        {n}x de {formatBRL(total / n)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="rounded-lg border border-border/60 bg-background/60 p-4">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Resumo
                </p>
                <pre className="mt-2 whitespace-pre-wrap font-sans text-sm">
                  {linhasItens.join("\n")}
                </pre>
                <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3">
                  <span className="text-sm">Total</span>
                  <span className="font-display text-xl font-semibold text-gold">
                    {formatBRL(total)}
                  </span>
                </div>
                {pagamento === "Cartão" && (
                  <p className="mt-1 text-right text-xs text-muted-foreground">
                    {parcelas}x de {formatBRL(total / parcelas)}
                  </p>
                )}
              </div>

              {erro && <p className="text-xs text-destructive">{erro}</p>}
            </div>
          )}
        </div>

        <div className="border-t border-border/60 px-6 py-5 space-y-3">
          {cartCount > 0 && total > 0 && etapa === "carrinho" && (
            <div className="flex items-center justify-between text-sm">
              <span className="uppercase tracking-[0.2em] text-muted-foreground">Total</span>
              <span className="font-display text-xl font-semibold text-gold">
                {formatBRL(total)}
              </span>
            </div>
          )}

          {etapa === "carrinho" ? (
            <>
              <button
                type="button"
                onClick={() => setEtapa("checkout")}
                disabled={cartCount === 0}
                className={`inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition ${
                  cartCount === 0
                    ? "pointer-events-none bg-foreground/5 text-muted-foreground"
                    : "bg-gold text-primary-foreground hover:brightness-110"
                }`}
              >
                Continuar
              </button>
              {cartCount > 0 && (
                <button
                  type="button"
                  onClick={clear}
                  className="w-full text-center text-xs uppercase tracking-[0.2em] text-muted-foreground transition hover:text-foreground"
                >
                  Esvaziar carrinho
                </button>
              )}
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={confirmar}
                disabled={enviando || !nome.trim() || cartCount === 0}
                className="inline-flex w-full items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
              >
                {enviando ? "Registrando…" : "Confirmar e abrir WhatsApp"}
              </button>
              <button
                type="button"
                onClick={() => setEtapa("carrinho")}
                className="w-full text-center text-xs uppercase tracking-[0.2em] text-muted-foreground transition hover:text-foreground"
              >
                ← Voltar
              </button>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}
