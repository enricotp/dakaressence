import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getPerfumes } from "@/lib/perfumes.functions";
import { CatalogViewer } from "@/components/catalog-viewer";
import { logoWhite } from "@/lib/constants";

const perfumesQuery = queryOptions({
  queryKey: ["perfumes"],
  queryFn: () => getPerfumes(),
  staleTime: 0,
});

export const Route = createFileRoute("/catalogo")({
  component: CatalogoPage,
  loader: ({ context }) => context.queryClient.ensureQueryData(perfumesQuery),
  errorComponent: ({ error }) => (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1 className="font-display text-3xl font-semibold">Não foi possível carregar o catálogo</h1>
      <p className="mt-4 text-muted-foreground">{error.message}</p>
    </div>
  ),
});

function CatalogoPage() {
  const { data: perfumes } = useSuspenseQuery(perfumesQuery);

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
          <Link to="/" className="flex min-w-0 items-center" aria-label="Dakar Essence">
            <img src={logoWhite} alt="Dakar Essence" className="h-12 w-auto sm:h-16 md:h-24" />
          </Link>
          
          <nav className="flex items-center gap-6">
            <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            <div className="rounded-full bg-gold px-4 py-2 text-sm font-medium text-primary-foreground">
              Catálogo
            </div>
            <a href="/#sobre" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:inline">
              Sobre
            </a>
          </nav>
        </div>
      </header>

      <main className="py-10">
        <CatalogViewer perfumes={perfumes} />
      </main>

      <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Dakar Essence. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
