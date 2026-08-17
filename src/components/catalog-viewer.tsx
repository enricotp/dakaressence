import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { formatBRL } from "@/lib/format";
import { useWishlist } from "@/lib/wishlist-context";
import { useCart } from "@/lib/cart-context";
import { COLECOES, COLECAO_INFO, type Colecao, type Volume, type Perfume } from "@/lib/perfumes.functions";

interface CatalogViewerProps {
  perfumes: Perfume[];
}

export function CatalogViewer({ perfumes }: CatalogViewerProps) {
  const { cart, add, remove } = useCart();
  const wishlist = useWishlist();
  const [soFavoritos, setSoFavoritos] = useState(false);
  const [disponibilidade, setDisponibilidade] = useState<"todos" | "pronta" | "encomenda">("todos");
  const [filtro, setFiltro] = useState<"todos" | "feminino" | "masculino">("todos");
  const [busca, setBusca] = useState("");
  const [marca, setMarca] = useState<string>("todas");
  const [colecoesAtivas, setColecoesAtivas] = useState<Record<Colecao, boolean>>({
    Signature: true,
    "Brand Collection": true,
    "Arabic Collection": true,
    "Dream Brand Collection": true,
  });

  const marcas = Array.from(new Set(perfumes.map((p) => p.marca).filter((m): m is string => !!m))).sort();
  const buscaNorm = busca.trim().toLowerCase();
  
  const colecaoOrder: Record<Colecao, number> = {
    Signature: 0,
    "Brand Collection": 1,
    "Arabic Collection": 2,
    "Dream Brand Collection": 3,
  };

  const perfumesFiltrados = perfumes
    .filter((p) => {
      if (soFavoritos && !wishlist.has(p.id)) return false;
      if (!colecoesAtivas[p.colecao]) return false;
      if (filtro !== "todos" && p.genero !== filtro) return false;
      if (marca !== "todas" && p.marca !== marca) return false;
      if (buscaNorm && !p.nome.toLowerCase().includes(buscaNorm)) return false;
      if (disponibilidade === "pronta" && !p.prontaEntrega) return false;
      if (disponibilidade === "encomenda" && !p.sobEncomenda) return false;
      return true;
    })
    .sort((a, b) => {
      if (a.prontaEntrega && !b.prontaEntrega) return -1;
      if (!a.prontaEntrega && b.prontaEntrega) return 1;
      const c = colecaoOrder[a.colecao] - colecaoOrder[b.colecao];
      if (c !== 0) return c;
      return 0;
    });

  const imagensRotativas = ["/perfume-1.jpg", "/perfume-2.jpg", "/perfume-3.jpg"];
  const codigoDoPerfume = (index: number) => `Nº ${String(index + 1).padStart(3, "0")}`;

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="mb-10 flex items-end justify-between sm:mb-14">
        <div>
          <span className="text-[11px] uppercase tracking-[0.25em] text-gold">Catálogo</span>
          <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl md:text-5xl">
            Nossas fragrâncias
          </h2>
        </div>
        <p className="hidden max-w-sm text-sm text-muted-foreground md:block text-right">
          Adicione ao carrinho e envie o pedido pelo WhatsApp.
        </p>
      </div>

      {/* Filtro por gênero */}
      <div className="mb-8 flex justify-center sm:mb-10">
        <div className="relative inline-flex w-full max-w-sm rounded-full border border-border/60 bg-card p-1 text-sm sm:w-auto">
          <span
            aria-hidden
            className="absolute top-1 bottom-1 w-[calc((100%-0.5rem)/3)] rounded-full bg-gold transition-transform duration-300 ease-out sm:w-28"
            style={{
              transform: `translateX(${filtro === "feminino" ? "0%" : filtro === "todos" ? "100%" : "200%"})`,
            }}
          />
          {(["feminino", "todos", "masculino"] as const).map((op) => (
            <button
              key={op}
              type="button"
              onClick={() => setFiltro(op)}
              className={`relative z-10 flex-1 min-h-11 rounded-full px-2 py-2 text-xs font-medium capitalize transition-colors sm:w-28 sm:flex-none sm:px-4 sm:text-sm ${
                filtro === op ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {op === "todos" ? "Todos" : op}
            </button>
          ))}
        </div>
      </div>

      {/* Filtro por disponibilidade */}
      <div className="mb-8 flex justify-center">
        <div className="flex flex-wrap justify-center gap-2">
          {(
            [
              { id: "todos", label: "Tudo" },
              { id: "pronta", label: "Pronta Entrega" },
              { id: "encomenda", label: "Sob Encomenda" },
            ] as const
          ).map((op) => (
            <button
              key={op.id}
              type="button"
              onClick={() => setDisponibilidade(op.id)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs uppercase tracking-wider transition ${
                disponibilidade === op.id
                  ? "border-gold bg-gold text-primary-foreground"
                  : "border-border/60 bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {op.label}
            </button>
          ))}
        </div>
      </div>

      {/* Coleções */}
      <div className="mb-8 flex flex-wrap justify-center gap-2">
        {COLECOES.map((c) => {
          const on = colecoesAtivas[c];
          const encomenda = COLECAO_INFO[c].sobEncomenda;
          return (
            <button
              key={c}
              type="button"
              onClick={() =>
                setColecoesAtivas((s) => ({ ...s, [c]: !s[c] }))
              }
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs uppercase tracking-wider transition ${
                on
                  ? "border-gold bg-gold text-primary-foreground"
                  : "border-border/60 bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
              {encomenda && (
                <span className={`rounded-full px-1.5 py-0.5 text-[9px] normal-case tracking-normal ${on ? "bg-primary-foreground/20 text-primary-foreground" : "bg-amber-500/15 text-amber-400"}`}>
                  encomenda
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Busca por nome + seletor de marca + favoritos */}
      <div className="mb-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <div className="relative w-full max-w-xs text-left">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground ml-2">
            Buscar perfume por nome
          </label>
          <div className="relative">
            <svg
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
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
              placeholder="Digite o nome do perfume..."
              className="w-full rounded-full border border-border/60 bg-card py-2 pl-9 pr-4 text-sm outline-none transition focus:border-gold"
            />
          </div>
        </div>
        
        <div className="relative w-full max-w-[200px] text-left">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground ml-2">
            Marcas
          </label>
          <div className="relative">
            <select
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              style={{ colorScheme: "dark" }}
              className="w-full appearance-none rounded-full border border-border/60 bg-card px-4 py-2 pr-10 text-sm text-foreground outline-none transition focus:border-gold"
              aria-label="Filtrar por marca"
            >
              <option value="todas">Todas as marcas</option>
              {marcas.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="relative text-left">
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground ml-2 invisible">
            Favoritos
          </label>
          <button
            type="button"
            onClick={() => setSoFavoritos((v) => !v)}
            aria-pressed={soFavoritos}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition h-[38px] ${
              soFavoritos
                ? "border-gold bg-gold text-primary-foreground"
                : "border-border/60 bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            <span aria-hidden>♥</span>
            Favoritos{wishlist.count > 0 ? ` (${wishlist.count})` : ""}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
        {perfumesFiltrados.length === 0 ? (
          <div className="col-span-full py-20 text-center">
            <p className="text-muted-foreground">Nenhum perfume encontrado com os filtros selecionados.</p>
            <button
              onClick={() => {
                setBusca("");
                setMarca("todas");
                setFiltro("todos");
                setDisponibilidade("todos");
                setSoFavoritos(false);
                setColecoesAtivas({
                  Signature: true,
                  "Brand Collection": true,
                  "Arabic Collection": true,
                  "Dream Brand Collection": true,
                });
              }}
              className="mt-4 text-sm font-medium text-gold hover:underline"
            >
              Limpar todos os filtros
            </button>
          </div>
        ) : (
          perfumesFiltrados.map((p) => {
            const i = perfumes.indexOf(p);
            const codigo = codigoDoPerfume(i);
            const imagem = p.imagem ?? imagensRotativas[i % imagensRotativas.length];
            const mostrarSobEncomenda = p.sobEncomenda && !p.emEstoque;
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
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      wishlist.toggle(p.id);
                    }}
                    aria-label={wishlist.has(p.id) ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                    aria-pressed={wishlist.has(p.id)}
                    className={`absolute bottom-3 right-3 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-background/85 text-lg shadow-sm backdrop-blur transition hover:scale-110 sm:bottom-4 sm:right-4 sm:h-10 sm:w-10 sm:text-xl ${
                      wishlist.has(p.id) ? "text-rose-500" : "text-muted-foreground hover:text-rose-500"
                    }`}
                  >
                    {wishlist.has(p.id) ? "♥" : "♡"}
                  </button>
                  <img
                    src={imagem}
                    alt={p.nome}
                    width={800}
                    height={1000}
                    loading="lazy"
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <span className="absolute left-2 top-2 flex max-w-[55%] items-center gap-1 rounded-full bg-background/85 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-gold backdrop-blur sm:left-4 sm:top-4 sm:max-w-none sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm sm:tracking-[0.15em]">
                    <span className="truncate">{codigo}</span>
                    <span className="shrink-0 rounded-full bg-gold/25 px-1.5 py-0.5 text-[9px] font-bold text-gold sm:px-2 sm:text-xs">
                      {p.volume}
                    </span>
                  </span>
                  {p.prontaEntrega && (
                    <span className="absolute right-2 top-2 rounded-full bg-emerald-500/90 px-2 py-0.5 text-[8px] uppercase tracking-[0.15em] text-black backdrop-blur sm:right-4 sm:top-4 sm:px-3 sm:py-1 sm:text-[10px] sm:tracking-[0.2em]">
                      Pronta entrega
                    </span>
                  )}
                  {mostrarSobEncomenda && (
                    <span
                      className={`absolute left-2 bottom-2 rounded-full bg-amber-500/90 px-2 py-0.5 text-[8px] uppercase tracking-[0.15em] text-black backdrop-blur sm:left-auto sm:right-4 sm:bottom-auto sm:px-3 sm:py-1 sm:text-[10px] sm:tracking-[0.2em] ${
                        p.prontaEntrega ? "sm:top-12" : "sm:top-4"
                      }`}
                    >
                      Sob encomenda
                    </span>
                  )}
                </Link>

                <div className="flex flex-1 flex-col gap-3 p-4 sm:gap-4 sm:p-6">
                  <div>
                    <h3 className="font-display text-base font-semibold sm:text-xl">
                      <Link to="/perfume/$id" params={{ id: p.id }} className="transition hover:text-gold">
                        {p.nome}
                      </Link>
                    </h3>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground sm:text-sm">
                      {p.descricao || "Contratipo exclusivo"}
                    </p>
                    {p.preco != null && (
                      <p className="mt-2 text-sm font-semibold text-gold sm:text-base">
                        {formatBRL(p.preco)}
                      </p>
                    )}
                  </div>
                  {qtd === 0 ? (
                    <button
                      type="button"
                      onClick={() => add(p.id)}
                      className="mt-auto inline-flex min-h-11 items-center justify-center rounded-full bg-foreground/5 py-3 text-sm font-medium transition group-hover:bg-gold group-hover:text-primary-foreground"
                    >
                      Adicionar ao carrinho
                    </button>
                  ) : (
                    <div className="mt-auto flex items-center justify-between rounded-full bg-gold/10 p-1">
                      <button
                        type="button"
                        onClick={() => remove(p.id)}
                        className="h-11 w-11 rounded-full bg-background text-lg font-semibold text-foreground transition hover:bg-gold hover:text-primary-foreground"
                        aria-label="Remover um"
                      >
                        −
                      </button>
                      <span className="text-xs font-semibold text-gold sm:text-sm">
                        {qtd} no carrinho
                      </span>
                      <button
                        type="button"
                        onClick={() => add(p.id)}
                        className="h-11 w-11 rounded-full bg-background text-lg font-semibold text-foreground transition hover:bg-gold hover:text-primary-foreground"
                        aria-label="Adicionar mais um"
                      >
                        +
                      </button>
                    </div>
                  )}
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
