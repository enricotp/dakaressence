import { createFileRoute, Link } from "@tanstack/react-router";
/**
  * Plano: Melhorias Dakar Essence — Fase 2 (Parte 2 de 3)
  * 
  * Contexto
  * 
  * Banco de perfumes no Notion: 38858811-29ca-83c5-b57d-0102c05505b1
  * 
  * Google Sheets: 1YDXLWaevUB9LnrQGImIV9iGBT9ayCbZYdkzaWkXZrWw
  * 
  * Esta é somente a Parte 2 de 3.
  * 
  * A Parte 1, referente à numeração permanente dos perfumes e à calculadora, deve ser preservada.
  * 
  * A lógica avançada de movimentação de estoque ficará para a Parte 3.
  * 
  * Não alterar os textos comerciais, nomes, descrições ou preços atuais sem necessidade. Nesta etapa, o objetivo é fazer os campos editáveis do painel realmente controlarem o site público.
  * 
  * 1. Telefone/WhatsApp no checkout
  * 
  * Adicionar ao checkout do CartDrawer um campo obrigatório chamado:
  * 
  * Telefone/WhatsApp
  * 
  * Requisitos:
  * 
  * Posicionar o campo após o nome do cliente.
  * 
  * Aplicar a máscara visual (99) 99999-9999.
  * 
  * Antes de salvar, remover espaços, parênteses, traços e qualquer outro símbolo.
  * 
  * Validar telefone celular brasileiro com DDD e 11 dígitos.
  * 
  * Exibir uma mensagem clara quando o número estiver incompleto ou inválido.
  * 
  * Impedir a finalização do pedido enquanto o campo obrigatório estiver inválido.
  * 
  * Salvar apenas os dígitos do telefone.
  * 
  * Não salvar o prefixo 55 na planilha; adicioná-lo somente ao criar links para o WhatsApp.
  * 
  * 2. Integração com o Google Sheets
  * 
  * A aba atual de pedidos contém estas colunas:
  * 
  * ID, Data, Cliente, Itens, Total, Pagamento, Parcelas, Status
  * 
  * Não assumir que Telefone estará em uma letra ou posição fixa.
  * 
  * Implementar o seguinte:
  * 
  * Ler primeiro os cabeçalhos da aba de pedidos.
  * 
  * Procurar a coluna pelo nome exato Telefone.
  * 
  * Caso ela não exista, acrescentá-la depois da última coluna ocupada.
  * 
  * Passar a localizar todas as colunas importantes pelo nome do cabeçalho, e não por índices fixos.
  * 
  * Salvar o telefone na coluna correspondente ao criar um novo pedido.
  * 
  * Não sobrescrever informações existentes.
  * 
  * Manter compatibilidade com os pedidos antigos, que não possuem telefone.
  * 
  * Não quebrar Analytics, rastreamento, calculadora ou leitura dos pedidos existentes.
  * 
  * 3. Telefone no resumo enviado pelo WhatsApp
  * 
  * Atualizar o resumo gerado no checkout para incluir:
  * 
  * Telefone/WhatsApp: (XX) XXXXX-XXXX
  * 
  * Esse telefone também deve permanecer salvo no pedido, para que possa ser consultado posteriormente no painel.
  * 
  * Preservar o restante do formato atual da mensagem, principalmente:
  * 
  * ID do pedido;
  * 
  * nome do cliente;
  * 
  * números dos perfumes;
  * 
  * nomes;
  * 
  * quantidades;
  * 
  * forma de pagamento;
  * 
  * demais dados atualmente utilizados pela calculadora.
  * 
  * 4. Telefone no painel administrativo
  * 
  * Na aba Pedidos do painel:
  * 
  * Exibir o telefone do cliente.
  * 
  * Incluir o telefone na busca de pedidos.
  * 
  * A busca deve funcionar com ou sem máscara, comparando somente os dígitos.
  * 
  * Adicionar o botão “Falar com o cliente”.
  * 
  * O botão deve abrir:
  * 
  * https://wa.me/55NUMERO
  * 
  * Exemplo: o telefone (11) 98765-4321 deve gerar https://wa.me/5511987654321.
  * 
  * Para pedidos antigos sem telefone, mostrar Telefone não informado.
  * 
  * Não exibir o botão do WhatsApp quando não houver um número válido.
  * 
  * 5. Corrigir a sincronização entre o painel Admin e a página pública
  * 
  * Existe atualmente um problema importante:
  * 
  * As alterações feitas na seção Página Inicial do painel administrativo são salvas ou aparentam ser salvas, mas não aparecem na página disponível ao público.
  * 
  * Alterar título, introdução, nomes das coleções, descrições, tamanhos ou valores pelo painel não está atualizando corretamente a página inicial pública.
  * 
  * Investigue e corrija todo o fluxo de dados:
  * 
  * Formulário do Admin → Função de servidor → Fonte de persistência → Carregamento da página pública
  * 
  * Verificar especialmente:
  * 
  * Se o botão de salvar realmente chama a função correta.
  * 
  * Se a função grava as informações na fonte de dados esperada.
  * 
  * Se existem erros sendo ignorados.
  * 
  * Se o painel mostra sucesso antes da confirmação real do backend.
  * 
  * Se src/routes/index.tsx still usa informações fixas no código.
  * 
  * Se o painel e a página pública estão lendo fontes de dados diferentes.
  * 
  * Se existe cache impedindo a atualização.
  * 
  * Se a página pública está utilizando dados antigos carregados durante o build.
  * 
  * Se os nomes das propriedades salvas são os mesmos nomes procurados na leitura.
  * 
  * Se, após recarregar o painel, aparecem os dados realmente persistidos ou apenas valores mantidos no estado local.
  * 
  * 6. Fonte única de verdade para a página inicial
  * 
  * Os campos editáveis da seção Página Inicial do Admin devem se tornar a fonte oficial das informações exibidas no site público.
  * 
  * Isso inclui, conforme os campos existentes no painel:
  * 
  * título principal;
  * 
  * texto de introdução;
  * 
  * nome de cada coleção;
  * 
  * descrição de cada coleção;
  * 
  * tamanhos disponíveis;
  * 
  * valores apresentados;
  * 
  * outras informações públicas que já sejam editáveis nessa seção.
  * 
  * Regras:
  * 
  * Não manter uma segunda cópia fixa desses mesmos dados em src/routes/index.tsx.
  * 
  * Substituir os valores fixos somente nos pontos controlados pelo painel.
  * 
  * Não reescrever nem modificar a copy atual.
  * 
  * Apenas fazer o conteúdo salvo no painel aparecer corretamente no site público.
  * 
  * Manter valores padrão somente quando ainda não existir nenhuma configuração salva.
  * 
  * Um erro de carregamento não deve ser tratado silenciosamente como ausência de configuração.
  * 
  * Não expor informações internas, credenciais ou configurações privadas na rota pública.
  * 
  * 7. Salvamento confiável no Admin
  * 
  * Ao salvar alterações na página inicial:
  * 
  * Desabilitar o botão durante o processamento.
  * 
  * Enviar as informações ao backend.
  * 
  * Aguardar a confirmação da persistência.
  * 
  * Ler novamente os dados salvos para confirmar.
  * 
  * Mostrar sucesso somente se a gravação for confirmada.
  * 
  * Exibir erro claro se alguma etapa falhar.
  * 
  * Atualizar o estado do formulário com os dados confirmados pelo backend.
  * 
  * Invalidar ou atualizar qualquer cache utilizado pela página pública.
  * 
  * Evitar mensagens de sucesso otimistas quando o backend não tiver confirmado a alteração.
  * 
  * Se existir sistema de logs, registrar:
  * 
  * data e hora;
  * 
  * usuário responsável;
  * 
  * campos alterados;
  * 
  * valor anterior;
  * 
  * novo valor;
  * 
  * resultado da operação.
  * 
  * 8. Atualização da página pública
  * 
  * Depois de uma alteração confirmada no painel:
  * 
  * A página pública deve mostrar os novos dados ao ser atualizada.
  * 
  * Abrir o site em uma nova aba ou sessão também deve mostrar os dados novos.
  * 
  * Se houver cache no loader, na rota ou na infraestrutura, implementar invalidação ou revalidação.
  * 
  * Uma implantação nova não pode ser necessária para atualizar textos ou preços.
  * 
  * O painel deve continuar mostrando os valores persistidos depois de sair, entrar novamente ou recarregar a página.
  * 
  * 9. Proteção contra sobrescrita
  * 
  * Verificar se o formulário envia uma configuração completa baseada em dados antigos.
  * 
  * Se houver risco de um campo antigo sobrescrever uma alteração mais recente:
  * 
  * atualizar somente os campos enviados;
  * 
  * mesclar as alterações com a configuração atual;
  * 
  * ou utilizar controle de versão/data da última atualização.
  * 
  * Não apagar campos existentes quando eles não fizerem parte da alteração atual.
  * 
  * Arquivos principais a verificar
  * 
  * src/components/cart-drawer.tsx
  * 
  * src/lib/orders.functions.ts
  * 
  * src/routes/painel-dakar-a7k9m2.tsx
  * 
  * src/routes/index.tsx
  * 
  * funções de servidor responsáveis pelas configurações da página inicial;
  * 
  * conectores do Notion ou Google Sheets utilizados por essa configuração;
  * 
  * loaders, cache e mecanismos de revalidação da página pública.
  * 
  * Limites desta parte
  * 
  * Não implementar nesta etapa:
  * 
  * reserva de unidades em pedidos pendentes;
  * 
  * movimentação protegida de estoque;
  * 
  * compensação de falhas de estoque;
  * 
  * aba MovimentacoesEstoque;
  * 
  * aviso ou comportamento especial para última unidade;
  * 
  * novas alterações na calculadora;
  * 
  * nova migração da numeração dos perfumes;
  * 
  * mudanças nos textos comerciais atuais.
  * 
  * Preservar integralmente o que já foi implementado na Parte 1.
  * 
  * Verificação obrigatória
  * 
  * Realizar testes para confirmar:
  * 
  * O checkout exige um telefone válido.
  * 
  * A máscara funciona sem alterar o valor normalizado.
  * 
  * O telefone é salvo na coluna correta do Google Sheets.
  * 
  * A coluna é localizada pelo cabeçalho, não por uma posição fixa.
  * 
  * Pedidos antigos continuam sendo carregados normalmente.
  * 
  * O telefone aparece no painel.
  * 
  * A busca por telefone funciona com e sem máscara.
  * 
  * O botão “Falar com o cliente” abre o número correto no WhatsApp.
  * 
  * O resumo do pedido enviado pelo WhatsApp inclui o telefone.
  * 
  * Alterar o título no Admin atualiza o título público.
  * 
  * Alterar uma descrição atualiza a descrição pública.
  * 
  * Alterar tamanho ou valor atualiza a informação pública.
  * 
  * As alterações permanecem depois de recarregar o painel.
  * 
  * As alterações aparecem em uma nova sessão ou aba anônima.
  * 
  * Nenhuma implantação é necessária para atualizar as informações.
  * 
  * Um erro no backend não gera uma mensagem falsa de sucesso.
  * 
  * Nenhuma parte implementada na Parte 1 foi quebrada.
  * 
  * Ao finalizar, apresente um relatório contendo:
  * 
  * A causa encontrada para o painel não atualizar a página pública.
  * 
  * A fonte de dados utilizada como fonte única de verdade.
  * 
  * Os arquivos modificados.
  * 
  * Como o cache ou a revalidação foram tratados.
  * 
  * Os testes realizados e seus resultados.
  */
import { logoWhite } from "@/lib/constants";
import { useCart } from "@/lib/cart-context";
import { CollectionShowcase } from "@/components/collection-showcase";
import { Header } from "@/components/header";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getHomeConfig } from "@/lib/home-config.functions";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData({
      queryKey: ["home-config"],
      queryFn: () => getHomeConfig(),
    });
  },
  component: Index,
});

function Index() {
  const { cartCount, open } = useCart();
  const getCfg = useServerFn(getHomeConfig);
  const { data: config } = useSuspenseQuery({
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
