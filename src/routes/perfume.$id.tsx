import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import perfume1 from "@/assets/perfume-1.jpg";
import perfume2 from "@/assets/perfume-2.jpg";
import perfume3 from "@/assets/perfume-3.jpg";
import logoWhite from "@/assets/dakar-essence-white.png.asset.json";
import { getPerfumes, COLECAO_INFO } from "@/lib/perfumes.functions";
import { formatBRL } from "@/lib/format";
import { useCart } from "@/lib/cart-context";
import { CartButton } from "@/components/cart-drawer";

const perfumesQuery = queryOptions({
  queryKey: ["perfumes"],
  queryFn: () => getPerfumes(),
  staleTime: 0,
});

const fallbacks = [perfume1, perfume2, perfume3];

export const Route = createFileRoute("/perfume/$id")({
  loader: ({ context }) => context.queryClient.ensureQueryData(perfumesQuery),
  component: PerfumeDetail,
  head: () => ({
    meta: [{ title: `Perfume — Dakar Essence` }],
  }),
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center text-muted-foreground">
      {error.message}
    </div>
  ),
  notFoundComponent: () => (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1 className="font-display text-3xl">Perfume não encontrado</h1>
      <Link to="/" className="mt-6 inline-block text-gold underline">Voltar ao catálogo</Link>
    </div>
  ),
});

function PerfumeDetail() {
  const { id } = Route.useParams();
  const { data: perfumes } = useSuspenseQuery(perfumesQuery);
  const { cart, add, remove } = useCart();
  const index = perfumes.findIndex((p) => p.id === id);
  if (index === -1) throw notFound();
  const p = perfumes[index];
  const codigo = `Nº ${String(index + 1).padStart(3, "0")}`;
  const imagem = p.imagem ?? fallbacks[index % fallbacks.length];
  const qtd = cart[p.id] ?? 0;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center" aria-label="Dakar Essence">
            <img src={logoWhite.url} alt="Dakar Essence" className="h-20 w-auto md:h-24" />
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="hidden text-xs uppercase tracking-[0.2em] text-muted-foreground transition hover:text-gold md:inline"
            >
              ← Catálogo
            </Link>
            <CartButton />
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-12 px-6 py-16 md:grid-cols-2 md:py-24">
        <div className="relative">
          <div className="absolute -inset-8 rounded-3xl bg-gradient-to-br from-gold/20 via-transparent to-transparent blur-3xl" />
          <div className="relative overflow-hidden rounded-2xl border border-border/60">
            <img
              src={imagem}
              alt={p.nome}
              className={`h-full w-full object-cover ${!p.emEstoque ? "opacity-50" : ""}`}
            />
            <span className="absolute left-4 top-4 rounded-full bg-background/80 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-gold backdrop-blur">
              {codigo}
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] uppercase tracking-[0.25em] text-gold">
              {p.emEstoque ? "Disponível" : "Esgotado"}
            </span>
            <span className="rounded-full bg-gold/10 px-2 py-0.5 text-[10px] uppercase tracking-wider text-gold">
              {p.volume}
            </span>
            <span className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              {p.colecao}
            </span>
            {COLECAO_INFO[p.colecao].sobEncomenda && (
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-amber-400">
                Sob encomenda
              </span>
            )}
          </div>
          <h1 className="mt-3 font-display text-5xl font-semibold leading-tight md:text-6xl">
            {p.nome}
          </h1>
          {p.preco != null && (
            <p className="mt-4 font-display text-3xl font-semibold text-gold">
              {formatBRL(p.preco)}
            </p>
          )}
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            {p.descricao || "Contratipo exclusivo, com alta concentração e fixação prolongada."}
          </p>
          {COLECAO_INFO[p.colecao].sobEncomenda && (
            <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-300">
              Produto sob encomenda — prazo estimado de 7 a 15 dias após confirmação.
            </p>
          )}

          <div className="mt-10 flex flex-col gap-4">
            {!p.emEstoque ? (
              <button
                disabled
                className="inline-flex cursor-not-allowed items-center justify-center rounded-full bg-foreground/5 px-6 py-3 text-sm font-medium text-muted-foreground"
              >
                Indisponível
              </button>
            ) : qtd === 0 ? (
              <button
                type="button"
                onClick={() => add(p.id)}
                className="inline-flex items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
              >
                Adicionar ao carrinho
              </button>
            ) : (
              <div className="flex items-center justify-between rounded-full bg-gold/10 p-1">
                <button
                  type="button"
                  onClick={() => remove(p.id)}
                  className="h-10 w-10 rounded-full bg-background text-lg font-semibold text-foreground transition hover:bg-gold hover:text-primary-foreground"
                  aria-label="Remover um"
                >
                  −
                </button>
                <span className="text-sm font-semibold text-gold">
                  {qtd} no carrinho
                </span>
                <button
                  type="button"
                  onClick={() => add(p.id)}
                  className="h-10 w-10 rounded-full bg-background text-lg font-semibold text-foreground transition hover:bg-gold hover:text-primary-foreground"
                  aria-label="Adicionar mais um"
                >
                  +
                </button>
              </div>
            )}

            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-medium transition hover:border-gold hover:text-gold"
            >
              Voltar ao catálogo
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
