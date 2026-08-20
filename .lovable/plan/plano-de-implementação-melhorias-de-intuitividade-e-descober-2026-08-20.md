# Plano de Implementação: Melhorias de Intuitividade e Descoberta Olfativa

Este plano visa tornar o catálogo mais amigável para novos usuários e implementar a busca por aromas (pirâmide olfativa).

## Alterações de UX e Intuitividade

1.  **Legendas de Disponibilidade**
    *   No `CatalogViewer`, atualizar os botões de filtro de disponibilidade para incluir textos explicativos:
        *   Pronta Entrega -> **Pronta Entrega (Receba agora)**
        *   Sob Encomenda -> **Sob Encomenda (Prazo: 6 dias)**
2.  **Chips de Filtros Ativos**
    *   Adicionar uma barra de "filtros ativos" acima da lista de perfumes.
    *   Cada filtro selecionado (Coleção, Marca, Gênero, Volume, Disponibilidade) aparecerá como um "chip" removível.
3.  **Tutorial de Primeira Visita (Onboarding)**
    *   Criar um componente de onboarding que destaca os principais controles (Busca, Filtros, Favoritos).
    *   Armazenar o estado no `localStorage` para não repetir automaticamente.
    *   Adicionar um botão "Como funciona?" discreto no cabeçalho do catálogo.

## Sistema de Descoberta por Aroma

1.  **Processamento de Notas**
    *   Implementar lógica para extrair e normalizar notas das propriedades `notasTopo`, `notasCoracao` e `notasFundo` do Notion.
2.  **Interface de Seleção**
    *   Adicionar botão "Descobrir por Aroma" ao lado da busca por nome.
    *   Criar um seletor visual onde o usuário escolhe aromas que gosta (ex: Baunilha, Madeiras, Cítrico).
3.  **Lógica de Relevância**
    *   Implementar ordenação que prioriza perfumes com mais "matches" nas notas selecionadas.
    *   Exibir selos nos cards informando por que aquele perfume foi sugerido (ex: "Contém Baunilha").

## Detalhes Técnicos

*   **Arquivos afetados:**
    *   `src/components/catalog-viewer.tsx`: Centralizará as mudanças de UI e lógica de filtros.
    *   `src/lib/perfumes.functions.ts`: Possível ajuste na tipagem ou helpers de notas.
    *   `src/components/header.tsx`: Inclusão do botão de tutorial se necessário.
*   **Persistência:** `localStorage` para o tutorial.
*   **Mobile-First:** Garantir que o seletor de aromas e chips de filtro sejam responsivos e fáceis de tocar.
