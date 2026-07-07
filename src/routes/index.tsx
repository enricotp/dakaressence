import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import heroImg from "@/assets/hero-perfume.jpg";
import perfume1 from "@/assets/perfume-1.jpg";
import perfume2 from "@/assets/perfume-2.jpg";
import perfume3 from "@/assets/perfume-3.jpg";
import logoWhite from "@/assets/dakar-essence-white.png.asset.json";
import { getPerfumes } from "@/lib/perfumes.functions";
import { useCart } from "@/lib/cart-context";
import { CartButton } from "@/components/cart-drawer";

const perfumesQuery = queryOptions({
  queryKey: ["perfumes"],
  queryFn: () => getPerfumes(),
  staleTime: 0,
});

export const Route = createFileRoute("/")({
  component: Index,
  loader: ({ context }) => context.queryClient.ensureQueryData(perfumesQuery),
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1 className="font-display text-3xl font-semibold">Não foi possível carregar o catálogo</h1>
      <p className="mt-4 text-muted-foreground">{error.message}</p>
    </div>
  ),
  notFoundComponent: () => <div className="p-8">Página não encontrada</div>,
});

const imagensRotativas = [perfume1, perfume2, perfume3];
const codigoDoPerfume = (index: number) => `Nº ${String(index + 1).padStart(3, "0")}`;

