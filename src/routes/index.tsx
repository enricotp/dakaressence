import { createFileRoute, Link } from "@tanstack/react-router";
/**
  * Dakar Essence — Parte 1 de 3
  * 
  * Números permanentes dos perfumes e correção da calculadora
  * 
  * Implemente somente esta primeira parte. Não altere telefone, checkout, regras de estoque, última unidade, movimentações ou textos de marketing neste momento.
  * 
  * Objetivos
  * 
  * Criar um número permanente e único para cada perfume na database do Notion.
  * 
  * Parar de gerar Nº XXX pela posição do perfume na consulta.
  * 
  * Preservar corretamente os números nos pedidos.
  * 
  * Corrigir a calculadora para identificar o perfume pelo número permanente.
  * 
  * Impedir cálculos silenciosos com produtos errados.
  * 
  * 1. Criar a coluna Número no Notion
  * 
  * Database de perfumes:
  * 
  * 38858811-29ca-83c5-b57d-0102c05505b1
  * 
  * Crie, caso ainda não exista, uma nova propriedade:
  * 
  * Nome: Número
  * 
  * Tipo: number
  * 
  * O valor deve ser armazenado como número puro, por exemplo:
  * 
  * 1
  * 
  * 25
  * 
  * 439
  * 
  * Na interface, ele deve ser formatado como:
  * 
  * Nº 001
  * 
  * Nº 025
  * 
  * Nº 439
  * 
  * Não armazene Nº nem zeros à esquerda dentro do Notion.
  * 
  * 2. Não preencher a coluna antes da aprovação
  * 
  * Pode criar a propriedade Número, mas não preencha os perfumes imediatamente.
  * 
  * Primeiro, gere um relatório completo contendo:
  * 
  * ID da página do perfume no Notion;
  * 
  * nome;
  * 
  * marca;
  * 
  * coleção;
  * 
  * volume;
  * 
  * número atualmente exibido pelo sistema;
  * 
  * número permanente proposto;
  * 
  * situação da propriedade Número;
  * 
  * possíveis conflitos;
  * 
  * possíveis duplicidades;
  * 
  * perfumes sem número;
  * 
  * perfumes repetidos ou suspeitos.
  * 
  * O “número atualmente exibido” deve ser capturado usando exatamente a mesma ordenação que o site utiliza hoje para gerar os números por índice.
  * 
  * Se a propriedade Número já existir e algum perfume já possuir valor, não sobrescreva. Inclua isso no relatório.
  * 
  * Apresente o relatório e aguarde minha aprovação antes de gravar qualquer número nos perfumes.
  * 
  * 3. Regras do número permanente
  * 
  * Depois que eu aprovar o relatório:
  * 
  * Grave os números propostos na propriedade Número.
  * 
  * Cada perfume deve possuir apenas um número.
  * 
  * Cada número deve pertencer a apenas um perfume.
  * 
  * Bloqueie números duplicados.
  * 
  * O número não pode mudar quando a consulta do Notion for reordenada.
  * 
  * O número não pode mudar quando outro perfume for criado, editado, excluído ou arquivado.
  * 
  * Um número já utilizado não deve ser atribuído automaticamente a outro perfume.
  * 
  * Novos perfumes devem receber automaticamente o próximo número nunca utilizado.
  * 
  * O painel administrativo deve permitir visualizar o número.
  * 
  * A edição manual do número deve verificar duplicidade antes de salvar.
  * 
  * Se o número já tiver sido usado em pedidos, mostrar um aviso forte antes de permitir alteração.
  * 
  * Verifique novamente a unicidade no servidor imediatamente antes de criar ou atualizar o perfume.
  * 
  * Não confie apenas na validação visual do frontend.
  * 
  * 4. Controle do próximo número
  * 
  * Não dependa apenas da posição do item nem de quantidade de perfumes + 1.
  * 
  * Utilize o maior número já atribuído como base e preserve o maior número histórico utilizado, inclusive quando um perfume for arquivado.
  * 
  * Se a consulta normal do Notion não retornar páginas arquivadas, use um contador persistente na fonte de configurações já existente ou outro mecanismo persistente dentro da arquitetura atual.
  * 
  * Não crie outra database sem antes explicar a necessidade.
  * 
  * O objetivo é impedir que o número de um perfume arquivado seja reutilizado por um novo perfume.
  * 
  * 5. Atualizar o backend de perfumes
  * 
  * Arquivo principal:
  * 
  * src/lib/perfumes.functions.ts
  * 
  * Atualize:
  * 
  * tipo/interface Perfume;
  * 
  * leitura da propriedade Número;
  * 
  * criação de perfume;
  * 
  * edição de perfume;
  * 
  * validação de duplicidade;
  * 
  * atribuição automática de novos números;
  * 
  * tratamento de perfumes antigos temporariamente sem número.
  * 
  * Durante a migração, o sistema pode manter um fallback temporário para os perfumes ainda sem Número, mas esse fallback deve ser claramente identificado como temporário e removido depois que todos forem migrados.
  * 
  * Não volte a usar o índice como número definitivo.
  * 
  * 6. Atualizar todas as exibições
  * 
  * Depois da migração aprovada, substitua o número baseado em índice pelo valor da propriedade Número em:
  * 
  * catálogo;
  * 
  * cards dos perfumes;
  * 
  * página individual;
  * 
  * carrinho;
  * 
  * resumo do checkout;
  * 
  * mensagem enviada ao WhatsApp;
  * 
  * painel administrativo;
  * 
  * formulário de edição;
  * 
  * cadastro de novo perfume;
  * 
  * calculadora;
  * 
  * favoritos;
  * 
  * qualquer filtro, link ou componente que mostre Nº XXX.
  * 
  * Crie uma função única de formatação para evitar implementações diferentes, por exemplo:
  * 
  * formatarNumeroPerfume(1) -> "Nº 001"
  * 
  * Não duplique essa lógica em vários componentes.
  * 
  * 7. Preservar o histórico dos pedidos
  * 
  * Quando um pedido for criado, salve uma fotografia dos dados do produto naquele momento:
  * 
  * número;
  * 
  * ID interno do perfume;
  * 
  * nome;
  * 
  * marca;
  * 
  * coleção;
  * 
  * volume;
  * 
  * quantidade;
  * 
  * preço unitário.
  * 
  * Pedidos antigos devem continuar mostrando os dados registrados quando foram feitos.
  * 
  * Se um perfume mudar de nome, preço, volume, coleção ou número posteriormente, o histórico do pedido não deve mudar.
  * 
  * Não reescreva nem migre silenciosamente os números presentes em pedidos antigos.
  * 
  * 8. Corrigir a calculadora
  * 
  * Arquivo:
  * 
  * src/components/calculadora-panel.tsx
  * 
  * A calculadora atualmente utiliza Regex e busca aproximada por nome. O fuzzy search deve continuar existindo, mas apenas como fallback.
  * 
  * Nova ordem de identificação:
  * 
  * Quando a linha possuir Nº XXX
  * 
  * Extrair o número usando Regex.
  * 
  * Converter para valor numérico.
  * 
  * Buscar correspondência exata na propriedade Número.
  * 
  * Localizar apenas o perfume que possui aquele número.
  * 
  * Conferir se o nome recebido é compatível com o produto encontrado.
  * 
  * Se número e nome forem compatíveis, calcular normalmente.
  * 
  * Se o número existir, mas o nome divergir, mostrar um aviso de divergência.
  * 
  * Não substituir silenciosamente por outro perfume.
  * 
  * Se o número não existir, mostrar “Número de perfume não encontrado”.
  * 
  * Quando houver número, o fuzzy search não pode substituir o resultado.
  * 
  * Quando a linha não possuir número
  * 
  * Utilizar fuzzy search pelo nome.
  * 
  * Remover acentos, espaços extras e símbolos apenas para comparação.
  * 
  * Se existir uma única correspondência confiável, permitir o cálculo.
  * 
  * Se existirem várias opções possíveis, não escolher automaticamente.
  * 
  * Exibir uma seleção manual contendo:
  * 
  * número;
  * 
  * nome;
  * 
  * marca;
  * 
  * coleção;
  * 
  * volume;
  * 
  * preço.
  * 
  * Se não houver correspondência confiável, destacar a linha como não identificada.
  * 
  * 9. Corrigir o erro real encontrado
  * 
  * Foi identificado este erro:
  * 
  * Entrada:
  * 
  * 2x Angel (Nº 439)
  * 
  * O sistema recebeu o Nº 439, mas escolheu outro perfume chamado Angel, de outro volume ou coleção, com preço diferente.
  * 
  * Depois da correção:
  * 
  * A calculadora deve buscar exatamente o perfume cuja propriedade Número seja 439.
  * 
  * O nome “Angel” serve somente para conferir a correspondência.
  * 
  * Outro Angel nunca poderá substituir o Nº 439.
  * 
  * O preço deve vir do perfume Nº 439.
  * 
  * Se o Nº 439 e o nome recebido divergirem, o sistema deve interromper aquele item e pedir confirmação.
  * 
  * 10. Interface da calculadora
  * 
  * Para cada linha processada, mostre:
  * 
  * quantidade;
  * 
  * número;
  * 
  * nome;
  * 
  * coleção;
  * 
  * volume;
  * 
  * preço unitário;
  * 
  * subtotal;
  * 
  * forma de identificação:
  * 
  * Correspondência exata por número;
  * 
  * Correspondência aproximada por nome;
  * 
  * Selecionado manualmente;
  * 
  * Não identificado;
  * 
  * Divergência entre nome e número.
  * 
  * Não permita calcular o total final enquanto existir item ambíguo, divergente ou não identificado.
  * 
  * Mantenha:
  * 
  * extração do ID do pedido;
  * 
  * nome do cliente;
  * 
  * quantidades;
  * 
  * cálculo do Pix;
  * 
  * cálculo do cartão;
  * 
  * parcelamento em até 12 vezes.
  * 
  * 11. Testes obrigatórios
  * 
  * Teste pelo menos:
  * 
  * Número permanente não muda após reordenar o Notion.
  * 
  * Número não muda após cadastrar outro perfume.
  * 
  * Número não muda após arquivar outro perfume.
  * 
  * Tentativa de cadastrar número duplicado.
  * 
  * Tentativa de editar para um número já existente.
  * 
  * Novo perfume recebendo o próximo número nunca utilizado.
  * 
  * Perfumes com o mesmo nome e volumes diferentes.
  * 
  * Perfumes com o mesmo nome em coleções diferentes.
  * 
  * Angel Nº 439.
  * 
  * 1 Million Nº 447.
  * 
  * Nome correto com número correto.
  * 
  * Nome errado com número correto.
  * 
  * Número inexistente.
  * 
  * Nome sem número.
  * 
  * Nome com acento.
  * 
  * Nome sem acento.
  * 
  * Fuzzy search com uma correspondência.
  * 
  * Fuzzy search com várias correspondências.
  * 
  * Linha impossível de identificar.
  * 
  * Pedido antigo preservando seu número e preço históricos.
  * 
  * 12. Limites desta parte
  * 
  * Não implementar nesta etapa:
  * 
  * campo de telefone;
  * 
  * alteração das colunas da planilha de pedidos;
  * 
  * reserva de estoque;
  * 
  * última unidade;
  * 
  * baixa ou devolução de estoque;
  * 
  * aba MovimentacoesEstoque;
  * 
  * mudanças nos status dos pedidos;
  * 
  * mudanças nos textos da página inicial;
  * 
  * mudanças nos preços.
  * 
  * Entrega esperada
  * 
  * Primeiro:
  * 
  * Crie somente a propriedade vazia Número, caso ela não exista.
  * 
  * Gere o relatório de migração.
  * 
  * Mostre conflitos, duplicidades e números propostos.
  * 
  * Liste todos os arquivos que precisarão ser alterados.
  * 
  * Aguarde minha aprovação.
  * 
  * Não preencha os números no Notion e não publique a nova lógica antes de eu aprovar o relatório.
 */
