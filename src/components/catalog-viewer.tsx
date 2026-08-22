import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useSearch, useNavigate } from "@tanstack/react-router";
import { formatBRL } from "@/lib/format";
import { useWishlist } from "@/lib/wishlist-context";
import { useCart } from "@/lib/cart-context";
import { COLECOES, COLECAO_INFO, type Colecao, type Volume, type Perfume, formatarNumeroPerfume } from "@/lib/perfumes.functions";
import { X, HelpCircle, Sparkles, Filter } from "lucide-react";


interface CatalogViewerProps {
  perfumes: Perfume[];
}

export function CatalogViewer({ perfumes }: CatalogViewerProps) {
  const search = useSearch({ from: "/catalogo" }) as any;
  const navigate = useNavigate();
  const { cart, add, remove } = useCart();
  const wishlist = useWishlist();
  const [soFavoritos, setSoFavoritos] = useState(false);
  const [disponibilidade, setDisponibilidade] = useState<"todos" | "pronta" | "encomenda">("todos");
  const [filtro, setFiltro] = useState<"todos" | "feminino" | "masculino">("todos");
  const [busca, setBusca] = useState("");
  const [marca, setMarca] = useState<string>("todas");
  const [selectedVolume, setSelectedVolume] = useState<Volume | "todos">("todos");
  const [showTutorial, setShowTutorial] = useState(false);
  const [activeNotes, setActiveNotes] = useState<string[]>([]);
  const [showNoteSelector, setShowNoteSelector] = useState(false);
  const [aromaSearch, setAromaSearch] = useState("");
  const aromaSearchInputRef = useRef<HTMLInputElement>(null);



  const [colecoesAtivas, setColecoesAtivas] = useState<Record<Colecao, boolean>>(() => {
    if (search.colecao && COLECOES.includes(search.colecao as Colecao)) {
      const initial = {
        Signature: false,
        "Brand Collection": false,
        "Arabic Collection": false,
        "Dream Brand Collection": false,
      };
      initial[search.colecao as Colecao] = true;
      return initial;
    }
    return {
      Signature: true,
      "Brand Collection": true,
      "Arabic Collection": true,
      "Dream Brand Collection": true,
    };
  });

  useEffect(() => {
    const hasSeenTutorial = localStorage.getItem("dakar_tutorial_seen");
    if (!hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, []);

  const dismissTutorial = () => {
    localStorage.setItem("dakar_tutorial_seen", "true");
    setShowTutorial(false);
  };

  const allNotes = useMemo(() => {
    const notesSet = new Set<string>();
    perfumes.forEach((p) => {
      [p.notasTopo, p.notasCoracao, p.notasFundo].forEach((n) => {
        if (!n) return;
        n.split(/[,;]\s*/).forEach((note) => {
          const trimmed = note.trim();
          if (trimmed && trimmed.length > 2) {
            notesSet.add(trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase());
          }
        });
      });
    });
    return Array.from(notesSet).sort();
  }, [perfumes]);

  const toggleNote = (note: string) => {
    setActiveNotes(prev => 
      prev.includes(note) ? prev.filter(n => n !== note) : [...prev, note]
    );
  };

  useEffect(() => {
    if (search.volume) {
      const vol = search.volume as Volume;
      if (["25ml", "50ml", "80ml", "100ml"].includes(vol)) {
        setSelectedVolume(vol);
      }
    }
  }, [search.volume]);


  const marcas = Array.from(new Set(perfumes.map((p) => p.marca).filter((m): m is string => !!m))).sort();
  const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  
  const perfumesFiltrados = useMemo(() => {
    const buscaNorm = normalize(busca.trim());
    const buscaWords = buscaNorm.split(/\s+/).filter(w => w.length > 0);
    
    const colecaoOrder: Record<Colecao, number> = {
      Signature: 0,
      "Brand Collection": 1,
      "Arabic Collection": 2,
      "Dream Brand Collection": 3,
    };

    return perfumes
      .filter((p) => {
        if (soFavoritos && !wishlist.has(p.id)) return false;
        if (!colecoesAtivas[p.colecao]) return false;
        if (filtro !== "todos" && p.genero !== filtro) return false;
        if (marca !== "todas" && p.marca !== marca) return false;
        
        if (buscaWords.length > 0) {
          const nomeNorm = normalize(p.nome);
          const marcaNorm = normalize(p.marca || "");
          const descNorm = normalize(p.descricao || "");
          const content = `${nomeNorm} ${marcaNorm} ${descNorm}`;
          
          const allWordsMatch = buscaWords.every(word => {
            if (content.includes(word)) return true;
            if (word === "all" && content.includes("al")) return true;
            if (word === "al" && content.includes("all")) return true;
            if (word === "wazer" && content.includes("wazeer")) return true;
            return false;
          });
          
          if (!allWordsMatch) return false;
        }

        if (disponibilidade === "pronta" && p.disponibilidade.toLowerCase() !== "pronta entrega") return false;
        if (disponibilidade === "encomenda" && p.disponibilidade.toLowerCase() !== "sob encomenda") return false;
        if (selectedVolume !== "todos" && p.volume !== selectedVolume) return false;
        
        if (activeNotes.length > 0) {
          const perfumeNotes = [p.notasTopo, p.notasCoracao, p.notasFundo].join(" ").toLowerCase();
          return activeNotes.some(note => perfumeNotes.includes(note.toLowerCase()));
        }
        
        return true;
      })
      .sort((a, b) => {
        if (activeNotes.length > 0) {
          const aNotes = [a.notasTopo, a.notasCoracao, a.notasFundo].join(" ").toLowerCase();
          const bNotes = [b.notasTopo, b.notasCoracao, b.notasFundo].join(" ").toLowerCase();
          const aMatches = activeNotes.filter(n => aNotes.includes(n.toLowerCase())).length;
          const bMatches = activeNotes.filter(n => bNotes.includes(n.toLowerCase())).length;
          if (aMatches !== bMatches) return bMatches - aMatches;
        }

        if (a.disponibilidade.toLowerCase() === "pronta entrega" && b.disponibilidade.toLowerCase() !== "pronta entrega") return -1;
        if (a.disponibilidade.toLowerCase() !== "pronta entrega" && b.disponibilidade.toLowerCase() === "pronta entrega") return 1;
        const c = colecaoOrder[a.colecao] - colecaoOrder[b.colecao];
        if (c !== 0) return c;
        return 0;
      });
  }, [perfumes, busca, colecoesAtivas, filtro, marca, disponibilidade, soFavoritos, selectedVolume, wishlist, activeNotes]);

  const imagensRotativas = ["/perfume-1.jpg", "/perfume-2.jpg", "/perfume-3.jpg"];
  const codigoDoPerfume = (p: Perfume) => formatarNumeroPerfume(p.numero);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 relative">
      {/* Tutorial Overlay */}
      {showTutorial && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="max-w-md w-full bg-card border border-gold/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4">
              <button 
                onClick={dismissTutorial}
                className="text-muted-foreground hover:text-foreground transition"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="flex flex-col items-center text-center">
              <div className="h-16 w-16 rounded-full bg-gold/10 flex items-center justify-center mb-6">
                <Sparkles className="h-8 w-8 text-gold" />
              </div>
              
              <h3 className="text-2xl font-display font-semibold mb-4">Bem-vindo ao Catálogo Dakar!</h3>
              
              <div className="space-y-4 text-sm text-muted-foreground text-left mb-8">
                <div className="flex gap-3">
                  <div className="h-5 w-5 rounded-full bg-gold/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-gold">1</span>
                  </div>
                  <p><span className="text-foreground font-medium">Filtre seu estilo:</span> Use os botões no topo para escolher por gênero, coleção e disponibilidade.</p>
                </div>
                <div className="flex gap-3">
                  <div className="h-5 w-5 rounded-full bg-gold/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-gold">2</span>
                  </div>
                  <p><span className="text-foreground font-medium">Descubra por Aroma:</span> Não sabe o que escolher? Use a nossa nova busca olfativa para encontrar perfumes por notas que você gosta.</p>
                </div>
                <div className="flex gap-3">
                  <div className="h-5 w-5 rounded-full bg-gold/20 flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-gold">3</span>
                  </div>
                  <p><span className="text-foreground font-medium">Pronta Entrega vs Encomenda:</span> Identifique rapidamente o que temos em estoque para envio imediato.</p>
                </div>
              </div>
              
              <button 
                onClick={dismissTutorial}
                className="w-full bg-gold text-primary-foreground py-3 rounded-full font-semibold hover:bg-gold/90 transition shadow-lg"
              >
                Começar a Explorar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-10 flex items-end justify-between sm:mb-14">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] uppercase tracking-[0.25em] text-gold">Catálogo</span>
            <button 
              onClick={() => setShowTutorial(true)}
              className="text-muted-foreground hover:text-gold transition-colors flex items-center gap-1.5 text-[10px] uppercase tracking-wider font-semibold"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              Como funciona?
            </button>
          </div>
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
      <div className="mb-8 flex justify-center px-2">
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-center sm:w-auto">
          {(
            [
              { id: "todos", label: "Tudo" },
              { id: "pronta", label: "Pronta Entrega", sublabel: "Receba hoje" },
              { id: "encomenda", label: "Sob Encomenda", sublabel: "Em 6 dias" },

            ] as const
          ).map((op) => (
            <button
              key={op.id}
              type="button"
              onClick={() => setDisponibilidade(op.id)}
              className={`inline-flex flex-col items-center justify-center gap-0.5 rounded-2xl border px-3 py-2 text-xs text-center uppercase tracking-wider transition min-h-[54px] sm:min-w-[140px] ${
                op.id === "todos" ? "col-span-2 sm:col-span-1" : ""
              } ${
                disponibilidade === op.id
                  ? "border-gold bg-gold text-primary-foreground"
                  : "border-border/60 bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="font-bold">{op.label}</span>
              {('sublabel' in op) && (
                <span className={`text-[9px] lowercase text-center leading-none tracking-normal opacity-80 mt-0.5 ${disponibilidade === op.id ? "text-primary-foreground" : "text-muted-foreground"}`}>
                  {op.sublabel}
                </span>
              )}

            </button>
          ))}
        </div>
      </div>

      {/* Coleções */}
      <div className="mb-8 flex flex-wrap justify-center gap-2 px-2">
        {COLECOES.map((c) => {
          const on = colecoesAtivas[c];
          const encomenda = COLECAO_INFO[c].sobEncomenda;
          return (
            <button
              key={c}
              type="button"
              onClick={() => {
                setColecoesAtivas((s) => {
                  const newState = { ...s, [c]: !s[c] };
                  
                  // Reset volume if the new set of active collections doesn't support the current volume
                  const activeColecoesAfter = (Object.keys(newState) as Colecao[]).filter(k => newState[k]);
                  const allSupportedVolumes = new Set(activeColecoesAfter.flatMap(k => COLECAO_INFO[k].volumes));
                  
                  if (selectedVolume !== "todos" && !allSupportedVolumes.has(selectedVolume as Volume)) {
                    setSelectedVolume("todos");
                  }
                  
                  return newState;
                });
              }}

              className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1.5 text-[9px] uppercase tracking-wider transition sm:px-4 sm:text-xs ${
                on
                  ? "border-gold bg-gold text-primary-foreground"
                  : "border-border/60 bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="truncate max-w-[80px] sm:max-w-none">{c}</span>
              {encomenda && (
                <span className={`rounded-full px-1 py-0.5 text-[7px] normal-case tracking-normal sm:px-1.5 sm:text-[9px] ${on ? "bg-primary-foreground/20 text-primary-foreground" : "bg-amber-500/15 text-amber-400"}`}>
                  encomenda
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Seletor de Volume Dinâmico */}
      <div className="mb-8 flex justify-center">
        {(() => {
          const activeColecoes = (Object.keys(colecoesAtivas) as Colecao[]).filter(c => colecoesAtivas[c]);
          const availableVolumes = Array.from(new Set(activeColecoes.flatMap(c => COLECAO_INFO[c].volumes))).sort((a, b) => {
            const numA = parseInt(a);
            const numB = parseInt(b);
            return numA - numB;
          });

          if (availableVolumes.length <= 1) return null;

          return (
            <div className="flex flex-col items-center gap-2">
              <label className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Filtrar por Volume
              </label>
              <div className="inline-flex rounded-xl border border-border/60 bg-card p-1">
                <button
                  onClick={() => setSelectedVolume("todos")}
                  className={`relative min-w-[70px] rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                    selectedVolume === "todos"
                      ? "bg-gold text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Tudo
                </button>
                {availableVolumes.map((vol) => (
                  <button
                    key={vol}
                    onClick={() => setSelectedVolume(vol)}
                    className={`relative min-w-[70px] rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                      selectedVolume === vol
                        ? "bg-gold text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {vol.replace('ml', ' ml')}
                  </button>
                ))}
              </div>
            </div>
          );
        })()}
      </div>


      {/* Busca por nome + seletor de marca + favoritos */}
      <div className="mb-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-end">
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
              className="w-full rounded-full border border-border/60 bg-card py-2 pl-9 pr-9 text-sm outline-none transition focus:border-gold h-10"
            />
            {busca && (
              <button
                onClick={() => setBusca("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}

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
              className="w-full appearance-none rounded-full border border-border/60 bg-card px-4 py-2 pr-10 text-sm text-foreground outline-none transition focus:border-gold h-10"
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

        <div className="flex gap-2 items-center justify-center sm:items-end sm:justify-start sm:pb-[1px]">
          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => setShowNoteSelector(!showNoteSelector)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 text-sm transition h-10 ${
                showNoteSelector || activeNotes.length > 0
                  ? "border-gold bg-gold text-primary-foreground"
                  : "border-border/60 bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">Descoberta por Aroma</span>
              <span className="sm:hidden">Aromas</span>
              {activeNotes.length > 0 && (
                <span className="ml-1 rounded-full bg-primary-foreground/20 px-1.5 py-0.5 text-[10px] font-bold">
                  {activeNotes.length}
                </span>
              )}
            </button>
          </div>

          <div className="flex flex-col">
            <button
              type="button"
              onClick={() => setSoFavoritos((v) => !v)}
              aria-pressed={soFavoritos}
              className={`inline-flex items-center gap-2 rounded-full border px-4 text-sm transition h-10 ${
                soFavoritos
                  ? "border-rose-500 bg-rose-500 text-white"
                  : "border-border/60 bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              <span aria-hidden className="text-lg flex items-center justify-center leading-none mt-[-2px]">{soFavoritos ? "♥" : "♡"}</span>
              <span className="hidden sm:inline">Favoritos</span>
              {wishlist.count > 0 && <span className="ml-1 text-[10px] font-bold">({wishlist.count})</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Seletor de Notas Olfativas */}
      {showNoteSelector && (
        <div className="mb-8 p-6 rounded-3xl border border-gold/30 bg-gold/5 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-semibold uppercase tracking-wider text-gold flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Escolha os aromas que você gosta
            </h4>
            <button 
              onClick={() => setShowNoteSelector(false)}
              className="text-muted-foreground hover:text-foreground transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex flex-col gap-4 mb-6">
            <p className="text-xs text-muted-foreground">
              Selecione uma ou mais notas para encontrar perfumes que combinam com seu estilo.
            </p>
            <div className="relative max-w-sm">
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
                ref={aromaSearchInputRef}
                type="text"
                value={aromaSearch}
                onChange={(e) => setAromaSearch(e.target.value)}
                placeholder="Buscar aroma ou nota..."
                className="w-full rounded-full border border-border/60 bg-background py-2 pl-9 pr-9 text-xs outline-none transition focus:border-gold"
              />
              {aromaSearch && (
                <button
                  onClick={() => {
                    setAromaSearch("");
                    aromaSearchInputRef.current?.focus();
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}

            </div>
          </div>
          
          <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {allNotes
              .filter(note => {
                const search = aromaSearch.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const target = note.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                return target.includes(search);
              })
              .map((note) => {
                const active = activeNotes.includes(note);
                return (
                  <button
                    key={note}
                    onClick={() => toggleNote(note)}
                    className={`px-3 py-1.5 rounded-full text-xs transition-all ${
                      active
                        ? "bg-gold text-primary-foreground shadow-md scale-105"
                        : "bg-background border border-border/60 text-muted-foreground hover:border-gold/50 hover:text-foreground"
                    }`}
                  >
                    {note}
                  </button>
                );
              })}
            {allNotes.filter(note => {
              const search = aromaSearch.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
              const target = note.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
              return target.includes(search);
            }).length === 0 && (
              <p className="text-xs text-muted-foreground py-4 w-full text-center">
                Nenhum aroma encontrado para "{aromaSearch}"
              </p>
            )}

          </div>

          {activeNotes.length > 0 && (
            <button
              onClick={() => setActiveNotes([])}
              className="mt-6 text-[10px] font-bold uppercase tracking-widest text-gold hover:underline"
            >
              Limpar seleção de aromas
            </button>
          )}
        </div>
      )}

      {/* Chips de Filtros Ativos */}
      <div className="mb-8 flex flex-wrap gap-2 items-center">
        {(filtro !== "todos" || marca !== "todas" || disponibilidade !== "todos" || selectedVolume !== "todos" || soFavoritos || activeNotes.length > 0 || Object.values(colecoesAtivas).some(v => !v)) && (
          <>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mr-2 flex items-center gap-1">
              <Filter className="h-3 w-3" />
              Filtros:
            </span>
            
            {filtro !== "todos" && (
              <button 
                onClick={() => setFiltro("todos")}
                className="inline-flex items-center gap-1.5 rounded-full bg-card border border-border/60 px-3 py-1 text-[10px] font-medium transition hover:border-gold/50"
              >
                Gênero: {filtro}
                <X className="h-2.5 w-2.5" />
              </button>
            )}
            
            {marca !== "todas" && (
              <button 
                onClick={() => setMarca("todas")}
                className="inline-flex items-center gap-1.5 rounded-full bg-card border border-border/60 px-3 py-1 text-[10px] font-medium transition hover:border-gold/50"
              >
                Marca: {marca}
                <X className="h-2.5 w-2.5" />
              </button>
            )}

            {disponibilidade !== "todos" && (
              <button 
                onClick={() => setDisponibilidade("todos")}
                className="inline-flex items-center gap-1.5 rounded-full bg-card border border-border/60 px-3 py-1 text-[10px] font-medium transition hover:border-gold/50"
              >
                {disponibilidade === "pronta" ? "Pronta Entrega" : "Sob Encomenda"}
                <X className="h-2.5 w-2.5" />
              </button>
            )}

            {selectedVolume !== "todos" && (
              <button 
                onClick={() => setSelectedVolume("todos")}
                className="inline-flex items-center gap-1.5 rounded-full bg-card border border-border/60 px-3 py-1 text-[10px] font-medium transition hover:border-gold/50"
              >
                Volume: {selectedVolume}
                <X className="h-2.5 w-2.5" />
              </button>
            )}

            {soFavoritos && (
              <button 
                onClick={() => setSoFavoritos(false)}
                className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/10 border border-rose-500/30 px-3 py-1 text-[10px] font-medium text-rose-500 transition hover:bg-rose-500/20"
              >
                Apenas Favoritos
                <X className="h-2.5 w-2.5" />
              </button>
            )}

            {activeNotes.map(note => (
              <button 
                key={note}
                onClick={() => toggleNote(note)}
                className="inline-flex items-center gap-1.5 rounded-full bg-gold/10 border border-gold/30 px-3 py-1 text-[10px] font-medium text-gold transition hover:bg-gold/20"
              >
                Aroma: {note}
                <X className="h-2.5 w-2.5" />
              </button>
            ))}

            <button 
              onClick={() => {
                setFiltro("todos");
                setMarca("todas");
                setDisponibilidade("todos");
                setSelectedVolume("todos");
                setSoFavoritos(false);
                setActiveNotes([]);
                setColecoesAtivas({
                  Signature: true,
                  "Brand Collection": true,
                  "Arabic Collection": true,
                  "Dream Brand Collection": true,
                });
              }}
              className="text-[10px] font-bold uppercase tracking-widest text-gold hover:underline ml-2"
            >
              Limpar Tudo
            </button>
          </>
        )}
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
                setSelectedVolume("todos");
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
            const codigo = codigoDoPerfume(p);
            const imagem = p.imagem ?? imagensRotativas[i % imagensRotativas.length];
            const mostrarSobEncomenda = p.disponibilidade === "Sob Encomenda";
            const qtd = cart[p.id] ?? 0;
            return (
              <article
                key={p.id}
                className={`group relative flex flex-col overflow-hidden rounded-2xl border transition hover:border-gold/50 ${activeNotes.length > 0 && [p.notasTopo, p.notasCoracao, p.notasFundo].join(" ").toLowerCase().split(/[,;]\s*/).some(n => activeNotes.map(an => an.toLowerCase()).includes(n.trim().toLowerCase())) ? "border-gold/30 bg-gold/5 shadow-gold/5 shadow-lg" : "border-border/60 bg-card"}`}
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
                  {activeNotes.length > 0 && (
                    <div className="absolute left-0 right-0 bottom-0 bg-gold/90 text-primary-foreground py-1 px-3 text-[10px] font-bold uppercase tracking-wider text-center z-10 backdrop-blur-sm animate-in slide-in-from-bottom-full">
                      Combina com seus aromas
                    </div>
                  )}
                  <img
                    src={imagem || "/placeholder.svg"}
                    alt={p.nome}
                    width={800}
                    height={1000}
                    loading="lazy"
                    crossOrigin="anonymous"
                    referrerPolicy="no-referrer"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== "/placeholder.svg") {
                        console.error("Image failed to load:", p.nome, target.src);
                        target.src = "/placeholder.svg";
                      }
                    }}
                    className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                  />
                  <span className="absolute left-2 top-2 flex max-w-[55%] items-center gap-1 rounded-full bg-background/85 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-gold backdrop-blur sm:left-4 sm:top-4 sm:max-w-none sm:gap-2 sm:px-3 sm:py-1.5 sm:text-sm sm:tracking-[0.15em]">
                    <span className="truncate">{codigo}</span>
                    <span className="shrink-0 rounded-full bg-gold/25 px-1.5 py-0.5 text-[9px] font-semibold text-gold sm:px-2 sm:text-xs">
                      {p.volume}
                    </span>
                  </span>
                  {p.disponibilidade.toLowerCase() === "pronta entrega" && (
                    <span className="absolute left-2 bottom-2 flex flex-col items-center rounded-lg bg-emerald-500/90 px-1.5 py-0.5 shadow-lg backdrop-blur sm:left-auto sm:right-4 sm:top-4 sm:bottom-auto sm:rounded-xl sm:px-4 sm:py-1.5">
                      <span className="text-[8px] font-bold uppercase tracking-[0.08em] text-black sm:text-[11px] sm:tracking-[0.18em]">
                        {p.amount === 1 ? "Última unidade" : "Pronta entrega"}
                      </span>
                      <span className="text-[7px] font-bold lowercase tracking-normal text-black/90 sm:text-[10px]">
                        {p.amount === 1 ? "Confirme agora" : "Receba hoje"}
                      </span>
                    </span>
                  )}

                  {mostrarSobEncomenda && (
                    <span
                      className={`absolute left-2 bottom-2 flex flex-col items-center rounded-xl bg-amber-500/90 px-2 py-0.5 backdrop-blur sm:left-auto sm:right-4 sm:bottom-auto sm:px-3 sm:py-1 ${
                        p.disponibilidade.toLowerCase() === "pronta entrega" ? "sm:top-[52px]" : "sm:top-4"
                      }`}
                    >
                      <span className="text-[8px] font-semibold uppercase tracking-[0.1em] text-black sm:text-[10px] sm:tracking-[0.15em]">
                        Sob encomenda
                      </span>
                      <span className="text-[7px] lowercase tracking-normal text-black/80 sm:text-[8px]">
                        Em 6 dias
                      </span>
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
