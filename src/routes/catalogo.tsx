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
      <Header />


      <main className="py-10">
        <CatalogViewer perfumes={perfumes} />
      </main>

      <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Dakar Essence. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}
