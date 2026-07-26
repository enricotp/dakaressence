import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { rastrearPedido } from "@/lib/tracking.functions";
import { formatBRL } from "@/lib/format";


export const Route = createFileRoute("/pedido/$id")({
  component: PedidoPage,
  head: ({ params }) => ({
    meta: [
      { title: `Pedido ${params.id} — Dakar Essence` },
      { name: "description", content: `Status do pedido ${params.id}.` },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: `Pedido ${params.id} — Dakar Essence` },
      { property: "og:description", content: `Status do pedido ${params.id}.` },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

const ETAPAS = ["Pendente", "Concluído"] as const;

function PedidoPage() {
  const { id } = useParams({ from: "/pedido/$id" });
  const rastrear = useServerFn(rastrearPedido);
  const { data, isLoading } = useQuery({
    queryKey: ["pedido", id],
    queryFn: () => rastrear({ data: { id } }),
  });

  return (
    <div className="min-h-screen bg-background px-4 py-16 text-foreground">
      <div className="mx-auto max-w-lg">
        <Link to="/rastrear" className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-gold">
          ← rastrear outro
        </Link>
        <h1 className="mt-6 font-display text-2xl">Pedido {id}</h1>

        {isLoading && <p className="mt-6 text-sm text-muted-foreground">Buscando…</p>}

        {!isLoading && !data && (
          <div className="mt-6 rounded-2xl border border-border/60 bg-card p-6">
            <p className="text-sm">Pedido não encontrado.</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Confira o código ou fale com a gente pelo WhatsApp.
            </p>
          </div>
        )}

        {data && (
          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-border/60 bg-card p-6">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Status atual</p>
              <p className="mt-1 font-display text-xl text-gold">{data.status}</p>
              <p className="mt-2 text-xs text-muted-foreground">Feito em {data.data}</p>

              <ol className="mt-6 space-y-3">
                {ETAPAS.map((etapa) => {
                  const done =
                    data.status === "Cancelado"
                      ? false
                      : ETAPAS.indexOf(etapa) <=
                        ETAPAS.indexOf(data.status as (typeof ETAPAS)[number]);
                  return (
                    <li key={etapa} className="flex items-center gap-3">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${
                          done ? "bg-gold text-primary-foreground" : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {done ? "✓" : "•"}
                      </span>
                      <span className={done ? "text-sm" : "text-sm text-muted-foreground"}>
                        {etapa}
                      </span>
                    </li>
                  );
                })}
                {data.status === "Cancelado" && (
                  <li className="flex items-center gap-3">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                      ✕
                    </span>
                    <span className="text-sm text-destructive">Cancelado</span>
                  </li>
                )}
              </ol>
            </div>

            {data.rastreio && (
              <div className="rounded-2xl border border-gold/50 bg-card p-6">
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  Código de rastreio
                </p>
                <p className="mt-1 font-mono text-lg font-semibold tracking-wider text-gold">
                  {data.rastreio}
                </p>
                <a
                  href={`https://rastreamento.correios.com.br/app/index.php?objeto=${encodeURIComponent(data.rastreio)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-3 inline-flex items-center gap-1 rounded-full bg-gold px-4 py-2 text-xs font-semibold uppercase tracking-wider text-primary-foreground hover:brightness-110"
                >
                  Rastrear nos Correios ↗
                </a>
                <p className="mt-3 text-[11px] text-muted-foreground">
                  Pode levar até 24h para aparecer no site dos Correios após a postagem.
                </p>
              </div>
            )}

            <div className="rounded-2xl border border-border/60 bg-card p-6">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Itens</p>
              <pre className="mt-2 whitespace-pre-wrap font-sans text-sm">{data.itens}</pre>
              <div className="mt-4 flex items-center justify-between border-t border-border/40 pt-3 text-sm">
                <span className="text-muted-foreground">
                  {data.pagamento} {data.parcelas && data.parcelas !== "-" ? `· ${data.parcelas}` : ""}
                </span>
                <span className="font-display text-lg text-gold">{formatBRL(data.total)}</span>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