import { logoWhite } from "@/lib/constants";
import { useCart } from "@/lib/cart-context";
import { CollectionShowcase } from "@/components/collection-showcase";
import { Header } from "@/components/header";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getHomeConfig } from "@/lib/home-config.functions";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { cartCount, open } = useCart();
  const getCfg = useServerFn(getHomeConfig);
  const { data: config = [] } = useQuery({
    queryKey: ["home-config"],
    queryFn: () => getCfg(),
  });

  const homeMain = config.find((c) => c.key === "home_main");
  const titulo = homeMain?.tituloPrincipal || "A mesma essência, metade do preço.";
  const descricao = homeMain?.textoPrincipal || "Perfumes contratipos com alta concentração e fixação premium. Monte seu pedido e finalize direto no WhatsApp.";

  const splitTitulo = (text: string) => {
    const parts = text.split(",");
    if (parts.length < 2) return { main: text, highlighted: "" };
    return { main: parts[0] + ",", highlighted: parts.slice(1).join(",") };
  };

  const { main, highlighted } = splitTitulo(titulo);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />


      {/* Hero */}
      <section id="top" className="relative overflow-hidden">
        <div className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6 sm:py-20 md:py-28">
          <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-gold">
            <span className="h-1 w-1 rounded-full bg-gold" /> Coleção 2026
          </span>
          <h1 className="font-display text-4xl font-semibold leading-[1.05] tracking-tight sm:text-5xl md:text-7xl">
            {main}{" "}
            <span className="bg-gradient-to-r from-gold to-gold-soft bg-clip-text text-transparent">
              {highlighted}
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
            {descricao}
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:mt-10 sm:flex-row sm:flex-wrap sm:justify-center sm:gap-4">
            <Link
              to="/catalogo"
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full bg-gold px-6 py-3 text-sm font-semibold text-primary-foreground transition hover:brightness-110 sm:w-auto"
            >
              Ver catálogo
            </Link>
            <button
              type="button"
              onClick={open}
              className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-border px-6 py-3 text-sm font-medium transition hover:border-gold hover:text-gold sm:w-auto"
            >
              Meu carrinho ({cartCount})
            </button>
          </div>
        </div>
      </section>

      <CollectionShowcase />

      {/* Sobre */}
      <section id="sobre" className="border-t border-border/60 bg-card/40 py-14 sm:py-20 md:py-24">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 md:grid-cols-2 md:gap-12">
          <div>
            <span className="text-[11px] uppercase tracking-[0.25em] text-gold">Sobre nós</span>
            <h2 className="mt-3 font-display text-3xl font-semibold leading-tight sm:text-4xl md:text-5xl">
              Fragrâncias de luxo, sem o preço do luxo.
            </h2>
          </div>
          <div className="space-y-4 text-muted-foreground">
            <p>
              Trabalhamos com essências importadas da mesma origem das grandes
              casas de perfumaria. Cada frasco é preparado com 30% de
              concentração, garantindo fixação superior a 12 horas na pele.
            </p>
            <p>
              Nosso compromisso é entregar a mesma experiência olfativa dos
              perfumes originais, com transparência sobre o que é um contratipo.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-border/60 py-14 sm:py-20 md:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <span className="text-[11px] uppercase tracking-[0.25em] text-gold">Dúvidas</span>
          <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl md:text-5xl">
            Perguntas frequentes
          </h2>
          <div className="mt-10 divide-y divide-border/60 sm:mt-12">
            {[
              { q: "Como faço meu pedido?", a: "Adicione os perfumes ao carrinho, abra o carrinho e clique em Pedir no WhatsApp. A mensagem já vai pronta com o que você escolheu." },
              { q: "Qual a fixação?", a: "Em média 10 a 14 horas, com 30% de concentração." },
              { q: "Do que são feitos os perfumes?", a: "Todos os perfumes são à base de óleo e linalol, com fixador importado." },
              { q: "Entregam para todo o Brasil?", a: "Por enquanto entregamos apenas para Sorocaba e região." },
            ].map((item) => (
              <details key={item.q} className="group py-5 sm:py-6">
                <summary className="flex cursor-pointer items-center justify-between gap-4 font-display text-base font-medium sm:text-lg">
                  <span className="min-w-0">{item.q}</span>
                  <span className="shrink-0 text-gold transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm text-muted-foreground sm:text-base">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-border/60 py-8 pb-24 sm:py-10 md:pb-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground sm:px-6 md:flex-row">
          <div className="flex items-center">
            <Link to="/" hash="top">
              <img src={logoWhite} alt="Dakar Essence" className="h-12 w-auto sm:h-16" />
            </Link>
          </div>
          <p className="text-center text-xs sm:text-sm">© {new Date().getFullYear()} Dakar Essence. Todos os direitos reservados.</p>
          <div />
        </div>
      </footer>

    </div>
  );
}
