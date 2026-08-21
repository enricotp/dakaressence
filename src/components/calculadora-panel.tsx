import { useMemo, useState } from "react";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { getPerfumes, type Perfume, formatarNumeroPerfume } from "@/lib/perfumes.functions";
import { formatBRL } from "@/lib/format";

export const calculadoraPerfumesQuery = queryOptions({
  queryKey: ["perfumes"],
  queryFn: () => getPerfumes(),
  staleTime: 0,
});

type LinhaCalculada = {
  qtd: number;
  nome: string;
  numeroInformado: number | null;
  preco: number | null;
  subtotal: number | null;
  match: Perfume | null;
  raw: string;
  status: "exato" | "fuzzy" | "manual" | "nao_encontrado" | "divergente";
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
    // Regex para capturar Qtd, Nome e opcionalmente (Nº XXX)
    const m = raw.match(/^[•\-\*\s]*(\d+)\s*[xX]\s+(.+?)(?:\s*\((?:Nº|No|N|#)\s*(\d+)\))?\s*$/i);
    if (!m) continue;

    const qtd = parseInt(m[1], 10);
    const nomeFornecido = m[2].trim();
    const numeroInformado = m[3] ? parseInt(m[3], 10) : null;
    const nomeNorm = normalize(nomeFornecido);

    let match: Perfume | null = null;
    let status: LinhaCalculada["status"] = "nao_encontrado";

    if (numeroInformado !== null) {
      match = perfumes.find((p) => p.numero === numeroInformado) || null;
      if (match) {
        const matchNomeNorm = normalize(match.nome);
        // Se o nome fornecido não bater nem for parte do nome do perfume encontrado pelo número
        if (nomeNorm !== matchNomeNorm && !matchNomeNorm.includes(nomeNorm) && !nomeNorm.includes(matchNomeNorm)) {
          status = "divergente";
        } else {
          status = "exato";
        }
      } else {
        status = "nao_encontrado";
      }
    } else {
      // Fuzzy fallback
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
      match = best?.p ?? null;
      status = match ? "fuzzy" : "nao_encontrado";
    }

    const preco = match?.preco ?? null;
    resultado.push({
      qtd,
      nome: match?.nome ?? nomeFornecido,
      numeroInformado,
      preco,
      subtotal: preco != null ? preco * qtd : null,
      match,
      raw,
      status,
    });
  }
  return resultado;
}

function extrairPedidoId(texto: string): string | null {
  const m = texto.match(/PED-[A-Z0-9]+/i);
  return m ? m[0].toUpperCase() : null;
}

function extrairNome(texto: string): string | null {
  const m = texto.match(/^\s*Nome:\s*(.+?)\s*$/im);
  return m ? m[1].trim() : null;
}

export function CalculadoraPanel() {
  const { data: perfumes } = useSuspenseQuery(calculadoraPerfumesQuery);
  const [texto, setTexto] = useState("");
  const [pagamento, setPagamento] = useState<"Pix" | "Cartão">("Pix");
  const [parcelas, setParcelas] = useState(1);

  const linhas = useMemo(() => parseTexto(texto, perfumes), [texto, perfumes]);
  const pedidoId = useMemo(() => extrairPedidoId(texto), [texto]);
  const nomeCliente = useMemo(() => extrairNome(texto), [texto]);
  const total = linhas.reduce((acc, l) => acc + (l.subtotal ?? 0), 0);
  
  const temErros = linhas.some((l) => l.status === "nao_encontrado" || l.status === "divergente" || l.preco == null);

  return (
    <div className="grid gap-6">
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder={"Cole aqui o pedido, ex:\n• 2x Angel (Nº 001)\n• 1x 1 Million (Nº 009)"}
        rows={10}
        className="w-full rounded-2xl border border-border/60 bg-card p-4 font-mono text-sm text-foreground focus:border-gold focus:outline-none"
      />

      {(pedidoId || nomeCliente) && (
        <div className="rounded-2xl border border-gold/40 bg-gold/5 p-4 text-sm">
          {pedidoId && (
            <p>
              <span className="uppercase tracking-wider text-muted-foreground text-xs">Pedido:</span>{" "}
              <strong className="font-mono text-gold">{pedidoId}</strong>
            </p>
          )}
          {nomeCliente && (
            <p className="mt-1">
              <span className="uppercase tracking-wider text-muted-foreground text-xs">Cliente:</span>{" "}
              <strong className="text-foreground">{nomeCliente}</strong>
            </p>
          )}
        </div>
      )}

      {linhas.length > 0 && (
        <div className="rounded-2xl border border-border/60 bg-card p-6">
          <ul className="divide-y divide-border/60">
            {linhas.map((l, i) => (
              <li key={i} className={`flex items-center justify-between gap-4 py-3 ${l.status === 'divergente' || l.status === 'nao_encontrado' ? 'bg-destructive/5 -mx-2 px-2 rounded-lg' : ''}`}>
                <div className="min-w-0">
                  <p className="truncate font-medium flex items-center gap-2">
                    {l.qtd}× {l.nome}
                    {l.match && (
                      <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                        {formatarNumeroPerfume(l.match.numero)} · {l.match.volume}
                      </span>
                    )}
                  </p>
                  
                  {l.status === "nao_encontrado" && (
                    <p className="text-xs text-destructive">Perfume não encontrado{l.numeroInformado ? ` (Nº ${l.numeroInformado})` : ''}</p>
                  )}
                  {l.status === "divergente" && (
                    <p className="text-xs text-amber-500 font-medium">
                      Divergência: Nº {l.numeroInformado} é {l.match?.nome}
                    </p>
                  )}
                  {l.status === "fuzzy" && (
                    <p className="text-[10px] text-muted-foreground italic">Identificado por nome</p>
                  )}
                  {l.match && l.preco == null && (
                    <p className="text-xs text-destructive">Sem preço cadastrado</p>
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
          
          {temErros && (
            <div className="mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 text-xs text-destructive flex items-start gap-2">
              <svg className="h-4 w-4 shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <div>
                Existem itens ambíguos, não encontrados ou sem preço.
                Confira os destaques em vermelho acima antes de finalizar.
              </div>
            </div>
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
  );
}
