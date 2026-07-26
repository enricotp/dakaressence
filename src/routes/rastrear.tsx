import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/rastrear")({
  component: RastrearPage,
  head: () => ({
    meta: [
      { title: "Rastrear pedido — Dakar Essence" },
      { name: "description", content: "Acompanhe o status do seu pedido pelo código." },
      { property: "og:title", content: "Rastrear pedido — Dakar Essence" },
      { property: "og:description", content: "Acompanhe o status do seu pedido pelo código." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
});

function RastrearPage() {
  const [codigo, setCodigo] = useState("");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background px-4 py-16 text-foreground">
      <div className="mx-auto max-w-md">
        <Link to="/" className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-gold">
          ← voltar
        </Link>
        <h1 className="mt-6 font-display text-3xl">Rastrear pedido</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Informe o código recebido no WhatsApp (ex: PED-XXXXXX).
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const id = codigo.trim();
            if (id) navigate({ to: "/pedido/$id", params: { id } });
          }}
          className="mt-6 space-y-3"
        >
          <input
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase())}
            placeholder="PED-XXXXXX"
            className="w-full rounded-lg border border-border/60 bg-card px-4 py-3 text-sm focus:border-gold focus:outline-none"
          />
          <button
            type="submit"
            disabled={!codigo.trim()}
            className="w-full rounded-full bg-gold px-6 py-3 text-sm font-semibold uppercase tracking-wider text-primary-foreground disabled:opacity-50"
          >
            Rastrear
          </button>
        </form>
      </div>
    </div>
  );
}
