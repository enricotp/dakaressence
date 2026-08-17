import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import perfume1 from "@/assets/perfume-1.jpg";
import perfume2 from "@/assets/perfume-2.jpg";
import perfume3 from "@/assets/perfume-3.jpg";
import { logoWhite } from "@/lib/constants";
import { useCart } from "@/lib/cart-context";
import { CartButton } from "@/components/cart-drawer";
import { CollectionShowcase } from "@/components/collection-showcase";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { cartCount, open } = useCart();
  const [secaoAtiva, setSecaoAtiva] = useState<"home" | "sobre" | "faq">("home");

  useEffect(() => {
    const idParaSecao: Record<string, "home" | "sobre" | "faq"> = { top: "home", sobre: "sobre", faq: "faq" };
    const els = Object.keys(idParaSecao)
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => el !== null);
    if (els.length === 0) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visiveis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visiveis[0]) setSecaoAtiva(idParaSecao[visiveis[0].target.id]);
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.25, 0.5, 1] },
    );
    els.forEach((el) => obs.observe(el));
    return () => obs.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <a href="#top" className="flex min-w-0 items-center" aria-label="Dakar Essence">
            <img src={logoWhite} alt="Dakar Essence" className="h-12 w-auto sm:h-16 md:h-24" />
          </a>
          <nav className="hidden md:flex">
            <div className="relative inline-flex rounded-full border border-border/60 bg-card p-1 text-sm">
              <span
                aria-hidden
                className="absolute top-1 bottom-1 w-[20%] rounded-full bg-gold transition-transform duration-300 ease-out"
                style={{
                  transform: `translateX(${secaoAtiva === "home" ? "0%" : secaoAtiva === "sobre" ? "200%" : "300%"})`,
                }}
              />
              {([
                { id: "top", secao: "home", label: "Home" },
                { id: "catalogo", label: "Catálogo" },
                { id: "sobre", secao: "sobre", label: "Sobre" },
                { id: "faq", secao: "faq", label: "FAQ" },
              ] as const).map((s) => 
                s.id === "catalogo" ? (
                  <Link
                    key={s.id}
                    to="/catalogo"
                    className="relative z-10 w-24 rounded-full px-4 py-2 text-center font-medium text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {s.label}
                  </Link>
                ) : (
                  <a
                    key={s.id}
                    href={`#${s.id}`}
                    className={`relative z-10 w-24 rounded-full px-4 py-2 text-center font-medium transition-colors ${
                      secaoAtiva === (s as any).secao ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {s.label}
                  </a>
                )
              )}
            </div>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/rastrear"
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground transition hover:border-gold hover:text-gold sm:text-sm"
              aria-label="Rastrear pedido"
            >
              <svg aria-hidden className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 3h5v5" />
                <path d="M21 3l-7 7" />
                <circle cx="12" cy="12" r="3" />
                <path d="M3 12a9 9 0 0 0 9 9" />
              </svg>
              <span className="hidden sm:inline">Rastrear</span>
            </Link>
            <CartButton />
          </div>
        </div>
        
        <nav className="flex gap-1 border-t border-border/60 px-2 py-2 md:hidden">
          {([
            { id: "top", secao: "home", label: "Home" },
            { id: "catalogo", label: "Catálogo" },
            { id: "sobre", secao: "sobre", label: "Sobre" },
            { id: "faq", secao: "faq", label: "FAQ" },
          ] as const).map((s) => 
            s.id === "catalogo" ? (
              <Link
                key={s.id}
                to="/catalogo"
                className="flex-1 min-h-11 inline-flex items-center justify-center rounded-full px-2 text-xs font-medium text-muted-foreground transition"
              >
                {s.label}
              </Link>
            ) : (
              <a
                key={s.id}
                href={`#${s.id}`}
                className={`flex-1 min-h-11 inline-flex items-center justify-center rounded-full px-2 text-xs font-medium transition ${
                  secaoAtiva === (s as any).secao ? "bg-gold text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {s.label}
              </a>
            )
          )}
        </nav>
      </header>

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
