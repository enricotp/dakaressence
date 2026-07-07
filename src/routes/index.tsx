import { createFileRoute } from "@tanstack/react-router";
import heroImg from "@/assets/hero-perfume.jpg";
import perfume1 from "@/assets/perfume-1.jpg";
import perfume2 from "@/assets/perfume-2.jpg";
import perfume3 from "@/assets/perfume-3.jpg";

export const Route = createFileRoute("/")({
  component: Index,
});

const WHATSAPP_NUMBER = "5511999999999"; // troque pelo seu número (formato: 55 + DDD + número)

type Perfume = {
  id: string;
  nome: string;
  inspiracao: string;
  familia: string;
  preco: string;
  imagem: string;
};

const perfumes: Perfume[] = [
  { id: "001", nome: "Nº 001", inspiracao: "Inspirado em Sauvage — Dior", familia: "Amadeirado Aromático", preco: "R$ 149", imagem: perfume1 },
  { id: "002", nome: "Nº 002", inspiracao: "Inspirado em Bleu de Chanel", familia: "Cítrico Amadeirado", preco: "R$ 149", imagem: perfume2 },
  { id: "003", nome: "Nº 003", inspiracao: "Inspirado em Baccarat Rouge 540", familia: "Âmbar Floral", preco: "R$ 189", imagem: perfume3 },
  { id: "004", nome: "Nº 004", inspiracao: "Inspirado em La Vie Est Belle", familia: "Floral Gourmand", preco: "R$ 149", imagem: perfume1 },
  { id: "005", nome: "Nº 005", inspiracao: "Inspirado em Good Girl — CH", familia: "Floral Oriental", preco: "R$ 159", imagem: perfume2 },
  { id: "006", nome: "Nº 006", inspiracao: "Inspirado em 212 VIP Black", familia: "Amadeirado Doce", preco: "R$ 149", imagem: perfume3 },
];

const waLink = (msg: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(msg)}`;

function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
          <a href="#top" className="flex items-baseline gap-2">
            <span className="font-display text-xl font-semibold tracking-tight text-foreground">
              Essência
            </span>
            <span className="text-[10px] uppercase tracking-[0.25em] text-gold">Parfum</span>
          </a>
          <nav className="hidden items-center gap-8 text-sm text-muted-foreground md:flex">
            <a href="#catalogo" className="transition hover:text-foreground">Catálogo</a>
            <a href="#sobre" className="transition hover:text-foreground">Sobre</a>
            <a href="#faq" className="transition hover:text-foreground">FAQ</a>
          </nav>
          <a
            href={waLink("Olá! Gostaria de fazer um pedido.")}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-xs font-medium uppercase tracking-wider text-gold transition hover:bg-gold hover:text-primary-foreground"
          >
            Pedir no WhatsApp
          </a>
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
              Inspirados nas maiores fragrâncias do mundo, feitos com essências
              importadas.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href="#catalogo"
                className="inline-flex items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
              >
                Ver catálogo
              </a>
              <a
                href={waLink("Olá! Quero saber mais sobre os perfumes.")}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-medium text-foreground transition hover:border-gold hover:text-gold"
              >
                Falar no WhatsApp
              </a>
            </div>
            <div className="mt-12 grid grid-cols-3 gap-6 border-t border-border/60 pt-8">
              {[
                ["+30%", "Concentração"],
                ["12h+", "Fixação média"],
                ["4.9★", "Avaliação"],
              ].map(([v, l]) => (
                <div key={l}>
                  <div className="font-display text-2xl font-semibold text-gold">{v}</div>
                  <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">{l}</div>
                </div>
              ))}
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
              <span className="text-[11px] uppercase tracking-[0.25em] text-gold">
                Catálogo
              </span>
              <h2 className="mt-3 font-display text-4xl font-semibold md:text-5xl">
                Nossas fragrâncias
              </h2>
            </div>
            <p className="hidden max-w-sm text-sm text-muted-foreground md:block">
              Toque em qualquer perfume para pedir direto pelo WhatsApp.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {perfumes.map((p) => (
              <article
                key={p.id}
                className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition hover:border-gold/50"
              >
                <div className="relative aspect-[4/5] overflow-hidden bg-background">
                  <img
                    src={p.imagem}
                    alt={`${p.nome} — ${p.inspiracao}`}
                    width={800}
                    height={1000}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <span className="absolute left-4 top-4 rounded-full bg-background/80 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-gold backdrop-blur">
                    {p.id}
                  </span>
                </div>
                <div className="flex flex-1 flex-col gap-4 p-6">
                  <div>
                    <h3 className="font-display text-xl font-semibold">{p.nome}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{p.inspiracao}</p>
                  </div>
                  <div className="flex items-center justify-between text-xs uppercase tracking-wider text-muted-foreground">
                    <span>{p.familia}</span>
                    <span className="font-display text-base font-semibold text-gold">
                      {p.preco}
                    </span>
                  </div>
                  <a
                    href={waLink(
                      `Olá! Quero pedir o ${p.nome} (${p.inspiracao}) — ${p.preco}.`,
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-2 inline-flex items-center justify-center rounded-full bg-foreground/5 py-3 text-sm font-medium text-foreground transition group-hover:bg-gold group-hover:text-primary-foreground"
                  >
                    Pedir no WhatsApp
                  </a>
                </div>
              </article>
            ))}
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
              perfumes originais, com transparência sobre o que é um contratipo
              — sem cópias ilegais ou promessas vazias.
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
              {
                q: "O que é um perfume contratipo?",
                a: "É uma fragrância inspirada em perfumes famosos, feita com essências de alta qualidade, entregando aroma e fixação similares por um preço muito mais acessível.",
              },
              {
                q: "Qual a fixação e projeção?",
                a: "Em média 10 a 14 horas de fixação com projeção moderada a alta, graças aos 30% de concentração da essência.",
              },
              {
                q: "Como faço meu pedido?",
                a: "Clique em qualquer botão de WhatsApp. Você fala direto conosco, tira dúvidas e finaliza a compra pelo chat.",
              },
              {
                q: "Fazem entrega para todo o Brasil?",
                a: "Sim. Enviamos via Correios ou transportadora para todo o território nacional.",
              },
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

      {/* Footer CTA */}
      <section className="border-t border-border/60 bg-gradient-to-b from-transparent to-gold/5 py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="font-display text-4xl font-semibold md:text-5xl">
            Pronto para escolher sua próxima assinatura olfativa?
          </h2>
          <p className="mt-4 text-muted-foreground">
            Atendimento personalizado no WhatsApp para te ajudar a escolher.
          </p>
          <a
            href={waLink("Olá! Quero ajuda para escolher meu perfume.")}
            target="_blank"
            rel="noreferrer"
            className="mt-8 inline-flex items-center justify-center rounded-full bg-gold px-8 py-4 text-sm font-semibold text-primary-foreground transition hover:brightness-110"
          >
            Falar com um consultor
          </a>
        </div>
      </section>

      <footer className="border-t border-border/60 py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 text-sm text-muted-foreground md:flex-row">
          <div className="flex items-baseline gap-2">
            <span className="font-display text-base font-semibold text-foreground">Essência</span>
            <span className="text-[10px] uppercase tracking-[0.25em] text-gold">Parfum</span>
          </div>
          <p>© {new Date().getFullYear()} Essência. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
