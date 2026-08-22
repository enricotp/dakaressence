# Plano: Carrossel de Imagens por Categoria (Página Inicial)

Implementar um carrossel de imagens dinâmico para cada uma das quatro coleções na Home, com gerenciamento completo via Notion e Painel Administrativo.

## Notion
- Adicionar propriedade `ImagensCarrossel` (tipo `rich_text` para armazenar JSON de URLs) na database de configuração da Home (`3bf58811-29ca-81f5-a605-e63c22344bdf`). (Concluído via script)

## Backend (Server Functions)
- Atualizar `src/lib/home-config.functions.ts`:
    - `HomeConfig`: Adicionar campo `imagens: string[]`.
    - `getHomeConfig`: Parsear o JSON da propriedade `ImagensCarrossel`.
    - `updateHomeConfig`: Validar e persistir o array de URLs como string JSON.

## Admin Panel
- Atualizar `src/components/home-config-tab.tsx`:
    - Adicionar seção "Imagens do carrossel" em cada card de coleção.
    - Implementar editor dinâmico:
        - Listagem de miniaturas (preview).
        - Botões "+" e "-" para adicionar/remover URLs.
        - Controles "Subir" e "Descer" para ordenação.
        - Validação de URLs (HTTPS) e remoção de espaços.
    - Feedback visual de salvamento e estados de erro.

## Frontend (Página Inicial)
- Atualizar `src/components/collection-showcase.tsx`:
    - Integrar o carrossel nos cards de coleção.
    - Layout quadrado (`aspect-ratio: 1/1`) com `object-fit: contain`.
    - Implementar lógica de carrossel:
        - Transição automática (autoplay) quando > 1 imagem.
        - Navegação manual (setas/indicadores) e suporte a swipe (celular).
        - Placeholder elegante quando não houver imagens.
    - Otimização: Lazy loading das imagens.

## Segurança e Performance
- Manter segredos do Notion no servidor.
- Invalidação de cache do React Query após atualizações no Admin.
- Respeito à preferência de `prefers-reduced-motion`.

## Verificação e Testes
- Adicionar quantidades variadas de imagens por categoria (1, 2, 4, 10).
- Testar reordenação e remoção.
- Validar persistência entre sessões.
- Verificar responsividade e performance no mobile.