function Index() {
  const { data: perfumes } = useSuspenseQuery(perfumesQuery);
  const { cart, cartCount, add, remove, open } = useCart();
  const [filtro, setFiltro] = useState<"todos" | "feminino" | "masculino">("todos");
  const perfumesFiltrados = filtro === "todos" ? perfumes : perfumes.filter((p) => p.genero === filtro);


  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <a href="#top" className="flex items-center" aria-label="Dakar Essence">
            <img src={logoWhite.url} alt="Dakar Essence" className="h-20 w-auto md:h-24" />
          </a>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#catalogo" className="transition hover:text-foreground">Catálogo</a>
            <a href="#sobre" className="transition hover:text-foreground">Sobre</a>
            <a href="#faq" className="transition hover:text-foreground">FAQ</a>
          </nav>
          <CartButton />

        </div>
      </header>

      {/* Hero */}
      <section id="top" className="relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 py-20 md:grid-cols-2 md:py-28 md:pb-32">
          <div className="flex flex-col justify-center">
            <span className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-gold">
              <span className="h-1 w-1 rounded-full bg-gold" /> Coleção 2026
            </span>
            <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight md:text-7xl">
              A mesma essência,{" "}
              <span className="bg-gradient-to-r from-gold to-gold-soft bg-clip-text text-transparent">
                metade do preço.
              </span>
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-muted-foreground">
              Perfumes contratipos com alta concentração e fixação premium.
              Monte seu pedido e finalize direto no WhatsApp.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="#catalogo"
                className="inline-flex items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
              >
                Ver catálogo
              </a>
              <button
                type="button"
                onClick={open}
                className="inline-flex items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-medium transition hover:border-gold hover:text-gold"
              >
                Meu carrinho ({cartCount})
              </button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-8 rounded-3xl bg-gradient-to-br from-gold/20 via-transparent to-transparent blur-3xl" />
            <div className="relative overflow-hidden rounded-2xl border border-border/60">
              <img
                src={heroImg}
                alt="Frasco de perfume dourado sobre mármore preto"
                width={1600}
                height={1200}
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Catálogo */}
      <section id="catalogo" className="border-t border-border/60 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-14 flex items-end justify-between">
            <div>
              <span className="text-[11px] uppercase tracking-[0.25em] text-gold">Catálogo</span>
              <h2 className="mt-3 font-display text-4xl font-semibold md:text-5xl">
                Nossas fragrâncias
              </h2>
            </div>
            <p className="hidden max-w-sm text-sm text-muted-foreground md:block">
              Adicione ao carrinho e envie o pedido pelo WhatsApp.
            </p>
          </div>


          {/* Filtro por gênero — segmented iOS-like */}
          <div className="mb-10 flex justify-center">
            <div className="relative inline-flex rounded-full border border-border/60 bg-card p-1 text-sm">
              <span
                aria-hidden
                className="absolute top-1 bottom-1 w-1/3 rounded-full bg-gold transition-transform duration-300 ease-out"
                style={{
                  transform: `translateX(${filtro === "feminino" ? "0%" : filtro === "todos" ? "100%" : "200%"})`,
                }}
              />
              {(["feminino", "todos", "masculino"] as const).map((op) => (
                <button
                  key={op}
                  type="button"
                  onClick={() => setFiltro(op)}
                  className={`relative z-10 w-28 rounded-full px-4 py-2 font-medium capitalize transition-colors ${
                    filtro === op ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {op}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {perfumesFiltrados.map((p) => {
              const i = perfumes.indexOf(p);
              const codigo = codigoDoPerfume(i);
              const imagem = p.imagem ?? imagensRotativas[i % imagensRotativas.length];
              const indisponivel = !p.emEstoque;
              const qtd = cart[p.id] ?? 0;
              return (
                <article
                  key={p.id}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition hover:border-gold/50"
                >
                  <Link
                    to="/perfume/$id"
                    params={{ id: p.id }}
                    className="relative aspect-[4/5] block overflow-hidden bg-background"
                    aria-label={`Ver ${p.nome}`}
                  >
                    <img
                      src={imagem}
                      alt={p.nome}
                      width={800}
                      height={1000}
                      loading="lazy"
                      className={`h-full w-full object-cover transition duration-700 group-hover:scale-105 ${indisponivel ? "opacity-40" : ""}`}
                    />
                    <span className="absolute left-4 top-4 rounded-full bg-background/80 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-gold backdrop-blur">
                      {codigo}
                    </span>
                    {indisponivel && (
                      <span className="absolute right-4 top-4 rounded-full bg-background/90 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground backdrop-blur">
                        Esgotado
                      </span>
                    )}
                  </Link>
                  <div className="flex flex-1 flex-col gap-4 p-6">
                    <div>
                      <h3 className="font-display text-xl font-semibold">
                        <Link to="/perfume/$id" params={{ id: p.id }} className="transition hover:text-gold">
                          {p.nome}
                        </Link>
                      </h3>
                      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                        {p.descricao || p.status || "Contratipo exclusivo"}
                      </p>
                    </div>
                    {indisponivel ? (
                      <button
                        type="button"
                        disabled
                        className="mt-auto inline-flex cursor-not-allowed items-center justify-center rounded-full bg-foreground/5 py-3 text-sm font-medium text-muted-foreground"
                      >
                        Indisponível
                      </button>
                    ) : qtd === 0 ? (
                      <button
                        type="button"
                        onClick={() => add(p.id)}
                        className="mt-auto inline-flex items-center justify-center rounded-full bg-foreground/5 py-3 text-sm font-medium transition group-hover:bg-gold group-hover:text-primary-foreground"
                      >
                        Adicionar ao carrinho
                      </button>
                    ) : (
                      <div className="mt-auto flex items-center justify-between rounded-full bg-gold/10 p-1">
                        <button
                          type="button"
                          onClick={() => remove(p.id)}
                          className="h-9 w-9 rounded-full bg-background text-lg font-semibold text-foreground transition hover:bg-gold hover:text-primary-foreground"
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
                          className="h-9 w-9 rounded-full bg-background text-lg font-semibold text-foreground transition hover:bg-gold hover:text-primary-foreground"
                          aria-label="Adicionar mais um"
                        >
                          +
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Sobre */}
      <section id="sobre" className="border-t border-border/60 bg-card/40 py-24">
        <div className="mx-auto grid max-w-7xl gap-12 px-6 md:grid-cols-2">
          <div>
            <span className="text-[11px] uppercase tracking-[0.25em] text-gold">Sobre nós</span>
            <h2 className="mt-3 font-display text-4xl font-semibold leading-tight md:text-5xl">
              Fragrâncias de luxo, sem o preço do luxo.
            </h2>
          </div>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Trabalhamos com essências importadas da mesma origem das grandes
              casas de perfumaria. Cada frasco é preparado com 30% de
              concentração, garantindo fixação superior a 12 horas na pele.
            </p>
            <p>
              Nosso compromisso é entregar a mesma experiência olfativa dos
              perfumes originais, com transparência sobre o que é um contratipo.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-border/60 py-24">
        <div className="mx-auto max-w-4xl px-6">
          <span className="text-[11px] uppercase tracking-[0.25em] text-gold">Dúvidas</span>
          <h2 className="mt-3 font-display text-4xl font-semibold md:text-5xl">
            Perguntas frequentes
          </h2>
          <div className="mt-12 divide-y divide-border/60">
            {[
              { q: "Como faço meu pedido?", a: "Adicione os perfumes ao carrinho, abra o carrinho e clique em Pedir no WhatsApp. A mensagem já vai pronta com o que você escolheu." },
              { q: "O que é um perfume contratipo?", a: "É uma fragrância inspirada em perfumes famosos, feita com essências de alta qualidade." },
              { q: "Qual a fixação?", a: "Em média 10 a 14 horas, com 30% de concentração." },
              { q: "Entregam para todo o Brasil?", a: "Sim, enviamos via Correios ou transportadora para todo o país." },
            ].map((item) => (
              <details key={item.q} className="group py-6">
                <summary className="flex cursor-pointer items-center justify-between font-display text-lg font-medium">
                  {item.q}
                  <span className="ml-4 text-gold transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-center">
            <img src={logoWhite.url} alt="Dakar Essence" className="h-16 w-auto" />
          </div>
          <p>© {new Date().getFullYear()} Dakar Essence. Todos os direitos reservados.</p>
        </div>
      </footer>

    </div>
  );
}
