import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { type Colecao, type Volume } from "@/lib/perfumes.functions";
import { formatBRL } from "@/lib/format";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getHomeConfig } from "@/lib/home-config.functions";


interface CollectionData {
  id: Colecao;
  name: string;
  description: string;
  sizes: { label: Volume; price: number }[];
}

const COLLECTION_SHOWCASE_DATA: CollectionData[] = [
  {
    id: "Signature",
    name: "Signature",
    description: "Perfumes contratipo com 30% de essência, disponíveis em 50 ml e 100 ml.",
    sizes: [
      { label: "50ml", price: 149.90 },
      { label: "100ml", price: 229.90 },
    ],
  },
  {
    id: "Brand Collection",
    name: "Brand Collection",
    description: "Uma seleção especial de fragrâncias marcantes, criada para quem busca personalidade, presença e sofisticação.",
    sizes: [
      { label: "25ml", price: 89.90 },
    ],
  },
  {
    id: "Arabic Collection",
    name: "Arabic Collection",
    description: "Fragrâncias intensas e envolventes inspiradas na perfumaria árabe, com combinações marcantes e personalidade única.",
    sizes: [
      { label: "25ml", price: 159.90 },
    ],
  },
  {
    id: "Dream Brand Collection",
    name: "Dream Brand Collection",
    description: "Uma coleção especial de fragrâncias selecionadas para proporcionar uma experiência sofisticada e memorável.",
    sizes: [
      { label: "80ml", price: 199.90 },
      { label: "100ml", price: 249.90 },
    ],
  },
];

export function CollectionShowcase() {
  const getCfg = useServerFn(getHomeConfig);
  const { data: config = [] } = useQuery({
    queryKey: ["home-config"],
    queryFn: () => getCfg(),
  });

  const mergedData = COLLECTION_SHOWCASE_DATA.map((base) => {
    const notion = config.find((c) => c.key === base.id.toLowerCase().replace(/\s+/g, "_"));
    if (!notion) return base;

    const sizes = base.sizes.map((s) => ({
      ...s,
      price: notion.precos[s.label] ?? s.price,
    }));

    return {
      ...base,
      name: notion.nome || base.name,
      description: notion.descricao || base.description,
      sizes,
    };
  });

  return (
    <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 md:py-24">
      <div className="mb-12 text-center">
        <span className="text-[11px] uppercase tracking-[0.25em] text-gold">Nossas Coleções</span>
        <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl md:text-5xl">
          Escolha seu Estilo
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          Descubra a fragrância que mais combina com você através de nossas coleções exclusivas.
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {mergedData.map((collection) => (
          <CollectionCard key={collection.id} collection={collection} />
        ))}
      </div>
    </section>
  );
}

function CollectionCard({ collection }: { collection: CollectionData }) {
  const navigate = useNavigate();
  const [selectedSize, setSelectedSize] = useState<Volume>(collection.sizes[0].label);
  
  const currentPrice = collection.sizes.find(s => s.label === selectedSize)?.price ?? 0;

  const handleDiscover = () => {
    navigate({
      to: "/catalogo",
      search: {
        colecao: collection.id,
        volume: selectedSize
      }
    });
  };

  return (
    <div className="group relative flex flex-col rounded-3xl border border-border/60 bg-card p-6 transition-all hover:border-gold/30 hover:shadow-xl sm:p-8">
      <div className="mb-6">
        <h3 className="font-display text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {collection.name}
        </h3>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
          {collection.description}
        </p>
      </div>

      <div className="mt-auto space-y-6">
        <div>
          <label className="mb-3 block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Tamanho disponível
          </label>
          <div className="inline-flex rounded-xl border border-border/60 bg-background/50 p-1">
            {collection.sizes.map((size) => (
              <button
                key={size.label}
                type="button"
                onClick={() => setSelectedSize(size.label)}
                className={`relative min-w-[80px] rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  selectedSize === size.label
                    ? "bg-gold text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-foreground/5 hover:text-foreground"
                }`}
              >
                {size.label.replace('ml', ' ml')}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-end justify-between border-t border-border/40 pt-6">
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Investimento
            </span>
            <div className="mt-1 text-3xl font-bold text-gold sm:text-4xl">
              {formatBRL(currentPrice)}
            </div>
          </div>
          <button
            type="button"
            onClick={handleDiscover}
            className="inline-flex h-12 items-center justify-center rounded-full bg-foreground px-6 text-sm font-semibold text-background transition hover:bg-gold hover:text-primary-foreground"
          >
            Descobrir Fragrâncias
          </button>
        </div>
      </div>
    </div>
  );
}

