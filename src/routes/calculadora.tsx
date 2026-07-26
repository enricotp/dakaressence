import { createFileRoute, Link } from "@tanstack/react-router";
import { Suspense } from "react";
import { CalculadoraPanel, calculadoraPerfumesQuery } from "@/components/calculadora-panel";
import logoWhite from "@/assets/dakar-essence-white.png.asset.json";

export const Route = createFileRoute("/calculadora")({
  loader: ({ context }) => context.queryClient.ensureQueryData(calculadoraPerfumesQuery),
  component: CalculadoraPage,
  head: () => ({
    meta: [{ title: "Calculadora — Dakar Essence" }],
  }),
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center text-muted-foreground">
      {error.message}
    </div>
  ),
});

function CalculadoraPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Link to="/" className="flex min-w-0 items-center" aria-label="Dakar Essence">
            <img src={logoWhite.url} alt="Dakar Essence" className="h-12 w-auto sm:h-16 md:h-24" />
          </Link>
          <Link
            to="/"
            className="shrink-0 text-xs uppercase tracking-[0.2em] text-muted-foreground transition hover:text-gold"
          >
            ← Voltar
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
        <span className="text-[11px] uppercase tracking-[0.25em] text-gold">Interno</span>
        <h1 className="mt-3 font-display text-3xl font-semibold sm:text-4xl md:text-5xl">
          Calculadora de pedido
        </h1>
        <p className="mt-4 text-muted-foreground">
          Cole a mensagem do WhatsApp abaixo. O sistema identifica os perfumes,
          busca o preço atualizado e calcula o total.
        </p>

        <div className="mt-8">
          <Suspense fallback={<div className="text-muted-foreground">Carregando…</div>}>
            <CalculadoraPanel />
          </Suspense>
        </div>
      </section>
    </div>
  );
}
