import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getHomeConfig, updateHomeConfig, type HomeConfig } from "@/lib/home-config.functions";
import { type Volume } from "@/lib/perfumes.functions";
import { formatBRL } from "@/lib/format";
import { toast } from "sonner";
import { Plus, Trash2, ArrowUp, ArrowDown, Image as ImageIcon } from "lucide-react";

export function HomeConfigTab() {
  const qc = useQueryClient();
  const list = useServerFn(getHomeConfig);
  const update = useServerFn(updateHomeConfig);

  const { data: config = [], isLoading, error } = useQuery({
    queryKey: ["home-config"],
    queryFn: () => list(),
  });

  const [formState, setFormState] = useState<Record<string, HomeConfig>>({});
  const [hasChanges, setHasChanges] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (config.length > 0) {
      const initial = config.reduce((acc, item) => ({ ...acc, [item.key]: item }), {});
      setFormState(initial);
    }
  }, [config]);

  const mutation = useMutation({
    mutationFn: async (key: string) => {
      const item = formState[key];
      if (!item) return;
      const tid = toast.loading(`Salvando "${key}"...`);
      try {
        const result = await update({
          data: {
            id: item.id,
            key: item.key,
            nome: item.nome,
            descricao: item.descricao,
            precos: item.precos,
            tituloPrincipal: item.tituloPrincipal,
            textoPrincipal: item.textoPrincipal,
            imagens: item.imagens,
          }
        });
        toast.dismiss(tid);
        return result;
      } catch (err) {
        toast.dismiss(tid);
        throw err;
      }
    },
    onSuccess: (_, key) => {
      toast.success(`Configuração "${key}" salva com sucesso!`);
      setHasChanges(prev => ({ ...prev, [key]: false }));
      qc.invalidateQueries({ queryKey: ["home-config"] });
    },
    onError: (err) => {
      toast.error(`Erro ao salvar: ${err instanceof Error ? err.message : "Erro desconhecido"}`);
    }
  });

  const handleChange = (key: string, field: keyof HomeConfig, value: any) => {
    setFormState(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value }
    }));
    setHasChanges(prev => ({ ...prev, [key]: true }));
  };

  const handlePriceChange = (key: string, volume: Volume, value: string) => {
    // Basic BRL formatting logic for input: "149,90" -> 149.9
    const numericValue = parseFloat(value.replace(/\./g, "").replace(",", ".")) || 0;
    setFormState(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        precos: { ...prev[key].precos, [volume]: numericValue }
      }
    }));
    setHasChanges(prev => ({ ...prev, [key]: true }));
  };

  const handleImageAction = (key: string, action: 'add' | 'remove' | 'moveUp' | 'moveDown' | 'change', index?: number, value?: string) => {
    setFormState(prev => {
      const item = prev[key];
      const newImagens = [...(item.imagens || [])];

      if (action === 'add') {
        newImagens.push("");
      } else if (action === 'remove' && index !== undefined) {
        newImagens.splice(index, 1);
      } else if (action === 'moveUp' && index !== undefined && index > 0) {
        [newImagens[index], newImagens[index - 1]] = [newImagens[index - 1], newImagens[index]];
      } else if (action === 'moveDown' && index !== undefined && index < newImagens.length - 1) {
        [newImagens[index], newImagens[index + 1]] = [newImagens[index + 1], newImagens[index]];
      } else if (action === 'change' && index !== undefined && value !== undefined) {
        newImagens[index] = value.trim();
      }

      return {
        ...prev,
        [key]: { ...item, imagens: newImagens }
      };
    });
    setHasChanges(prev => ({ ...prev, [key]: true }));
  };

  if (isLoading) return <p className="text-muted-foreground">Carregando configurações...</p>;
  if (error) return <p className="text-destructive">Erro ao carregar configurações.</p>;

  const homeMain = formState["home_main"];
  const collections = Object.entries(formState).filter(([key]) => key !== "home_main");

  return (
    <div className="space-y-10">
      {/* Home Main Section */}
      {homeMain && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-semibold">Conteúdo Principal</h2>
            <div className="flex items-center gap-4">
              {hasChanges["home_main"] && (
                <span className="text-xs text-yellow-500 animate-pulse">Alterações não salvas</span>
              )}
              <button
                onClick={() => mutation.mutate("home_main")}
                disabled={mutation.isPending || !hasChanges["home_main"]}
                className="rounded-full bg-gold px-6 py-2 text-xs font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-50"
              >
                {mutation.isPending && mutation.variables === "home_main" ? "Salvando..." : "Salvar Conteúdo"}
              </button>
            </div>
          </div>
          
          <div className="grid gap-6 rounded-2xl border border-border/60 bg-card p-6">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Título Principal</label>
              <input
                type="text"
                value={homeMain.tituloPrincipal}
                onChange={(e) => handleChange("home_main", "tituloPrincipal", e.target.value)}
                className="w-full rounded-lg border border-border/60 bg-background px-4 py-2 text-sm focus:border-gold focus:outline-none"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Texto de Introdução</label>
              <textarea
                value={homeMain.textoPrincipal}
                rows={3}
                onChange={(e) => handleChange("home_main", "textoPrincipal", e.target.value)}
                className="w-full rounded-lg border border-border/60 bg-background px-4 py-2 text-sm focus:border-gold focus:outline-none"
              />
            </div>
          </div>
        </section>
      )}

      {/* Collections Section */}
      <section className="space-y-6">
        <h2 className="font-display text-2xl font-semibold">Coleções</h2>
        <div className="grid gap-8 md:grid-cols-2">
          {collections.map(([key, item]) => (
            <div key={key} className="flex flex-col rounded-2xl border border-border/60 bg-card p-6 space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Nome da Coleção</label>
                  <input
                    type="text"
                    value={item.nome}
                    onChange={(e) => handleChange(key, "nome", e.target.value)}
                    className="w-full rounded-lg border border-border/60 bg-background px-4 py-2 text-sm focus:border-gold focus:outline-none"
                  />
                </div>
                <div className="flex flex-col items-end gap-2">
                  <button
                    onClick={() => mutation.mutate(key)}
                    disabled={mutation.isPending || !hasChanges[key]}
                    className="rounded-full bg-gold px-4 py-1.5 text-[10px] font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-50 uppercase tracking-wider"
                  >
                    {mutation.isPending && mutation.variables === key ? "Salvando..." : "Salvar"}
                  </button>
                  {hasChanges[key] && (
                    <span className="text-[9px] text-yellow-500 uppercase tracking-wider">Pendente</span>
                  )}
                </div>
              </div>

              {/* Carousel Images Section */}
              <div className="space-y-4 border-t border-border/40 pt-6">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-semibold">Imagens do Carrossel</label>
                  <button
                    type="button"
                    onClick={() => handleImageAction(key, 'add')}
                    className="flex items-center gap-1.5 rounded-lg bg-gold/10 px-3 py-1.5 text-[10px] font-bold text-gold transition hover:bg-gold/20"
                  >
                    <Plus className="h-3 w-3" />
                    Adicionar
                  </button>
                </div>

                <div className="space-y-3">
                  {(item.imagens || []).map((url, idx) => (
                    <div key={idx} className="group relative space-y-2 rounded-xl border border-border/40 bg-background/30 p-3 transition-colors hover:border-gold/30">
                      <div className="flex items-start gap-3">
                        {/* Preview */}
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border/60 bg-muted/50">
                          {url ? (
                            <img
                              src={url}
                              alt={`Preview ${idx + 1}`}
                              className="h-full w-full object-contain"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://placehold.co/100x100?text=Error';
                              }}
                            />
                          ) : (
                            <ImageIcon className="h-6 w-6 text-muted-foreground/30" />
                          )}
                        </div>

                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-bold text-muted-foreground uppercase">Posição {idx + 1}</span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleImageAction(key, 'moveUp', idx)}
                                disabled={idx === 0}
                                className="rounded p-1 text-muted-foreground hover:bg-foreground/5 hover:text-foreground disabled:opacity-20"
                              >
                                <ArrowUp className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleImageAction(key, 'moveDown', idx)}
                                disabled={idx === (item.imagens?.length || 0) - 1}
                                className="rounded p-1 text-muted-foreground hover:bg-foreground/5 hover:text-foreground disabled:opacity-20"
                              >
                                <ArrowDown className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (url && !confirm("Deseja remover esta imagem permanentemente ao salvar?")) return;
                                  handleImageAction(key, 'remove', idx);
                                }}
                                className="rounded p-1 text-destructive/60 hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                          <input
                            type="text"
                            placeholder="https://exemplo.com/imagem.webp"
                            value={url}
                            onChange={(e) => handleImageAction(key, 'change', idx, e.target.value)}
                            className="w-full rounded-md border border-border/60 bg-background/50 px-3 py-1.5 text-[11px] focus:border-gold focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}

                  {(item.imagens || []).length === 0 && (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                      <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-muted/30">
                        <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
                      </div>
                      <p className="text-[10px] text-muted-foreground">Nenhuma imagem configurada.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Descrição</label>
                <textarea
                  value={item.descricao}
                  rows={4}
                  onChange={(e) => handleChange(key, "descricao", e.target.value)}
                  className="w-full rounded-lg border border-border/60 bg-background px-4 py-2 text-sm focus:border-gold focus:outline-none"
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Tamanhos e Investimento</label>
                <div className="grid grid-cols-2 gap-3">
                  {Object.entries(item.precos).map(([vol, price]) => (
                    <div key={vol} className="space-y-1.5">
                      <label className="text-[9px] font-medium text-muted-foreground">{vol}</label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">R$</span>
                        <input
                          type="text"
                          defaultValue={price?.toFixed(2).replace(".", ",")}
                          onBlur={(e) => handlePriceChange(key, vol as Volume, e.target.value)}
                          className="w-full rounded-lg border border-border/60 bg-background pl-8 pr-4 py-2 text-sm focus:border-gold focus:outline-none"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
