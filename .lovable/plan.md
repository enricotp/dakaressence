# Plano de Integração do CMS da Home com Notion

Implementar uma arquitetura de gerenciamento de conteúdo para a Página Inicial, utilizando o Notion como única fonte da verdade, permitindo edição tanto pelo Painel Administrativo quanto diretamente no Notion.

## Notion
- Criar banco de dados "Configuração da Home" dentro da página "Dakar Essence" (concluído).
- Estruturar registros estáveis: `home_main`, `signature`, `brand_collection`, `arabic_collection`, `dream_brand_collection` (concluído).
- Migrar valores atuais (títulos, descrições, preços e tamanhos) para inicializar o banco (concluído).

## Backend (Server Functions)
- Criar `src/lib/home-config.functions.ts` para centralizar a comunicação com o Notion (concluído).
- Implementar `getHomeConfig` para leitura e `updateHomeConfig` para escrita segura (apenas para Gerentes/Donos) (concluído).

## Admin Panel
- Adicionar aba "Página Inicial" no painel administrativo existente `/painel-dakar-a7k9m2` (concluído).
- Desenvolver `src/components/home-config-tab.tsx` com formulários intuitivos para editar:
    - Conteúdo principal (Hero).
    - Descrições e nomes das coleções.
    - Preços por tamanho disponível (concluído).
- Implementar feedback visual de "Alterações não salvas" e estados de carregamento/sucesso (concluído).

## Frontend (Página Inicial)
- Atualizar `src/routes/index.tsx` para consumir dados dinâmicos do Notion via React Query (concluído).
- Refatorar `src/components/collection-showcase.tsx` para refletir as mudanças de preço, nome e descrição configuradas no Notion (concluído).
- Garantir que a lógica de "Descobrir Fragrâncias" continue funcionando com as chaves internas estáveis (concluído).

## Segurança e Performance
- Manter segredos do Notion apenas no servidor (createServerFn).
- Utilizar cache do React Query para evitar requisições excessivas ao Notion.
- Invalidar cache após salvar no Admin para atualização imediata dos dados.

## Próximos Passos
- Validar a renderização da Home com os novos dados dinâmicos.
- Testar o fluxo completo: Edição no Admin -> Persistência no Notion -> Atualização na Home.
- Testar edição direta no Notion -> Atualização na Home.
