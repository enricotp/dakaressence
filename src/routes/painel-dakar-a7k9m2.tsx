import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Suspense, useMemo, useState } from "react";
import { CalculadoraPanel } from "@/components/calculadora-panel";
import { HomeConfigTab } from "@/components/home-config-tab";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { isAdmin, loginAdmin, logoutAdmin } from "@/lib/admin.functions";
import {
  listarFuncionarios,
  criarFuncionario,
  atualizarFuncionario,
  removerFuncionario,
} from "@/lib/users.functions";
import {
 listarPedidos,
 atualizarRastreio,
  atualizarStatusPedido,
  listarItensVendidos,
  type Pedido,
  type ItemVendido,
} from "@/lib/orders.functions";
import {
  getPerfumes,
  atualizarPerfume,
  criarPerfume,
  excluirPerfume,
  aplicarCustosPadrao,
  formatarNumeroPerfume,
  COLECOES,
  COLECAO_INFO,
  type Perfume,
  type Colecao,
  type Genero,
  type Volume,
} from "@/lib/perfumes.functions";

import { formatBRL } from "@/lib/format";

export const Route = createFileRoute("/painel-dakar-a7k9m2")({
  component: AdminPage,
  head: () => ({
    meta: [
      { title: "Painel — Dakar Essence" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
});

type Tab = "pedidos" | "analytics" | "perfumes" | "calculadora" | "funcionarios" | "home_config";

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

  return (
    <AdminPanel
      nome={data.nome ?? "Admin"}
      role={(data.role as "dono" | "gerente" | "vendedor") ?? "vendedor"}
      onLogout={() => refetch()}
    />
  );
}

function LoginForm({ onSuccess }: { onSuccess: () => void }) {
  const login = useServerFn(loginAdmin);
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);
    try {
      const res = await login({ data: { login: loginId, password } });
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
          type="text"
          value={loginId}
          onChange={(e) => setLoginId(e.target.value)}
          placeholder="Login (deixe vazio para dono)"
          autoComplete="username"
          className="mt-6 w-full rounded-lg border border-border/60 bg-background px-4 py-3 text-sm focus:border-gold focus:outline-none"
        />
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha"
          autoComplete="current-password"
          className="mt-3 w-full rounded-lg border border-border/60 bg-background px-4 py-3 text-sm focus:border-gold focus:outline-none"
        />
        {error && <p className="mt-3 text-xs text-destructive">Login ou senha incorretos.</p>}
        <button
          type="submit"
          disabled={loading || !password}
          className="mt-6 inline-flex w-full items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
        >
          {loading ? "Entrando…" : "Entrar"}
        </button>
        <div className="mt-6 border-t border-border/60 pt-4 text-center">
          <Link
            to="/calculadora"
            className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-muted-foreground/60 transition hover:text-gold"
          >
            <svg aria-hidden className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="2" width="16" height="20" rx="2" />
              <path d="M8 6h8M8 10h2M12 10h2M16 10h.01M8 14h2M12 14h2M16 14h.01M8 18h6" />
            </svg>
            Calculadora de pedido
          </Link>
        </div>
      </form>
    </div>
  );
}

function AdminPanel({ nome, role, onLogout }: { nome: string; role: "dono" | "gerente" | "vendedor"; onLogout: () => void }) {
  const logout = useServerFn(logoutAdmin);
  const listarPerfs = useServerFn(getPerfumes);
  const [tab, setTab] = useState<Tab>("pedidos");

  const { data: perfumesAll = [] } = useQuery({
    queryKey: ["perfumes"],
    queryFn: () => listarPerfs(),
  });
  const alertas = perfumesAll.filter((p) => estoqueAlerta(p) !== "ok").length;

  async function sair() {
    await logout();
    onLogout();
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <div>
            <h1 className="font-display text-xl font-semibold">Painel Dakar</h1>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {nome} · {role}
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-1">
            {(
              [
                ["pedidos", "Pedidos"],
                ["analytics", "Analytics"],
                ["perfumes", "Perfumes"],
                ["calculadora", "Calculadora"],
                ["home_config", "Página Inicial"],
                ...(role === "dono" ? ([["funcionarios", "Funcionários"]] as const) : []),
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                onClick={() => setTab(k as Tab)}
                className={`relative rounded-full px-4 py-1.5 text-xs uppercase tracking-wider transition ${
                  tab === k
                    ? "bg-gold text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
                {k === "perfumes" && alertas > 0 && (
                  <span
                    title={`${alertas} perfume(s) com estoque baixo ou esgotado`}
                    className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white"
                  >
                    {alertas}
                  </span>
                )}
              </button>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <a
              href="https://docs.google.com/spreadsheets/d/1YDXLWaevUB9LnrQGImIV9iGBT9ayCbZYdkzaWkXZrWw/edit"
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
        {tab === "pedidos" && <PedidosTab />}
        {tab === "analytics" && <AnalyticsTab />}
        {tab === "perfumes" && <PerfumesTab />}
        {tab === "calculadora" && <CalculadoraTab />}
        {tab === "funcionarios" && role === "dono" && <FuncionariosTab />}
        {tab === "home_config" && <HomeConfigTab />}
      </section>
    </div>
  );
}

function estoqueAlerta(p: Perfume): "ok" | "low" | "out" {
  const s = (p.status || "").toLowerCase();
  const oos = p.oosThreshold ?? 0;
  const low = p.lowThreshold ?? 3;
  if (s.includes("no stock") || s.includes("out") || (p.amount !== null && p.amount <= oos))
    return "out";
  if (s.includes("low") || (p.amount != null && p.amount <= low)) return "low";
  return "ok";
}

function EstoqueBadge({ nivel }: { nivel: "low" | "out" }) {
  const cfg =
    nivel === "out"
      ? { cls: "bg-red-500/15 text-red-400 border-red-500/40", label: "Sem estoque" }
      : { cls: "bg-yellow-500/15 text-yellow-400 border-yellow-500/40", label: "Estoque baixo" };
  return (
    <span
      title={cfg.label}
      className={`inline-flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[10px] uppercase tracking-wider ${cfg.cls}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-3 w-3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      {cfg.label}
    </span>
  );
}


/* ---------------- Pedidos ---------------- */

function PedidosTab() {
  const listar = useServerFn(listarPedidos);
  const atualizar = useServerFn(atualizarStatusPedido);
  const salvarRastreio = useServerFn(atualizarRastreio);
  const qc = useQueryClient();

  const [filtro, setFiltro] = useState<"todos" | "Pendente" | "Concluído" | "Cancelado">(
    "Pendente",
  );
  const [busca, setBusca] = useState("");
  const [dataFiltro, setDataFiltro] = useState("");
  const [rastreioEdit, setRastreioEdit] = useState<Record<string, string>>({});
  const [savingRastreio, setSavingRastreio] = useState<string | null>(null);

  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ["pedidos"],
    queryFn: () => listar(),
    refetchInterval: 15000,
  });

  const buscaNorm = busca.trim().toLowerCase();
  const buscaLimpa = busca.replace(/\D/g, "");
  const dataFiltroBR = dataFiltro ? dataFiltro.split("-").reverse().join("/") : "";

  const filtrados = pedidos.filter((p: Pedido) => {
    if (filtro !== "todos" && p.status !== filtro) return false;
    if (buscaNorm) {
      const nomeMatch = p.cliente.toLowerCase().includes(buscaNorm);
      const idMatch = p.id.toLowerCase().includes(buscaNorm);
      const telMatch = p.telefone && p.telefone.replace(/\D/g, "").includes(buscaLimpa);
      
      if (!nomeMatch && !idMatch && !telMatch) return false;
    }
    if (dataFiltroBR && !p.data.startsWith(dataFiltroBR)) return false;
    return true;
  });

  async function mudarStatus(p: Pedido, status: "Concluído" | "Cancelado" | "Pendente") {
    await atualizar({
      data: {
        row: p.row,
        pedidoId: p.id,
        statusAtual: p.status,
        itensTexto: p.itens,
        status,
      },
    });
    qc.invalidateQueries({ queryKey: ["pedidos"] });
    qc.invalidateQueries({ queryKey: ["itens-vendidos"] });
    qc.invalidateQueries({ queryKey: ["perfumes"] });
  }

  async function salvarCodigo(p: Pedido) {
    const novo = (rastreioEdit[p.id] ?? p.rastreio ?? "").trim();
    if (novo === (p.rastreio ?? "").trim()) return;
    setSavingRastreio(p.id);
    try {
      await salvarRastreio({
        data: { row: p.row, pedidoId: p.id, rastreio: novo, rastreioAtual: p.rastreio ?? "" },
      });
      qc.invalidateQueries({ queryKey: ["pedidos"] });
    } finally {
      setSavingRastreio(null);
    }
  }


  return (
    <>
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

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          placeholder="Buscar por nº do pedido ou cliente"
          className="min-w-64 flex-1 rounded-lg border border-border/60 bg-background px-4 py-2 text-sm focus:border-gold focus:outline-none"
        />
        <input
          type="date"
          value={dataFiltro}
          onChange={(e) => setDataFiltro(e.target.value)}
          className="rounded-lg border border-border/60 bg-background px-4 py-2 text-sm focus:border-gold focus:outline-none"
        />
        {(busca || dataFiltro) && (
          <button
            onClick={() => {
              setBusca("");
              setDataFiltro("");
            }}
            className="text-xs uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground"
          >
            Limpar
          </button>
        )}
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
              <li key={p.id} className="rounded-2xl border border-border/60 bg-card p-5">
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
                <div className="mt-4 border-t border-border/40 pt-3">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                    Código de rastreio (Correios)
                  </label>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={rastreioEdit[p.id] ?? p.rastreio ?? ""}
                      onChange={(e) =>
                        setRastreioEdit((prev) => ({ ...prev, [p.id]: e.target.value }))
                      }
                      placeholder="Ex: BR123456789BR"
                      className="min-w-56 flex-1 rounded-lg border border-border/60 bg-background px-3 py-1.5 text-sm uppercase tracking-wider focus:border-gold focus:outline-none"
                    />
                    <button
                      onClick={() => salvarCodigo(p)}
                      disabled={savingRastreio === p.id}
                      className="rounded-full bg-gold px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50"
                    >
                      {savingRastreio === p.id ? "Salvando…" : "Salvar"}
                    </button>
                    {p.rastreio && (
                      <a
                        href={`https://rastreamento.correios.com.br/app/index.php?objeto=${encodeURIComponent(p.rastreio)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs uppercase tracking-[0.2em] text-gold hover:underline"
                      >
                        abrir Correios ↗
                      </a>
                    )}
                  </div>
                </div>
              </li>

            ))}
        </ul>
      )}
    </>
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
    <span
      className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${cls}`}
    >
      {status || "—"}
    </span>
  );
}

/* ---------------- Analytics ---------------- */

function AnalyticsTab() {
  const listar = useServerFn(listarItensVendidos);
  const listarPerfs = useServerFn(getPerfumes);

  const { data: itens = [], isLoading } = useQuery({
    queryKey: ["itens-vendidos"],
    queryFn: () => listar(),
    refetchInterval: 30000,
  });
  const { data: perfumes = [] } = useQuery({
    queryKey: ["perfumes"],
    queryFn: () => listarPerfs(),
  });

  const [periodo, setPeriodo] = useState<7 | 30 | 90 | 365>(30);

  const custoPorNome = useMemo(() => {
    const m = new Map<string, number>();
    perfumes.forEach((p) => m.set(p.nome, p.custo ?? 0));
    return m;
  }, [perfumes]);

  // Extrai DD/MM/YYYY do campo de data, robusto a vírgulas e NBSP do toLocaleString
  function parseData(s: string): Date | null {
    const m = s.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (!m) return null;
    return new Date(`${m[3]}-${m[2]}-${m[1]}T00:00:00`);
  }

  // filtra últimos N dias, ignora cancelados
  const filtrados = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - periodo);
    cutoff.setHours(0, 0, 0, 0);
    return itens.filter((it: ItemVendido) => {
      if (it.statusPedido === "Cancelado") return false;
      const dt = parseData(it.data);
      if (!dt) return true;
      return dt >= cutoff;
    });
  }, [itens, periodo]);

  const porDia = useMemo(() => {
    const m = new Map<string, { data: string; vendas: number; lucro: number; sortKey: number }>();
    filtrados.forEach((it) => {
      const dt = parseData(it.data);
      const dia = dt
        ? `${String(dt.getDate()).padStart(2, "0")}/${String(dt.getMonth() + 1).padStart(2, "0")}`
        : (it.data.match(/(\d{2}\/\d{2})/)?.[1] ?? it.data);
      const cur = m.get(dia) ?? {
        data: dia,
        vendas: 0,
        lucro: 0,
        sortKey: dt ? dt.getTime() : 0,
      };
      cur.vendas += it.subtotal;
      const custo = custoPorNome.get(it.perfume) ?? 0;
      cur.lucro += (it.precoUnit - custo) * it.qtd;
      m.set(dia, cur);
    });
    return Array.from(m.values())
      .sort((a, b) => a.sortKey - b.sortKey)
      .map(({ sortKey: _s, ...rest }) => rest);
  }, [filtrados, custoPorNome]);


  const porPerfume = useMemo(() => {
    const m = new Map<string, { nome: string; qtd: number; receita: number }>();
    filtrados.forEach((it) => {
      const cur = m.get(it.perfume) ?? { nome: it.perfume, qtd: 0, receita: 0 };
      cur.qtd += it.qtd;
      cur.receita += it.subtotal;
      m.set(it.perfume, cur);
    });
    return Array.from(m.values()).sort((a, b) => b.qtd - a.qtd).slice(0, 15);
  }, [filtrados]);

  // Índice de perfumes para joins
  const perfumePorNome = useMemo(() => {
    const m = new Map<string, Perfume>();
    perfumes.forEach((p) => m.set(p.nome.toLowerCase(), p));
    return m;
  }, [perfumes]);

  const porColecao = useMemo(() => {
    const m = new Map<string, { colecao: string; qtd: number; receita: number }>();
    COLECOES.forEach((c) => m.set(c, { colecao: c, qtd: 0, receita: 0 }));
    filtrados.forEach((it) => {
      const p = perfumePorNome.get(it.perfume.toLowerCase());
      const c = p?.colecao ?? "Signature";
      const cur = m.get(c) ?? { colecao: c, qtd: 0, receita: 0 };
      cur.qtd += it.qtd;
      cur.receita += it.subtotal;
      m.set(c, cur);
    });
    return Array.from(m.values());
  }, [filtrados, perfumePorNome]);

  const porVolume = useMemo(() => {
    const m = new Map<string, { volume: string; qtd: number; receita: number }>();
    filtrados.forEach((it) => {
      const p = perfumePorNome.get(it.perfume.toLowerCase());
      const v = p?.volume ?? "—";
      const cur = m.get(v) ?? { volume: v, qtd: 0, receita: 0 };
      cur.qtd += it.qtd;
      cur.receita += it.subtotal;
      m.set(v, cur);
    });
    return Array.from(m.values()).sort((a, b) => b.qtd - a.qtd);
  }, [filtrados, perfumePorNome]);

  const porGenero = useMemo(() => {
    const acc: Record<Genero, number> = { feminino: 0, masculino: 0, unissex: 0 };
    filtrados.forEach((it) => {
      const p = perfumePorNome.get(it.perfume.toLowerCase());
      if (!p) return;
      acc[p.genero] += it.qtd;
    });
    return acc;
  }, [filtrados, perfumePorNome]);
  const totalGenero = porGenero.feminino + porGenero.masculino + porGenero.unissex;

  const porEntrega = useMemo(() => {
    const acc = { pronta: 0, encomenda: 0, outros: 0 };
    filtrados.forEach((it) => {
      const p = perfumePorNome.get(it.perfume.toLowerCase());
      if (!p) return;
      if (p.disponibilidade === "Pronta Entrega") acc.pronta += it.qtd;
      else if (p.disponibilidade === "Sob Encomenda") acc.encomenda += it.qtd;
      else acc.outros += it.qtd;
    });
    return acc;
  }, [filtrados, perfumePorNome]);
  const totalEntrega = porEntrega.pronta + porEntrega.encomenda + porEntrega.outros;


  const totalVendas = porDia.reduce((a, b) => a + b.vendas, 0);
  const totalLucro = porDia.reduce((a, b) => a + b.lucro, 0);
  const totalUnidades = filtrados.reduce((a, b) => a + b.qtd, 0);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Carregando análise…</p>;
  }

  return (
    <>
      <div className="mb-6 flex flex-wrap items-center gap-2">
        {([7, 30, 90, 365] as const).map((n) => (
          <button
            key={n}
            onClick={() => setPeriodo(n)}
            className={`rounded-full px-4 py-1.5 text-xs uppercase tracking-wider transition ${
              periodo === n
                ? "bg-gold text-primary-foreground"
                : "border border-border/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            {n === 365 ? "1 ano" : `${n} dias`}
          </button>
        ))}
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <KpiCard label="Receita" value={formatBRL(totalVendas)} />
        <KpiCard label="Lucro estimado" value={formatBRL(totalLucro)} />
        <KpiCard label="Unidades vendidas" value={String(totalUnidades)} />
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-5">
        <h3 className="mb-4 font-display text-lg">Vendas e lucro por dia</h3>
        <div className="h-72 w-full">
          <ResponsiveContainer>
            <LineChart data={porDia}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
              <XAxis dataKey="data" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                }}
                formatter={(v: number) => formatBRL(v)}
              />
              <Legend />
              <Line type="monotone" dataKey="vendas" name="Receita" stroke="#D4AF37" strokeWidth={2} />
              <Line type="monotone" dataKey="lucro" name="Lucro" stroke="#10b981" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border/60 bg-card p-6">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h3 className="font-display text-lg">Top perfumes</h3>
            <p className="text-xs text-muted-foreground">
              Ranking por unidades vendidas no período
            </p>
          </div>
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {porPerfume.length} itens
          </span>
        </div>

        {porPerfume.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Nenhuma venda registrada neste período.
          </p>
        ) : (
          <ol className="space-y-2">
            {porPerfume.map((p, i) => {
              const max = porPerfume[0]?.qtd || 1;
              const pct = Math.max(6, Math.round((p.qtd / max) * 100));
              const medal =
                i === 0
                  ? "bg-gradient-to-br from-gold to-amber-600 text-primary-foreground shadow-[0_0_20px_-4px_rgba(212,175,55,0.6)]"
                  : i === 1
                    ? "bg-zinc-300/90 text-zinc-900"
                    : i === 2
                      ? "bg-amber-800/80 text-amber-50"
                      : "bg-border/60 text-foreground";
              return (
                <li
                  key={p.nome}
                  className="group relative overflow-hidden rounded-xl border border-border/40 bg-background/40 px-4 py-3 transition hover:border-gold/40"
                >
                  <div
                    aria-hidden
                    className="absolute inset-y-0 left-0 -z-0 bg-gradient-to-r from-gold/20 via-gold/10 to-transparent transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                  <div className="relative z-10 flex items-center gap-4">
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-xs font-bold ${medal}`}
                    >
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{p.nome}</p>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">
                        {formatBRL(p.receita)} em receita
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-xl font-semibold text-gold tabular-nums">
                        {p.qtd}
                      </p>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {p.qtd === 1 ? "unidade" : "unidades"}
                      </p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <h3 className="mb-4 font-display text-lg">Vendas por coleção</h3>
          {porColecao.every((c) => c.qtd === 0) ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Sem vendas.</p>
          ) : (
            <ul className="space-y-2">
              {porColecao.map((c) => {
                const max = Math.max(...porColecao.map((x) => x.qtd), 1);
                const pct = Math.round((c.qtd / max) * 100);
                return (
                  <li key={c.colecao} className="relative overflow-hidden rounded-lg border border-border/40 px-3 py-2">
                    <div aria-hidden className="absolute inset-y-0 left-0 -z-0 bg-gold/15" style={{ width: `${pct}%` }} />
                    <div className="relative z-10 flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium">{c.colecao}</span>
                      <span className="tabular-nums text-muted-foreground">
                        <b className="text-gold">{c.qtd}</b> un · {formatBRL(c.receita)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <h3 className="mb-4 font-display text-lg">Vendas por volume</h3>
          {porVolume.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Sem vendas.</p>
          ) : (
            <ul className="space-y-2">
              {porVolume.map((v) => {
                const max = porVolume[0].qtd || 1;
                const pct = Math.round((v.qtd / max) * 100);
                return (
                  <li key={v.volume} className="relative overflow-hidden rounded-lg border border-border/40 px-3 py-2">
                    <div aria-hidden className="absolute inset-y-0 left-0 -z-0 bg-emerald-500/15" style={{ width: `${pct}%` }} />
                    <div className="relative z-10 flex items-center justify-between gap-3 text-sm">
                      <span className="font-medium">{v.volume}</span>
                      <span className="tabular-nums text-muted-foreground">
                        <b className="text-emerald-400">{v.qtd}</b> un · {formatBRL(v.receita)}
                      </span>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border/60 bg-card p-5">
        <h3 className="mb-4 font-display text-lg">Distribuição por gênero</h3>
        {totalGenero === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Sem vendas no período.</p>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-8">
            <GenderDonut data={porGenero} total={totalGenero} />
            <ul className="space-y-2 text-sm">
              {(
                [
                  ["feminino", "Feminino", "#f472b6"],
                  ["masculino", "Masculino", "#38bdf8"],
                  ["unissex", "Unissex", "#a78bfa"],
                ] as const
              ).map(([k, label, color]) => (
                <li key={k} className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full" style={{ background: color }} />
                  <span className="w-24">{label}</span>
                  <b style={{ color }}>{porGenero[k]}</b>
                  <span className="text-muted-foreground">
                    ({Math.round((porGenero[k] / totalGenero) * 100)}%)
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="mt-6 rounded-2xl border border-border/60 bg-card p-5">
        <h3 className="mb-4 font-display text-lg">Pronta entrega vs Sob encomenda</h3>
        {totalEntrega === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Sem vendas no período.</p>
        ) : (
          <ul className="space-y-2">
            {(
              [
                ["pronta", "Pronta entrega", "#10b981"],
                ["encomenda", "Sob encomenda", "#f59e0b"],
                ["outros", "Sem marcação", "#94a3b8"],
              ] as const
            ).map(([k, label, color]) => {
              const v = porEntrega[k];
              const pct = Math.round((v / totalEntrega) * 100);
              return (
                <li key={k} className="relative overflow-hidden rounded-lg border border-border/40 px-3 py-2">
                  <div aria-hidden className="absolute inset-y-0 left-0 -z-0" style={{ width: `${pct}%`, background: `${color}25` }} />
                  <div className="relative z-10 flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2 font-medium">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
                      {label}
                    </span>
                    <span className="tabular-nums text-muted-foreground">
                      <b style={{ color }}>{v}</b> un · {pct}%
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>




    </>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-2 font-display text-2xl font-semibold text-gold">{value}</p>
    </div>
  );
}

function GenderDonut({
  data,
  total,
}: {
  data: Record<Genero, number>;
  total: number;
}) {
  const size = 180;
  const r = 70;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * r;
  const segments: Array<{ key: Genero; color: string; value: number }> = [
    { key: "feminino", color: "#f472b6", value: data.feminino },
    { key: "masculino", color: "#38bdf8", value: data.masculino },
    { key: "unissex", color: "#a78bfa", value: data.unissex },
  ];
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="hsl(var(--border))" strokeWidth={22} opacity={0.3} />
      {segments.map((s) => {
        if (s.value === 0) return null;
        const len = (s.value / total) * circ;
        const dasharray = `${len} ${circ - len}`;
        const el = (
          <circle
            key={s.key}
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={22}
            strokeDasharray={dasharray}
            strokeDashoffset={-offset}
          />
        );
        offset += len;
        return el;
      })}
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        transform={`rotate(90 ${cx} ${cy})`}
        className="fill-foreground font-display"
        fontSize={22}
        fontWeight={600}
      >
        {total}
      </text>
    </svg>
  );
}


/* ---------------- Perfumes CRUD ---------------- */

function PerfumesTab() {
  const listar = useServerFn(getPerfumes);
  const atualizar = useServerFn(atualizarPerfume);
  const criar = useServerFn(criarPerfume);
  const aplicarCustos = useServerFn(aplicarCustosPadrao);
  const excluir = useServerFn(excluirPerfume);
  const qc = useQueryClient();

  const { data: perfumes = [], isLoading } = useQuery({
    queryKey: ["perfumes"],
    queryFn: () => listar(),
  });

  const [editando, setEditando] = useState<string | null>(null);
  const [criando, setCriando] = useState(false);
  const [colTab, setColTab] = useState<Colecao>("Signature");
  const [busca, setBusca] = useState("");
  const [marca, setMarca] = useState<string>("todas");

  const marcas = Array.from(
    new Set(perfumes.map((p) => p.marca).filter((m): m is string => !!m)),
  ).sort();
  const nomes = Array.from(new Set(perfumes.map((p) => p.nome))).sort();
  const buscaNorm = busca.trim().toLowerCase();
  const filtrados = perfumes.filter((p) => {
    if (p.colecao !== colTab) return false;
    if (marca !== "todas" && p.marca !== marca) return false;
    if (buscaNorm && !p.nome.toLowerCase().includes(buscaNorm)) return false;
    return true;
  });
  const countCol = (c: Colecao) => perfumes.filter((p) => p.colecao === c).length;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {COLECOES.map((c) => (
          <button
            key={c}
            onClick={() => setColTab(c)}
            className={`rounded-full px-4 py-1.5 text-xs uppercase tracking-wider transition ${
              colTab === c
                ? "bg-gold text-primary-foreground"
                : "border border-border/60 text-muted-foreground hover:text-foreground"
            }`}
          >
            {c} ({countCol(c)})
          </button>
        ))}
        <div className="relative ml-auto">
          <svg
            aria-hidden
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por nome…"
            className="w-48 rounded-full border border-border/60 bg-background py-1.5 pl-8 pr-3 text-xs outline-none focus:border-gold"
          />
        </div>
        <select
          value={marca}
          onChange={(e) => setMarca(e.target.value)}
          style={{ colorScheme: "dark" }}
          className="rounded-full border border-border/60 bg-background px-3 py-1.5 text-xs text-foreground outline-none focus:border-gold"
          aria-label="Filtrar por marca"
        >
          <option value="todas">Todas as marcas</option>
          {marcas.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-lg">
          {colTab} ({filtrados.length})
          {COLECAO_INFO[colTab].sobEncomenda && ( // Manter lógica de coleção (Dream/Brand/Arabic = por encomenda por padrão)
            <span className="ml-2 rounded-full bg-amber-500/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-amber-400">
              Sob encomenda (padrão)
            </span>
          )}
        </h2>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={async () => {
              const sobrescrever = window.confirm(
                "Aplicar custos padrão a TODOS os perfumes?\n\n" +
                  "Signature 50ml = R$17 | 100ml = R$19\n" +
                  "Brand Collection = R$45 | Arabic = R$60\n" +
                  "Dream Brand = R$120\n\n" +
                  "OK = sobrescrever custos existentes\n" +
                  "Cancelar = apenas preencher os vazios",
              );
              const r = await aplicarCustos({ data: { sobrescrever } });
              await qc.invalidateQueries({ queryKey: ["perfumes"] });
              alert(`Custos aplicados: ${r.atualizados} atualizados, ${r.pulados} pulados.`);
            }}
            className="rounded-full border border-border/60 px-4 py-1.5 text-xs uppercase tracking-wider text-muted-foreground hover:border-gold hover:text-gold"
          >
            Aplicar custos padrão
          </button>
          <button
            onClick={() => setCriando((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-full bg-gold px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary-foreground transition hover:brightness-110"
          >
            <span className="text-base leading-none">+</span>
            {criando ? "Fechar" : "Novo perfume"}
          </button>
        </div>
      </div>
      {criando && (
        <div className="mb-4 rounded-2xl border border-gold/40 bg-card p-4">
          <p className="mb-3 text-xs uppercase tracking-[0.2em] text-gold">
            Adicionar novo perfume
          </p>
          <EditForm
            marcasSugestoes={marcas}
            nomesSugestoes={nomes}
            perfume={{
              id: "",
              nome: "",
              numero: null,
              emEstoque: false,
              status: "",
              imagem: null,
              descricao: "",
              genero: "masculino",
              volume: COLECAO_INFO[colTab].defaultVolume,
              marca: null,
              preco: null,
              custo: null,
              amount: null,
              colecao: colTab,
              lowThreshold: null,
              oosThreshold: null,
              disponibilidade: "Sob Encomenda",
              notasTopo: "",
              notasCoracao: "",
              notasFundo: "",
              volumesSignature: [],
            }}
            onCancel={() => setCriando(false)}
            onSave={async (patch) => {
              if (!patch.nome || !patch.nome.trim()) {
                throw new Error("Nome é obrigatório");
              }
              await criar({
                data: {
                  nome: patch.nome.trim(),
                  descricao: patch.descricao,
                  preco: patch.preco ?? null,
                  custo: patch.custo ?? null,
                  amount: patch.amount ?? null,
                  volume: patch.volume ?? COLECAO_INFO[colTab].defaultVolume,
                  marca: patch.marca ?? null,
                  imagemUrl: patch.imagemUrl ?? null,
                  colecao: patch.colecao ?? colTab,
                  genero: patch.genero,
                  lowThreshold: patch.lowThreshold ?? null,
                  oosThreshold: patch.oosThreshold ?? null,
                  notasTopo: patch.notasTopo,
                  notasCoracao: patch.notasCoracao,
                  notasFundo: patch.notasFundo,
                  volumesSignature: patch.volumesSignature,
                },
              });
              await qc.invalidateQueries({ queryKey: ["perfumes"] });
              setCriando(false);
            }}
          />
        </div>
      )}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : (
        <ul className="grid gap-3 md:grid-cols-2">
          {filtrados.map((p) => (
            <li key={p.id} className="rounded-2xl border border-border/60 bg-card p-4">
              {editando === p.id ? (
                <EditForm
                  perfume={p}
                  marcasSugestoes={marcas}
                  nomesSugestoes={nomes}
                  onCancel={() => setEditando(null)}
                  onSave={async (patch) => {
                    await atualizar({ data: { id: p.id, ...patch } });
                    await qc.invalidateQueries({ queryKey: ["perfumes"] });
                    setEditando(null);
                  }}
                />
              ) : (
                <div className="flex gap-3">
                  {p.imagem && (
                    <img
                      src={p.imagem}
                      alt={p.nome}
                      className="h-20 w-20 rounded-lg object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold">{formatarNumeroPerfume(p.numero)} · {p.nome}</p>
                      <span className="rounded-full bg-gold/15 px-2.5 py-1 text-sm font-bold uppercase tracking-wider text-gold">
                        {p.volume}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wider ${
                          p.genero === "feminino"
                            ? "bg-pink-500/15 text-pink-300"
                            : "bg-sky-500/15 text-sky-300"
                        }`}
                      >
                        {p.genero}
                      </span>
                      {p.marca && (
                        <span className="rounded-full border border-border/60 px-2 py-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                          {p.marca}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {p.descricao || "Sem descrição"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                      <span>
                        Preço:{" "}
                        <b className="text-gold">
                          {p.preco != null ? formatBRL(p.preco) : "—"}
                        </b>
                      </span>
                      <span>
                        Custo:{" "}
                        <b>{p.custo != null ? formatBRL(p.custo) : "—"}</b>
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <span>
                          Estoque: <b>{p.amount ?? "—"}</b>
                        </span>
                        {estoqueAlerta(p) !== "ok" && (
                          <EstoqueBadge nivel={estoqueAlerta(p) as "low" | "out"} />
                        )}
                      </span>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        onClick={() => setEditando(p.id)}
                        className="rounded-full border border-border/60 px-3 py-1 text-xs uppercase tracking-wider hover:border-gold hover:text-gold"
                      >
                        Editar
                      </button>
                      <button
                        onClick={async () => {
                          await criar({
                            data: {
                              nome: `${p.nome} (cópia)`,
                              descricao: p.descricao,
                              preco: p.preco,
                              custo: p.custo,
                              amount: 0,
                              volume: p.volume,
                              marca: p.marca,
                              imagemUrl: p.imagem,
                              colecao: p.colecao,
                              genero: p.genero,
                              lowThreshold: p.lowThreshold,
                              oosThreshold: p.oosThreshold,
                              notasTopo: p.notasTopo,
                              notasCoracao: p.notasCoracao,
                              notasFundo: p.notasFundo,
                              volumesSignature: p.volumesSignature,
                            },
                          });
                          await qc.invalidateQueries({ queryKey: ["perfumes"] });
                        }}
                        className="rounded-full border border-border/60 px-3 py-1 text-xs uppercase tracking-wider text-muted-foreground hover:border-gold hover:text-gold"
                        title="Cria um novo perfume com os mesmos dados (estoque zerado)"
                      >
                        Duplicar
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm(`Excluir "${p.nome}"? Essa ação arquiva o perfume no Notion.`)) return;
                          await excluir({ data: { id: p.id } });
                          await qc.invalidateQueries({ queryKey: ["perfumes"] });
                        }}
                        className="rounded-full border border-red-500/40 px-3 py-1 text-xs uppercase tracking-wider text-red-400 hover:border-red-500 hover:bg-red-500/10"
                        title="Arquiva o perfume no Notion (pode ser restaurado por lá)"
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

// Base de perfumes conhecidos para autopreenchimento (marca + gênero + descrição básica)
const CATALOGO_CONHECIDO: Record<
  string,
  { marca: string; genero: Genero; descricao?: string }
> = {
  "Angel": { marca: "Mugler", genero: "feminino", descricao: "Doce, patchouli e chocolate." },
  "Yara": { marca: "Lattafa", genero: "feminino", descricao: "Baunilha, orquídea e sândalo." },
  "La Vie Est Belle": { marca: "Lancôme", genero: "feminino", descricao: "Íris, patchouli e baunilha." },
  "Good Girl": { marca: "Carolina Herrera", genero: "feminino", descricao: "Tuberosa, jasmim e cacau." },
  "Éclair": { marca: "Lattafa", genero: "feminino" },
  "Scandal": { marca: "Jean Paul Gaultier", genero: "feminino" },
  "212 VIP Rosé": { marca: "Carolina Herrera", genero: "feminino" },
  "Fantasy": { marca: "Britney Spears", genero: "feminino" },
  "212 VIP - This is a Private Party!": { marca: "Carolina Herrera", genero: "masculino" },
  "1 Million": { marca: "Paco Rabanne", genero: "masculino" },
  "Al Noble Wazeer": { marca: "Lattafa", genero: "masculino" },
  "212 VIP Men": { marca: "Carolina Herrera", genero: "masculino" },
  "Asad": { marca: "Lattafa", genero: "masculino" },
  "Only the Brave": { marca: "Diesel", genero: "masculino" },
  "Acqua di Giò": { marca: "Giorgio Armani", genero: "masculino" },
  "212 VIP Black - Own the Party NYC": { marca: "Carolina Herrera", genero: "masculino" },
};

function EditForm({
  perfume,
  onSave,
  onCancel,
  marcasSugestoes = [],
  nomesSugestoes = [],
}: {
  perfume: Perfume;
  onSave: (patch: {
    numero?: number | null;
    nome?: string;
    descricao?: string;
    preco?: number | null;
    custo?: number | null;
    amount?: number | null;
    volume?: Volume;
    marca?: string | null;
    imagemUrl?: string | null;
    colecao?: Colecao;
    genero?: Genero;
    lowThreshold?: number | null;
    oosThreshold?: number | null;
    notasTopo?: string;
    notasCoracao?: string;
    notasFundo?: string;
    volumesSignature?: Volume[];
  }) => Promise<void>;
  onCancel: () => void;
  marcasSugestoes?: string[];
  nomesSugestoes?: string[];
}) {
  const [numero, setNumero] = useState(perfume.numero?.toString() ?? "");
  const [nome, setNome] = useState(perfume.nome);
  const [descricao, setDescricao] = useState(perfume.descricao);
  const [preco, setPreco] = useState(perfume.preco?.toString() ?? "");
  const [custo, setCusto] = useState(perfume.custo?.toString() ?? "");
  const [amount, setAmount] = useState(perfume.amount?.toString() ?? "");
  const [colecao, setColecao] = useState<Colecao>(perfume.colecao);
  const [volume, setVolume] = useState<Volume>(perfume.volume);
  const [marca, setMarca] = useState(perfume.marca ?? "");
  const [genero, setGenero] = useState<Genero>(perfume.genero);
  const [imagemUrl, setImagemUrl] = useState("");
  const [lowThreshold, setLowThreshold] = useState(perfume.lowThreshold?.toString() ?? "");
  const [oosThresholdInput, setOosThresholdInput] = useState(perfume.oosThreshold?.toString() ?? "");
  
  // A disponibilidade agora é automática via fórmula no Notion baseada no amount.
  const currentAmount = amount === "" ? 0 : parseInt(amount, 10);
  const currentOoS = oosThresholdInput === "" ? 0 : parseInt(oosThresholdInput, 10);
  const isProntaEntrega = currentAmount > currentOoS;
  const isSobEncomenda = currentAmount <= currentOoS;
  const [notasTopo, setNotasTopo] = useState(perfume.notasTopo);
  const [notasCoracao, setNotasCoracao] = useState(perfume.notasCoracao);
  const [notasFundo, setNotasFundo] = useState(perfume.notasFundo);
  const [volumesSignature, setVolumesSignature] = useState<Volume[]>(perfume.volumesSignature || []);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const volumesDisponiveis = COLECAO_INFO[colecao].volumes;
  // se trocar coleção e o volume atual não for válido, ajusta
  const volumeEfetivo = volumesDisponiveis.includes(volume)
    ? volume
    : COLECAO_INFO[colecao].defaultVolume;

  function aplicarAutocomplete(v: string) {
    setNome(v);
    const chave = Object.keys(CATALOGO_CONHECIDO).find(
      (k) => k.toLowerCase() === v.trim().toLowerCase(),
    );
    if (chave) {
      const info = CATALOGO_CONHECIDO[chave];
      if (!marca.trim()) setMarca(info.marca);
      setGenero(info.genero);
      if (!descricao.trim() && info.descricao) setDescricao(info.descricao);
    }
  }

  async function salvar() {
    setSalvando(true);
    setErro(null);
    try {
      const patch: Parameters<typeof onSave>[0] = {
        numero: numero === "" ? null : parseInt(numero, 10),
        nome,
        descricao,
        preco: preco === "" ? null : parseFloat(preco.replace(",", ".")),
        custo: custo === "" ? null : parseFloat(custo.replace(",", ".")),
        amount: amount === "" ? null : parseInt(amount, 10),
        volume: volumeEfetivo,
        marca: marca.trim() === "" ? null : marca.trim(),
        colecao,
        genero,
        lowThreshold: lowThreshold === "" ? null : parseInt(lowThreshold, 10),
        oosThreshold: oosThresholdInput === "" ? null : parseInt(oosThresholdInput, 10),
        notasTopo,
        notasCoracao,
        notasFundo,
        volumesSignature,
      };
      if (imagemUrl.trim()) patch.imagemUrl = imagemUrl.trim();
      await onSave(patch);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="space-y-3">
      <Field label="Número Permanente (ex: 001)">
        <input
          value={numero}
          onChange={(e) => setNumero(e.target.value)}
          placeholder="Deixe vazio para gerar automático"
          className="input"
          inputMode="numeric"
        />
      </Field>
      <Field label="Nome">
        <input
          value={nome}
          onChange={(e) => aplicarAutocomplete(e.target.value)}
          list="lista-nomes"
          className="input"
        />
        <datalist id="lista-nomes">
          {Array.from(new Set([...nomesSugestoes, ...Object.keys(CATALOGO_CONHECIDO)])).map((n) => (
            <option key={n} value={n} />
          ))}
        </datalist>
      </Field>
      <Field label="Descrição">
        <textarea
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={3}
          className="input resize-none"
        />
      </Field>
      <div className="grid grid-cols-3 gap-2">
        <Field label="Preço (R$)">
          <input
            value={preco}
            onChange={(e) => setPreco(e.target.value)}
            className="input"
            inputMode="decimal"
          />
        </Field>
        <Field label="Custo (R$)">
          <input
            value={custo}
            onChange={(e) => setCusto(e.target.value)}
            className="input"
            inputMode="decimal"
          />
        </Field>
        <Field label="Estoque">
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input"
            inputMode="numeric"
          />
        </Field>
      </div>
      <Field label="Coleção">
        <select
          value={colecao}
          onChange={(e) => {
            const nova = e.target.value as Colecao;
            setColecao(nova);
          }}
          style={{ colorScheme: "dark" }}
          className="input"
        >
          {COLECOES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </Field>
      <Field label={`Volume (${volumesDisponiveis.join(" ou ")})`}>
        <div className="flex flex-wrap gap-2">
          {volumesDisponiveis.map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setVolume(v)}
              className={`rounded-full px-4 py-1.5 text-xs uppercase tracking-wider transition ${
                volumeEfetivo === v
                  ? "bg-gold text-primary-foreground"
                  : "border border-border/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </Field>
      {colecao === "Signature" && (
        <Field label="Volumes disponíveis (Signature)">
          <div className="flex flex-wrap gap-2">
            {(["50ml", "100ml"] as Volume[]).map((v) => {
              const selected = volumesSignature.includes(v);
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    if (selected) {
                      setVolumesSignature(volumesSignature.filter((i) => i !== v));
                    } else {
                      setVolumesSignature([...volumesSignature, v]);
                    }
                  }}
                  className={`rounded-full px-4 py-1.5 text-xs uppercase tracking-wider transition ${
                    selected
                      ? "bg-gold text-primary-foreground"
                      : "border border-border/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {v}
                </button>
              );
            })}
          </div>
        </Field>
      )}
      <Field label="Gênero">
        <div className="flex flex-wrap gap-2">
          {(["feminino", "masculino", "unissex"] as const).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setGenero(g)}
              className={`rounded-full px-4 py-1.5 text-xs uppercase tracking-wider capitalize transition ${
                genero === g
                  ? "bg-gold text-primary-foreground"
                  : "border border-border/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="Low threshold">
          <input
            value={lowThreshold}
            onChange={(e) => setLowThreshold(e.target.value)}
            className="input"
            inputMode="numeric"
            placeholder="Ex.: 3"
          />
        </Field>
        <Field label="OoS threshold">
          <input
            value={oosThresholdInput}
            onChange={(e) => setOosThresholdInput(e.target.value)}
            className="input"
            inputMode="numeric"
            placeholder="Ex.: 0"
          />
        </Field>
      </div>
      <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
        isSobEncomenda 
          ? "border-amber-500/50 bg-amber-500/10 text-amber-400" 
          : "border-border/40 bg-background/40 text-muted-foreground opacity-50"
      }`}>
        <div className={`flex h-4 w-4 items-center justify-center rounded border ${isSobEncomenda ? "bg-gold border-gold" : "border-border"}`}>
          {isSobEncomenda && <svg className="h-3 w-3 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M20 6L9 17l-5-5"/></svg>}
        </div>
        <span>
          <b className={isSobEncomenda ? "text-amber-400" : ""}>Sob encomenda</b>
          <span className="ml-2 text-xs">
            {isSobEncomenda ? "(Ativado pelo estoque zero)" : "(Desativado pelo estoque atual)"}
          </span>
        </span>
      </div>
      <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
        isProntaEntrega 
          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-400" 
          : "border-border/40 bg-background/40 text-muted-foreground opacity-50"
      }`}>
        <div className={`flex h-4 w-4 items-center justify-center rounded border ${isProntaEntrega ? "bg-gold border-gold" : "border-border"}`}>
          {isProntaEntrega && <svg className="h-3 w-3 text-primary-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4"><path d="M20 6L9 17l-5-5"/></svg>}
        </div>
        <span>
          <b className={isProntaEntrega ? "text-emerald-400" : ""}>Pronta entrega</b>
          <span className="ml-2 text-xs">
            {isProntaEntrega ? "(Ativado pelo estoque disponível)" : "(Desativado pelo estoque zero)"}
          </span>
        </span>
      </div>
      <div className="rounded-lg border border-border/60 bg-background/40 p-3">
        <p className="mb-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          Pirâmide olfativa
        </p>
        <div className="grid gap-2 sm:grid-cols-3">
          <Field label="Topo">
            <input
              value={notasTopo}
              onChange={(e) => setNotasTopo(e.target.value)}
              placeholder="Bergamota, limão…"
              className="input"
            />
          </Field>
          <Field label="Coração">
            <input
              value={notasCoracao}
              onChange={(e) => setNotasCoracao(e.target.value)}
              placeholder="Jasmim, rosa…"
              className="input"
            />
          </Field>
          <Field label="Fundo">
            <input
              value={notasFundo}
              onChange={(e) => setNotasFundo(e.target.value)}
              placeholder="Sândalo, âmbar…"
              className="input"
            />
          </Field>
        </div>
      </div>
      <Field label="Marca">
        <input
          value={marca}
          onChange={(e) => setMarca(e.target.value)}
          list="lista-marcas"
          placeholder="Ex.: Carolina Herrera"
          className="input"
        />
        <datalist id="lista-marcas">
          {Array.from(new Set([
            ...marcasSugestoes,
            ...Object.values(CATALOGO_CONHECIDO).map((c) => c.marca),
          ])).map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
      </Field>
      <Field label="Nova imagem (URL, opcional)">
        <input
          value={imagemUrl}
          onChange={(e) => setImagemUrl(e.target.value)}
          placeholder="https://…"
          className="input"
        />
      </Field>
      {erro && <p className="text-xs text-destructive">{erro}</p>}
      <div className="flex gap-2 pt-2">
        <button
          onClick={salvar}
          disabled={salvando}
          className="rounded-full bg-gold px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:brightness-110 disabled:opacity-50"
        >
          {salvando ? "Salvando…" : "Salvar"}
        </button>
        <button
          onClick={onCancel}
          className="rounded-full border border-border/60 px-4 py-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          Cancelar
        </button>
      </div>
      <style>{`.input{width:100%;border-radius:.5rem;border:1px solid hsl(var(--border)/.6);background:hsl(var(--background));padding:.5rem .75rem;font-size:.875rem}.input:focus{outline:none;border-color:#D4AF37}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

/* ---------------- Funcionários (dono) ---------------- */

function FuncionariosTab() {
  const listar = useServerFn(listarFuncionarios);
  const criar = useServerFn(criarFuncionario);
  const atualizar = useServerFn(atualizarFuncionario);
  const remover = useServerFn(removerFuncionario);
  const qc = useQueryClient();

  const { data: funcs = [], isLoading } = useQuery({
    queryKey: ["funcionarios"],
    queryFn: () => listar(),
  });

  const [criando, setCriando] = useState(false);
  const [novo, setNovo] = useState({
    nome: "",
    login: "",
    password: "",
    role: "vendedor" as "dono" | "gerente" | "vendedor",
  });
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [novaSenha, setNovaSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);

  async function submitNovo(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    try {
      await criar({ data: { ...novo, ativo: true } });
      setNovo({ nome: "", login: "", password: "", role: "vendedor" });
      setCriando(false);
      await qc.invalidateQueries({ queryKey: ["funcionarios"] });
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao criar");
    }
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg">Funcionários</h2>
          <p className="text-xs text-muted-foreground">
            Login individual, senhas criptografadas. Dono tem acesso total; gerente vê tudo menos esta aba; vendedor futuramente restrito.
          </p>
        </div>
        <button
          onClick={() => setCriando((v) => !v)}
          className="rounded-full bg-gold px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary-foreground hover:brightness-110"
        >
          {criando ? "Fechar" : "+ Novo"}
        </button>
      </div>

      {criando && (
        <form
          onSubmit={submitNovo}
          className="mb-6 grid gap-3 rounded-2xl border border-gold/40 bg-card p-4 sm:grid-cols-2"
        >
          <label className="block text-xs">
            <span className="uppercase tracking-wider text-muted-foreground">Nome</span>
            <input
              value={novo.nome}
              onChange={(e) => setNovo({ ...novo, nome: e.target.value })}
              required
              className="mt-1 w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs">
            <span className="uppercase tracking-wider text-muted-foreground">Login</span>
            <input
              value={novo.login}
              onChange={(e) => setNovo({ ...novo, login: e.target.value })}
              required
              autoComplete="off"
              className="mt-1 w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs">
            <span className="uppercase tracking-wider text-muted-foreground">Senha</span>
            <input
              type="password"
              value={novo.password}
              onChange={(e) => setNovo({ ...novo, password: e.target.value })}
              required
              minLength={6}
              autoComplete="new-password"
              className="mt-1 w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs">
            <span className="uppercase tracking-wider text-muted-foreground">Nível</span>
            <select
              value={novo.role}
              onChange={(e) =>
                setNovo({ ...novo, role: e.target.value as typeof novo.role })
              }
              style={{ colorScheme: "dark" }}
              className="mt-1 w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm text-foreground"
            >
              <option value="vendedor">Vendedor</option>
              <option value="gerente">Gerente</option>
              <option value="dono">Dono</option>
            </select>
          </label>
          {erro && <p className="text-xs text-destructive sm:col-span-2">{erro}</p>}
          <div className="flex justify-end sm:col-span-2">
            <button
              type="submit"
              className="rounded-full bg-gold px-5 py-2 text-xs font-semibold uppercase tracking-wider text-primary-foreground"
            >
              Criar
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando…</p>
      ) : funcs.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nenhum funcionário cadastrado ainda. O login do dono continua funcionando via senha do sistema.
        </p>
      ) : (
        <ul className="space-y-3">
          {funcs.map((f) => (
            <li
              key={f.id}
              className="rounded-2xl border border-border/60 bg-card p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold">
                    {f.nome}{" "}
                    <span className="ml-1 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-gold">
                      {f.role}
                    </span>
                    {!f.ativo && (
                      <span className="ml-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[10px] uppercase tracking-wider text-red-400">
                        inativo
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Login: <b>{f.login || "—"}</b>
                    {f.ultimoAcesso && (
                      <>
                        {" · "}último acesso:{" "}
                        {new Date(f.ultimoAcesso).toLocaleString("pt-BR", {
                          timeZone: "America/Sao_Paulo",
                        })}
                      </>
                    )}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={f.role}
                    onChange={async (e) => {
                      await atualizar({
                        data: {
                          id: f.id,
                          role: e.target.value as "dono" | "gerente" | "vendedor",
                        },
                      });
                      await qc.invalidateQueries({ queryKey: ["funcionarios"] });
                    }}
                    style={{ colorScheme: "dark" }}
                    className="rounded-full border border-border/60 bg-background px-3 py-1 text-xs text-foreground"
                  >
                    <option value="vendedor">Vendedor</option>
                    <option value="gerente">Gerente</option>
                    <option value="dono">Dono</option>
                  </select>
                  <button
                    onClick={async () => {
                      await atualizar({ data: { id: f.id, ativo: !f.ativo } });
                      await qc.invalidateQueries({ queryKey: ["funcionarios"] });
                    }}
                    className="rounded-full border border-border/60 px-3 py-1 text-xs uppercase tracking-wider text-muted-foreground hover:text-foreground"
                  >
                    {f.ativo ? "Desativar" : "Ativar"}
                  </button>
                  <button
                    onClick={() => {
                      setEditandoId(editandoId === f.id ? null : f.id);
                      setNovaSenha("");
                    }}
                    className="rounded-full border border-border/60 px-3 py-1 text-xs uppercase tracking-wider text-muted-foreground hover:text-gold"
                  >
                    Trocar senha
                  </button>
                  <button
                    onClick={async () => {
                      if (!confirm(`Remover ${f.nome}?`)) return;
                      await remover({ data: { id: f.id } });
                      await qc.invalidateQueries({ queryKey: ["funcionarios"] });
                    }}
                    className="rounded-full border border-border/60 px-3 py-1 text-xs uppercase tracking-wider text-muted-foreground hover:border-destructive hover:text-destructive"
                  >
                    Remover
                  </button>
                </div>
              </div>
              {editandoId === f.id && (
                <div className="mt-3 flex gap-2">
                  <input
                    type="password"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    placeholder="Nova senha (mín. 6)"
                    minLength={6}
                    className="flex-1 rounded-lg border border-border/60 bg-background px-3 py-2 text-sm"
                  />
                  <button
                    onClick={async () => {
                      if (novaSenha.length < 6) return;
                      await atualizar({ data: { id: f.id, password: novaSenha } });
                      setEditandoId(null);
                      setNovaSenha("");
                    }}
                    className="rounded-full bg-gold px-4 py-2 text-xs font-semibold uppercase tracking-wider text-primary-foreground"
                  >
                    Salvar
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}



function CalculadoraTab() {
  return (
    <div className="mx-auto max-w-3xl">
      <span className="text-[11px] uppercase tracking-[0.25em] text-gold">Interno</span>
      <h1 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">Calculadora de pedido</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Cole a mensagem do WhatsApp. O sistema identifica os perfumes e calcula o total.
        Também disponível em <a href="/calculadora" className="text-gold underline">/calculadora</a>.
      </p>
      <div className="mt-8">
        <Suspense fallback={<div className="text-muted-foreground">Carregando…</div>}>
          <CalculadoraPanel />
        </Suspense>
      </div>
    </div>
  );
}
