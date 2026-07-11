import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { getPerfumes, type Perfume } from "@/lib/perfumes.functions";
import { formatBRL } from "@/lib/format";
import logoWhite from "@/assets/dakar-essence-white.png.asset.json";

const perfumesQuery = queryOptions({
  queryKey: ["perfumes"],
  queryFn: () => getPerfumes(),
  staleTime: 0,
});

export const Route = createFileRoute("/calculadora")({
  loader: ({ context }) => context.queryClient.ensureQueryData(perfumesQuery),
  component: Calculadora,
  head: () => ({
    meta: [{ title: "Calculadora — Dakar Essence" }],
  }),
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center text-muted-foreground">
      {error.message}
    </div>
  ),
});

type LinhaCalculada = {
  qtd: number;
  nome: string;
  preco: number | null;
  subtotal: number | null;
  match: Perfume | null;
  raw: string;
};

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function parseTexto(texto: string, perfumes: Perfume[]): LinhaCalculada[] {
  const linhas = texto.split("\n").map((l) => l.trim()).filter(Boolean);
  const resultado: LinhaCalculada[] = [];
  const perfumesNorm = perfumes.map((p) => ({ p, n: normalize(p.nome) }));

  for (const raw of linhas) {
    // Match "Nx Nome" ou "N x Nome" ou "• Nx Nome"
    const m = raw.match(/^[•\-\*\s]*(\d+)\s*[xX]\s+(.+?)(?:\s*\([^)]*\))?\s*$/);
    if (!m) continue;
    const qtd = parseInt(m[1], 10);
    const nome = m[2].trim();
    const nomeNorm = normalize(nome);
    // best match: highest overlap length
    let best: { p: Perfume; score: number } | null = null;
    for (const { p, n } of perfumesNorm) {
      if (nomeNorm === n) {
        best = { p, score: 999 };
        break;
      }
      if (nomeNorm.includes(n) || n.includes(nomeNorm)) {
        const score = Math.min(n.length, nomeNorm.length);
        if (!best || score > best.score) best = { p, score };
      }
    }
    const match = best?.p ?? null;
    const preco = match?.preco ?? null;
    resultado.push({
      qtd,
      nome: match?.nome ?? nome,
      preco,
      subtotal: preco != null ? preco * qtd : null,
      match,
      raw,
    });
  }
  return resultado;
}

function Calculadora() {
  const { data: perfumes } = useSuspenseQuery(perfumesQuery);
  const [texto, setTexto] = useState("");
  const [pagamento, setPagamento] = useState<"Pix" | "Cartão">("Pix");
  const [parcelas, setParcelas] = useState(1);

  const linhas = useMemo(() => parseTexto(texto, perfumes), [texto, perfumes]);
  const total = linhas.reduce((acc, l) => acc + (l.subtotal ?? 0), 0);
  const semPreco = linhas.some((l) => l.subtotal == null);

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
        <h1 className="mt-3 font-display text-4xl font-semibold md:text-5xl">
          Calculadora de pedido
        </h1>
        <p className="mt-4 text-muted-foreground">
          Cole a mensagem do WhatsApp abaixo. O sistema identifica os perfumes,
          busca o preço atualizado e calcula o total.
        </p>

        <div className="mt-8 grid gap-6">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder={"Cole aqui o pedido, ex:\n• 2x Angel (Nº 001)\n• 1x 1 Million (Nº 009)"}
            rows={10}
            className="w-full rounded-2xl border border-border/60 bg-card p-4 font-mono text-sm text-foreground focus:border-gold focus:outline-none"
          />

          {linhas.length > 0 && (
            <div className="rounded-2xl border border-border/60 bg-card p-6">
              <ul className="divide-y divide-border/60">
                {linhas.map((l, i) => (
                  <li key={i} className="flex items-center justify-between gap-4 py-3">
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {l.qtd}× {l.nome}
                      </p>
                      {!l.match && (
                        <p className="text-xs text-destructive">Perfume não encontrado</p>
                      )}
                      {l.match && l.preco == null && (
                        <p className="text-xs text-muted-foreground">Sem preço cadastrado</p>
                      )}
                      {l.preco != null && (
                        <p className="text-xs text-muted-foreground">
                          {formatBRL(l.preco)} × {l.qtd}
                        </p>
                      )}
                    </div>
                    <span className="shrink-0 font-semibold text-gold">
                      {l.subtotal != null ? formatBRL(l.subtotal) : "—"}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="mt-6 flex items-center justify-between border-t border-border/60 pt-4">
                <span className="uppercase tracking-[0.2em] text-muted-foreground text-sm">
                  Total
                </span>
                <span className="font-display text-3xl font-semibold text-gold">
                  {formatBRL(total)}
                </span>
              </div>
              {semPreco && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Alguns itens ficaram sem preço — confira manualmente.
                </p>
              )}

              <div className="mt-6 space-y-4 border-t border-border/60 pt-6">
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

                {pagamento === "Cartão" && total > 0 && (
                  <div>
                    <label className="text-xs uppercase tracking-wider text-muted-foreground">
                      Parcelas
                    </label>
                    <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setParcelas(n)}
                          className={`rounded-lg border px-2 py-2 text-xs transition ${
                            parcelas === n
                              ? "border-gold bg-gold/10 text-gold"
                              : "border-border/60 text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <div className="font-semibold">{n}x</div>
                          <div className="text-[10px]">{formatBRL(total / n)}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {total > 0 && (
                  <div className="rounded-lg border border-gold/40 bg-gold/5 p-4 text-sm">
                    {pagamento === "Pix" ? (
                      <p>
                        <strong className="text-gold">Pix à vista:</strong>{" "}
                        {formatBRL(total)}
                      </p>
                    ) : (
                      <p>
                        <strong className="text-gold">
                          Cartão em {parcelas}x:
                        </strong>{" "}
                        {parcelas}× de {formatBRL(total / parcelas)} ={" "}
                        {formatBRL(total)}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
