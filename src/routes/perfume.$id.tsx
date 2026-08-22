import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import perfume1 from "@/assets/perfume-1.jpg";
import perfume2 from "@/assets/perfume-2.jpg";
import perfume3 from "@/assets/perfume-3.jpg";
import logoWhite from "@/assets/dakar-essence-white.png.asset.json";
import { getPerfumes, COLECAO_INFO, formatarNumeroPerfume } from "@/lib/perfumes.functions";
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
  const codigo = formatarNumeroPerfume(p.numero);
  const imagem = p.imagem ?? fallbacks[index % fallbacks.length];
  const qtd = cart[p.id] ?? 0;
  const prazo = COLECAO_INFO[p.colecao].prazoEncomendaDias;
  const outros = perfumes.filter((o) => o.colecao === p.colecao && o.id !== p.id).slice(0, 6);
  const shareUrl = typeof window !== "undefined" ? window.location.href : "";
  const precoTxt = p.preco != null ? ` — ${formatBRL(p.preco)}` : "";
  const shareMsg = `Olha esse perfume: ${p.nome}${precoTxt}\n${shareUrl}`;
  const waShare = `https://wa.me/?text=${encodeURIComponent(shareMsg)}`;
  const notas: Array<[string, string]> = [
    ["Topo", p.notasTopo],
    ["Coração", p.notasCoracao],
    ["Fundo", p.notasFundo],
  ];
  const temNotas = notas.some(([, v]) => v && v.trim());

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Link to="/" className="flex min-w-0 items-center" aria-label="Dakar Essence">
            <img src={logoWhite.url} alt="Dakar Essence" className="h-12 w-auto sm:h-16 md:h-24" />
          </Link>
          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
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

      <section className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-6 sm:py-16 md:grid-cols-2 md:gap-12 md:py-24">
        <div className="relative">
          <div className="absolute -inset-8 rounded-3xl bg-gradient-to-br from-gold/20 via-transparent to-transparent blur-3xl" />
          <div className="relative overflow-hidden rounded-2xl border border-border/60">
            <img
              src={imagem}
              alt={p.nome}
              crossOrigin="anonymous"
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.src.includes("placeholder")) {
                  target.src = "/placeholder.svg";
                }
              }}
              className={`h-full w-full object-cover ${p.disponibilidade !== "Pronta Entrega" ? "opacity-50" : ""}`}
            />
            <span className="absolute left-4 top-4 rounded-full bg-background/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-gold backdrop-blur">
              {codigo}
            </span>
          </div>
        </div>

        <div className="flex flex-col justify-center">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] uppercase tracking-[0.25em] text-gold">
              {p.disponibilidade}
            </span>
            <span className="rounded-full bg-gold/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.1em] text-gold">
              {p.volume}
            </span>
            <span className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
              {p.colecao}
            </span>
            {p.disponibilidade === "Pronta Entrega" && (
              <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[9px] uppercase tracking-wider text-emerald-400 sm:text-[10px]">
                Pronta entrega
              </span>
            )}
            {p.disponibilidade === "Sob Encomenda" && (
              <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] uppercase tracking-wider text-amber-400 sm:text-[10px]">
                Sob encomenda
              </span>
            )}
          </div>
          <h1 className="mt-3 font-display text-3xl font-semibold leading-tight sm:text-5xl md:text-6xl">
            {p.nome}
          </h1>
          {p.marca && (
            <p className="mt-1 text-sm font-medium uppercase tracking-widest text-muted-foreground sm:text-base">
              {p.marca}
            </p>
          )}
          {p.preco != null && (
            <p className="mt-4 font-display text-2xl font-semibold text-gold sm:text-3xl">
              {formatBRL(p.preco)}
            </p>
          )}
          <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
            {p.descricao || "Contratipo exclusivo, com alta concentração e fixação prolongada."}
          </p>
          {p.disponibilidade === "Sob Encomenda" && (
            <p className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3 text-sm text-amber-300">
              Produto sob encomenda — prazo estimado de {prazo} dias após confirmação. Frete grátis com 3+ itens no pedido.
            </p>
          )}

          {temNotas && (
            <div className="mt-6 rounded-xl border border-border/60 bg-card/40 p-4">
              <p className="text-[10px] uppercase tracking-[0.25em] text-gold">Pirâmide olfativa</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {notas.map(([label, v]) =>
                  v && v.trim() ? (
                    <div key={label}>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {label}
                      </p>
                      <p className="mt-1 text-sm">{v}</p>
                    </div>
                  ) : null,
                )}
              </div>
            </div>
          )}


          <div className="mt-10 flex flex-col gap-4">
            {p.disponibilidade === "Indisponível" ? (
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

            <a
              href={waShare}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-6 py-3 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-500/20"
            >
              Compartilhar no WhatsApp
            </a>

            <Link
              to="/"
              className="inline-flex items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-medium transition hover:border-gold hover:text-gold"
            >
              Voltar ao catálogo
            </Link>
          </div>
        </div>
      </section>

      {outros.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6 sm:pb-24">
          <div className="mb-6 flex items-end justify-between sm:mb-8">
            <div>
              <span className="text-[11px] uppercase tracking-[0.25em] text-gold">
                {p.colecao}
              </span>
              <h2 className="mt-2 font-display text-xl font-semibold sm:text-2xl md:text-3xl">
                Outros da mesma coleção
              </h2>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3">
            {outros.map((o) => {
              const oi = perfumes.indexOf(o);
              const oImg = o.imagem ?? fallbacks[oi % fallbacks.length];
              return (
                <Link
                  key={o.id}
                  to="/perfume/$id"
                  params={{ id: o.id }}
                  className="group overflow-hidden rounded-2xl border border-border/60 bg-card transition hover:border-gold/50"
                >
                  <div className="aspect-[4/5] overflow-hidden bg-background">
                    <img
                      src={oImg}
                      alt={o.nome}
                      loading="lazy"
                      className={`h-full w-full object-cover transition duration-700 group-hover:scale-105 ${!o.emEstoque ? "opacity-40" : ""}`}
                    />
                  </div>
                  <div className="p-4">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-gold">
                      {o.volume}
                    </p>
                    <p className="mt-1 truncate font-display text-sm font-semibold">
                      {o.nome}
                    </p>
                    {o.preco != null && (
                      <p className="mt-1 text-xs font-semibold text-gold">
                        {formatBRL(o.preco)}
                      </p>
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
