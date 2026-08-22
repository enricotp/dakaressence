export default function Index() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4 text-center">
      <h1 className="text-2xl font-bold">Dakar Essence</h1>
      <p className="mt-2 text-muted-foreground">Sistema de Gestão e Catálogo</p>
      <div className="mt-8 flex gap-4">
        <a href="/catalogo" className="rounded-full bg-gold px-6 py-2 font-semibold text-primary-foreground">Ver Catálogo</a>
        <a href="/painel-dakar-a7k9m2" className="rounded-full border border-gold px-6 py-2 font-semibold text-gold">Painel Admin</a>
      </div>
    </div>
  );
}
