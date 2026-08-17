import { createFileRoute, Link } from "@tanstack/react-router";
import { logoWhite } from "@/lib/constants";
import { useCart } from "@/lib/cart-context";
import { CollectionShowcase } from "@/components/collection-showcase";
import { Header } from "@/components/header";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { cartCount, open } = useCart();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />


      {/* Hero */}
      <section id="top" className="relative overflow-hidden">
        <div className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6 sm:py-20 md:py-28">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-gold">
            <span className="h-1 w-1 rounded-full bg-gold" /> Coleção 2026
          </span>
          <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl md:text-7xl">
            A mesma essência,{" "}
            <span className="bg-gradient-to-r from-gold to-gold-soft bg-clip-text text-transparent">
              metade do preço.
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
            Perfumes contratipos com alta concentração e fixação premium.
            Monte seu pedido e finalize direto no WhatsApp.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-4">
            <Link
              to="/catalogo"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 sm:w-auto"
            >
              Ver catálogo
            </Link>
            <button
              type="button"
              onClick={open}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-medium transition hover:border-gold hover:text-gold sm:w-auto"
            >
              Meu carrinho ({cartCount})
            </button>
          </div>
        </div>
      </section>

      <CollectionShowcase />

      {/* Sobre */}
      <section id="sobre" className="border-t border-border/60 bg-card/40 py-14 sm:py-20 md:py-24">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 md:grid-cols-2 md:gap-12">
          <div>
            <span className="text-[11px] uppercase tracking-[0.25em] text-gold">Sobre nós</span>
            <h2 className="mt-3 font-display text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl">
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
      <section id="faq" className="border-t border-border/60 py-14 sm:py-20 md:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <span className="text-[11px] uppercase tracking-[0.25em] text-gold">Dúvidas</span>
          <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl md:text-5xl">
            Perguntas frequentes
          </h2>
          <div className="mt-10 divide-y divide-border/60 sm:mt-12">
            {[
              { q: "Como faço meu pedido?", a: "Adicione os perfumes ao carrinho, abra o carrinho e clique em Pedir no WhatsApp. A mensagem já vai pronta com o que você escolheu." },
              { q: "Qual a fixação?", a: "Em média 10 a 14 horas, com 30% de concentração." },
              { q: "Do que são feitos os perfumes?", a: "Todos os perfumes são à base de óleo e linalol, com fixador importado." },
              { q: "Entregam para todo o Brasil?", a: "Por enquanto entregamos apenas para Sorocaba e região." },
            ].map((item) => (
              <details key={item.q} className="group py-5 sm:py-6">
                <summary className="flex cursor-pointer items-center justify-between gap-4 font-display text-base font-medium sm:text-lg">
                  <span className="min-w-0">{item.q}</span>
                  <span className="shrink-0 text-gold transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground sm:text-base">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-8 pb-24 sm:py-10 md:pb-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:px-6 md:flex-row">
          <div className="flex items-center">
            <img src={logoWhite} alt="Dakar Essence" className="h-12 w-auto sm:h-16" />
          </div>
          <p className="text-center text-xs sm:text-sm">© {new Date().getFullYear()} Dakar Essence. Todos os direitos reservados.</p>
          <div />
        </div>
      </footer>
    </div>
  );
}
