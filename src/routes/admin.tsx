import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { isAdmin, loginAdmin, logoutAdmin } from "@/lib/admin.functions";
import {
  listarPedidos,
  atualizarStatusPedido,
  type Pedido,
} from "@/lib/orders.functions";
import { formatBRL } from "@/lib/format";

export const Route = createFileRoute("/admin")({
  component: AdminPage,
  head: () => ({
    meta: [
      { title: "Admin — Dakar Essence" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

function AdminPage() {
  const check = useServerFn(isAdmin);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["admin-session"],
    queryFn: () => check(),
    staleTime: 0,
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
        Carregando…
      </div>
    );
  }

  if (!data?.unlocked) {
    return <LoginForm onSuccess={() => refetch()} />;
  }

  return <AdminPanel onLogout={() => refetch()} />;
}

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const login = useServerFn(loginAdmin);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    try {
      const res = await login({ data: { password } });
      if (res.ok) onSuccess();
      else setError(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-foreground">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-sm rounded-2xl border border-border/60 bg-card p-8"
      >
        <h1 className="font-display text-2xl font-semibold">Painel Dakar</h1>
        <p className="mt-1 text-sm text-muted-foreground">Área restrita</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha"
          autoComplete="current-password"
          className="mt-6 w-full rounded-lg border border-border/60 bg-background px-4 py-3 text-sm focus:border-gold focus:outline-none"
        />
        {error && (
          <p className="mt-3 text-xs text-destructive">Senha incorreta.</p>
        )}
        <button
          type="submit"
          disabled={loading || !password}
          className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
      </form>
    </div>
  );
}

function AdminPanel({ onLogout }: { onLogout: () => void }) {
  const logout = useServerFn(logoutAdmin);
  const listar = useServerFn(listarPedidos);
  const atualizar = useServerFn(atualizarStatusPedido);
  const qc = useQueryClient();

  const [filtro, setFiltro] = useState<"todos" | "Pendente" | "Concluído" | "Cancelado">(
    "Pendente",
  );

  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ["pedidos"],
    queryFn: () => listar(),
    refetchInterval: 15000,
  });

  const filtrados = pedidos.filter((p: Pedido) =>
    filtro === "todos" ? true : p.status === filtro,
  );

  async function mudarStatus(p: Pedido, status: "Concluído" | "Cancelado" | "Pendente") {
    await atualizar({ data: { row: p.row, status } });
    qc.invalidateQueries({ queryKey: ["pedidos"] });
  }

  async function sair() {
    await logout();
    onLogout();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <h1 className="font-display text-xl font-semibold">Painel Dakar</h1>
          <div className="flex items-center gap-3">
            <a
              href={`https://docs.google.com/spreadsheets/d/1YDXLWaevUB9LnrQGImIV9iGBT9ayCbZYdkzaWkXZrWw/edit`}
              target="_blank"
              rel="noreferrer"
              className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-gold"
            >
              Planilha ↗
            </a>
            <button
              onClick={sair}
              className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-destructive"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {(["Pendente", "Concluído", "Cancelado", "todos"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`rounded-full px-4 py-1.5 text-xs uppercase tracking-wider transition ${
                filtro === f
                  ? "bg-gold text-primary-foreground"
                  : "border border-border/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "todos" ? "Todos" : f} {filtro === f && `(${filtrados.length})`}
            </button>
          ))}
        </div>

        {isLoading ? (
          <p className="text-sm text-muted-foreground">Carregando pedidos…</p>
        ) : filtrados.length === 0 ? (
          <p className="text-sm text-muted-foreground">Nenhum pedido nesta lista.</p>
        ) : (
          <ul className="space-y-3">
            {filtrados
              .slice()
              .reverse()
              .map((p) => (
                <li
                  key={p.id}
                  className="rounded-2xl border border-border/60 bg-card p-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-[10px] uppercase tracking-[0.2em] text-gold">
                          {p.id}
                        </span>
                        <StatusBadge status={p.status} />
                        <span className="text-xs text-muted-foreground">{p.data}</span>
                      </div>
                      <p className="mt-2 font-semibold">{p.cliente || "—"}</p>
                      <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-muted-foreground">
                        {p.itens}
                      </pre>
                      <p className="mt-3 text-xs text-muted-foreground">
                        {p.pagamento}
                        {p.parcelas && p.parcelas !== "-" ? ` · ${p.parcelas}` : ""}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <span className="font-display text-2xl font-semibold text-gold">
                        {formatBRL(p.total)}
                      </span>
                      <div className="flex gap-2">
                        {p.status !== "Concluído" && (
                          <button
                            onClick={() => mudarStatus(p, "Concluído")}
                            className="rounded-full bg-gold px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:brightness-110"
                          >
                            Concluir
                          </button>
                        )}
                        {p.status !== "Cancelado" && (
                          <button
                            onClick={() => mudarStatus(p, "Cancelado")}
                            className="rounded-full border border-border/60 px-3 py-1.5 text-xs text-muted-foreground hover:text-destructive hover:border-destructive"
                          >
                            Cancelar
                          </button>
                        )}
                        {p.status !== "Pendente" && (
                          <button
                            onClick={() => mudarStatus(p, "Pendente")}
                            className="rounded-full border border-border/60 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
                          >
                            Reabrir
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Pendente: "bg-yellow-500/20 text-yellow-400",
    Concluído: "bg-emerald-500/20 text-emerald-400",
    Cancelado: "bg-red-500/20 text-red-400",
  };
  const cls = map[status] ?? "bg-muted text-muted-foreground";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${cls}`}>
      {status || "—"}
    </span>
  );
}
