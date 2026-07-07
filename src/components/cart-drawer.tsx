import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/lib/cart-context";
import { getPerfumes, type Perfume } from "@/lib/perfumes.functions";
import { formatBRL } from "@/lib/format";
import perfume1 from "@/assets/perfume-1.jpg";
import perfume2 from "@/assets/perfume-2.jpg";
import perfume3 from "@/assets/perfume-3.jpg";

const WHATSAPP_NUMBER = "5515997261852";
const fallbacks = [perfume1, perfume2, perfume3];
const codigoDoPerfume = (index: number) => `Nº ${String(index + 1).padStart(3, "0")}`;
const waLink = (msg: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;

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

  const mensagemPedido = useMemo(() => {
    const linhas = Object.entries(cart)
      .map(([id, qtd]) => {
        const item = perfumeById.get(id);
        if (!item) return null;
        return `• ${qtd}x ${item.p.nome} (${item.codigo})`;
      })
      .filter(Boolean);
    if (linhas.length === 0) return "Olá! Gostaria de fazer um pedido.";
    return `Olá! Gostaria de pedir:\n\n${linhas.join("\n")}\n\nPodemos fechar?`;
  }, [cart, perfumeById]);

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
          <h3 className="font-display text-xl font-semibold">Seu carrinho</h3>
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
          ) : (
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
          )}
        </div>

        <div className="border-t border-border/60 px-6 py-5 space-y-3">
          {cartCount > 0 && total > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="uppercase tracking-[0.2em] text-muted-foreground">Total</span>
              <span className="font-display text-xl font-semibold text-gold">
                {formatBRL(total)}
              </span>
            </div>
          )}
          <a
            href={waLink(mensagemPedido)}
            target="_blank"
            rel="noreferrer"
            aria-disabled={cartCount === 0}
            className={`inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition ${
              cartCount === 0
                ? "pointer-events-none bg-foreground/5 text-muted-foreground"
                : "bg-gold text-primary-foreground hover:brightness-110"
            }`}
          >
            Pedir no WhatsApp
          </a>
          {cartCount > 0 && (
            <button
              type="button"
              onClick={clear}
              className="w-full text-center text-xs uppercase tracking-[0.2em] text-muted-foreground transition hover:text-foreground"
            >
              Esvaziar carrinho
            </button>
          )}
        </div>
      </aside>
    </div>
  );
}
