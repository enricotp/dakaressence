# Plano de Ajustes de Responsividade Dakar Essence

Este plano visa corrigir problemas de layout em dispositivos móveis, garantindo uma experiência fluida e profissional em todas as telas, conforme solicitado.

## Ajustes Propostos

### 1. Botão "Descobrir Fragrâncias" (Página Inicial)
- **Local:** `src/components/collection-showcase.tsx`
- **Problema:** Botão muito grande e desalinhado no mobile.
- **Solução:** 
  - Ajustar a largura para ser proporcional ao container no mobile (`w-full` com `max-w` ou `flex-1`).
  - Centralizar texto e equilibrar altura.
  - Garantir que não cause quebra de layout ou rolagem horizontal.

### 2. Tags dos Cards de Perfume (Catálogo)
- **Local:** `src/components/catalog-viewer.tsx`
- **Problema:** Sobreposição entre a tag "Última unidade" e o número do perfume.
- **Solução:**
  - Reposicionar a tag de disponibilidade (Pronta entrega / Sob encomenda / Última unidade) para o **canto inferior esquerdo** no mobile.
  - Manter o número/volume no topo esquerdo.
  - Garantir que as tags não cubram elementos vitais (imagem, nome, preço, botões).
  - Ajustar fontes e padding para legibilidade em telas pequenas (320px+).

### 3. Revisão Geral Mobile
- **Header:** Ajustar logo e botões para evitar quebra em telas muito estreitas.
- **Grid de Produtos:** Verificar espaçamentos (`gap`) e paddings laterais.
- **Carrinho:** Ajustar o drawer e itens para melhor aproveitamento de espaço em telas pequenas.
- **Página de Detalhes:** Garantir que imagens e pirâmide olfativa não quebrem o layout.

## Arquivos a serem modificados
- `src/components/collection-showcase.tsx`
- `src/components/catalog-viewer.tsx`
- `src/components/header.tsx`
- `src/components/cart-drawer.tsx`
- `src/routes/perfume.$id.tsx`

## Detalhes Técnicos
- Uso de classes utilitárias do Tailwind (`sm:`, `md:`, `lg:`) para controle granular de breakpoints.
- Testes manuais simulando larguras de 320px a 768px.
- Preservação total do layout desktop existente.
