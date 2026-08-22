Analise toda a aplicaço antes de realizar qualquer alteraço e torne TODAS as páginas, componentes e fluxos 100% responsivos em todos os dispositivos.

Garantir que o sistema funcione perfeitamente em qualquer tamanho de tela: mobile, tablets, notebooks, desktops e ultrawide, sem quebras de layout, overflow ou perda de usabilidade.

Analise:
- Todas as páginas e rotas, layouts, componentes
- Containers, grids, breakpoints atuais
- Width/height fixos, overflow, elementos quebrando
- Tipografia, botões, formulários em diferentes telas
- Modais, dropdowns, menus, imagens, tabelas
- Navegação, sidebar, espaçamentos

Melhorias obrigatórias:
- LAYOUT: Substituir widths fixos, usar Flexbox/Grid, breakpoints consistentes
- MOBILE (prioridade): Espaçamentos, botões adequados para toque, menus mobile, simplificar layouts, tabelas responsivas
- TIPOGRAFIA: Tamanhos por breakpoint, legibilidade, line-height responsivo
- IMAGENS: Fluidas (max-width:100%), sem distorção
- COMPONENTES: Cards responsivos, modais fullscreen no mobile, dropdowns adaptáveis
- FORMULRIOS: Inputs largura correta, botões full-width quando necessário
- NAVEGAÇO: Sidebar colapsável, menus responsivos

Breakpoints: Mobile até 480px, Tablet até 768px, Laptop até 1024px, Desktop 1280px+

Regras: NÃO quebrar funcionalidades, NÃO remover features, NÃO alterar design base. Priorizar adaptação. O sistema deve estar 100% responsivo, sem quebras, com excelente UX mobile e pronto para produço.
import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getHomeConfig, type HomeConfig } from "@/lib/home-config.functions";
import { CollectionShowcase } from "@/components/collection-showcase";
import { Header } from "@/components/header";
import { logoWhite } from "@/lib/constants";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const getCfg = useServerFn(getHomeConfig);
  const { data: config } = useSuspenseQuery<HomeConfig[]>({
    queryKey: ["home-config"],
    queryFn: () => getCfg(),
  });

  const homeMain = config.find((c) => c.key === "home_main");

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      <Header secaoAtiva="home" />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section id="top" className="relative flex min-h-[80vh] flex-col items-center justify-center overflow-hidden px-4 pt-20 text-center sm:px-6">
          <div className="absolute inset-0 z-0 opacity-20">
            <div className="absolute inset-0 bg-radial-gradient from-gold/20 to-transparent" />
          </div>
          
          <div className="relative z-10 max-w-4xl animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <img 
              src={logoWhite} 
              alt="Dakar Essence" 
              className="mx-auto mb-8 h-24 w-auto drop-shadow-2xl sm:h-32 md:h-40" 
            />
            <h1 className="font-display text-4xl font-bold tracking-tight sm:text-6xl md:text-7xl">
              {homeMain?.tituloPrincipal || "Dakar Essence"}
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
              {homeMain?.textoPrincipal || "Perfumes contratipos de alta fixação e concentração. Descubra fragrâncias inspiradas nos maiores clássicos da perfumaria mundial."}
            </p>
            
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <a 
                href="#colecoes" 
                className="rounded-full bg-gold px-8 py-3 font-semibold text-primary-foreground transition hover:brightness-110"
              >
                Explorar Coleções
              </a>
              <a 
                href="/catalogo" 
                className="rounded-full border border-gold/50 bg-card px-8 py-3 font-semibold text-gold transition hover:border-gold hover:bg-gold/5"
              >
                Ver Catálogo Completo
              </a>
            </div>
          </div>
        </section>

        {/* Collections Section */}
        <section id="colecoes" className="bg-muted/30">
          <CollectionShowcase />
        </section>

        {/* Sobre Section */}
        <section id="sobre" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-32">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div className="space-y-6">
              <span className="text-[11px] uppercase tracking-[0.25em] text-gold">Nossa Essência</span>
              <h2 className="font-display text-3xl font-semibold sm:text-4xl md:text-5xl">
                Luxo Acessível em Cada Gota
              </h2>
              <p className="text-lg leading-relaxed text-muted-foreground">
                Na Dakar Essence, acreditamos que fragrâncias extraordinárias não devem ser um privilégio de poucos. Nossa missão é democratizar a alta perfumaria através de contratipos de fidelidade olfativa impressionante.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-border/60 bg-card p-4">
                  <h4 className="font-semibold text-gold">30% de Essência</h4>
                  <p className="text-sm text-muted-foreground">Alta concentração para fixação prolongada.</p>
                </div>
                <div className="rounded-2xl border border-border/60 bg-card p-4">
                  <h4 className="font-semibold text-gold">Fidelidade Olfativa</h4>
                  <p className="text-sm text-muted-foreground">Notas idênticas às grandes marcas mundiais.</p>
                </div>
              </div>
            </div>
            <div className="relative aspect-square overflow-hidden rounded-3xl border border-border/60 bg-muted shadow-2xl">
              <div className="absolute inset-0 bg-gradient-to-tr from-gold/20 to-transparent" />
              <div className="flex h-full items-center justify-center p-12">
                 <img src={logoWhite} alt="Dakar" className="h-32 w-auto opacity-40 grayscale" />
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="bg-card py-20 md:py-32">
          <div className="mx-auto max-w-4xl px-4 sm:px-6">
            <div className="mb-12 text-center">
              <span className="text-[11px] uppercase tracking-[0.25em] text-gold">Dúvidas Frequentes</span>
              <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">FAQ</h2>
            </div>
            
            <div className="space-y-4">
              {[
                { q: "Qual a fixação dos perfumes?", a: "Nossos perfumes possuem 30% de essência (Parfum), garantindo uma fixação de 8 a 12 horas, dependendo do tipo de pele e fragrância." },
                { q: "O que são perfumes contratipos?", a: "São perfumes inspirados em fragrâncias de grifes famosas, utilizando as mesmas notas olfativas para entregar uma experiência idêntica por um preço muito mais acessível." },
                { q: "Como funciona o frete grátis?", a: "Oferecemos frete grátis para pedidos que contenham 3 ou mais produtos das coleções sob encomenda." },
                { q: "Qual o prazo de entrega?", a: "Itens em pronta entrega são enviados imediatamente. Para itens sob encomenda, o prazo de produção é de aproximadamente 6 dias úteis." }
              ].map((item, i) => (
                <div key={i} className="rounded-2xl border border-border/60 bg-background p-6">
                  <h4 className="font-semibold text-foreground">{item.q}</h4>
                  <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 bg-card py-12">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6">
          <img src={logoWhite} alt="Dakar Essence" className="mx-auto h-12 w-auto opacity-50" />
          <p className="mt-4 text-sm text-muted-foreground">
            © {new Date().getFullYear()} Dakar Essence. Todos os direitos reservados.
          </p>
          <div className="mt-6 flex justify-center gap-6">
            <a href="/painel-dakar-a7k9m2" className="text-xs text-muted-foreground hover:text-gold">Acesso Administrativo</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

