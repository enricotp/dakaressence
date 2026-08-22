import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { type Colecao, type Volume } from "@/lib/perfumes.functions";
import { formatBRL } from "@/lib/format";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getHomeConfig, type HomeConfig } from "@/lib/home-config.functions";
import { ChevronLeft, ChevronRight } from "lucide-react";


interface CollectionData {
  id: Colecao;
  name: string;
  description: string;
  sizes: { label: Volume; price: number }[];
  imagens?: string[];
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
  const { data: config } = useSuspenseQuery<HomeConfig[]>({
    queryKey: ["home-config"],
    queryFn: () => getCfg(),
  });

  const mergedData = COLLECTION_SHOWCASE_DATA.map((base) => {
    const notion = config.find((c: HomeConfig) => c.key === base.id.toLowerCase().replace(/\s+/g, "_"));
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
      imagens: notion.imagens || [],
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

      <div className="grid gap-8">
        {mergedData.map((collection) => (
          <CollectionCard key={collection.id} collection={collection} />
        ))}
      </div>
    </section>
  );
}

function CollectionCarousel({ images, collectionName }: { images: string[], collectionName: string }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (images.length <= 1 || isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [images.length, isPaused]);

  if (images.length === 0) return null;

  return (
    <div 
      className="relative aspect-square w-full shrink-0 overflow-hidden rounded-2xl border border-border/40 bg-muted/20 md:w-56 lg:w-64"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
    >
      <div 
        className="flex h-full transition-transform duration-700 ease-in-out" 
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {images.map((src, i) => (
          <div key={i} className="flex h-full w-full shrink-0 items-center justify-center p-1 sm:p-2">
            <img
              src={src}
              alt={`Exemplo visual da coleção ${collectionName} - ${i + 1}`}
              className="h-full w-full object-contain"
              loading="lazy"
            />
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <>
          <button
            onClick={() => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/60 p-2 text-foreground/80 shadow-sm backdrop-blur-sm transition-all hover:bg-background hover:text-foreground active:scale-95"
            aria-label="Imagem anterior"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % images.length)}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/60 p-2 text-foreground/80 shadow-sm backdrop-blur-sm transition-all hover:bg-background hover:text-foreground active:scale-95"
            aria-label="Próxima imagem"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-1.5 w-1.5 rounded-full transition-all ${
                  i === currentIndex ? "w-4 bg-gold" : "bg-gold/30"
                }`}
                aria-label={`Ir para imagem ${i + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
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
    <div className="group relative flex flex-col rounded-3xl border border-border/60 bg-card p-6 transition-all hover:border-gold/30 hover:shadow-xl sm:p-8 md:flex-row md:gap-8">
      {collection.imagens && collection.imagens.length > 0 && (
        <CollectionCarousel images={collection.imagens} collectionName={collection.name} />
      )}
      <div className="flex flex-1 flex-col">
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
    </div>
  );
}

