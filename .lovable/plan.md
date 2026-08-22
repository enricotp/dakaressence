# Plano: Melhorias Dakar Essence — Fase 3 (Finalização)

Implementação do motor de estoque resiliente, reconciliação no painel administrativo e interface de disponibilidade no catálogo.

## Contexto
O sistema agora utiliza um motor de movimentação de estoque com compensação e idempotência baseado em ciclos. A baixa de estoque ocorre apenas no momento da conclusão do pedido pelo administrador.

## Ações a realizar

### 1. Servidor e Regras de Negócio (`src/lib/orders.functions.ts`)
- **Remover lógica antiga**: Eliminar o ajuste de estoque simplificado em `atualizarStatusPedido`.
- **Implementar `previewBaixaEstoque`**: Função que resolve os itens do pedido e retorna a validação de disponibilidade sem aplicar mudanças.
- **Implementar `aceitarVendaEBaixarEstoque`**:
  - Incrementar o ciclo do pedido.
  - Executar a movimentação de estoque via `executarMovimento`.
  - Atualizar o status do pedido para "Concluído" somente se a movimentação for "APLICADA".
- **Garantir Idempotência**: Usar o sistema de ciclos (`EstoqueCiclo`) para evitar baixas ou devoluções duplicadas.

### 2. Painel Administrativo (`src/routes/painel-dakar-a7k9m2.tsx`)
- **Modal de Confirmação**: Criar um modal detalhado que aparece ao clicar em "Processar".
  - Mostrar comparação: "Solicitado" vs "Disponível" vs "Após Venda".
  - Alertar visualmente se algum item for ficar zerado ou negativo.
- **Botão de Ação**: Substituir o botão atual por um fluxo que chama o preview antes da confirmação final.
- **Área de Reconciliação**: 
  - Listar movimentos com status `FALHOU` ou `PRECISA_RECONCILIACAO`.
  - Permitir repetir um ciclo falho ou marcar como resolvido manualmente.

### 3. Catálogo Público (`src/components/catalog-viewer.tsx`)
- **Selo "Última Unidade"**: Quando o `Amount` do produto for exatamente 1, exibir um selo especial: "Última unidade — disponibilidade sujeita a confirmação".
- **Ordenação**: Manter a prioridade de itens em estoque no topo.

### 4. Experiência do Usuário (UX)
- **Mensagem no Carrinho**: Adicionar um aviso no checkout se algum item no carrinho for de "Última Unidade".

## Detalhes técnicos
- **Rastreabilidade**: Todas as ações serão logadas na aba `MovimentacoesEstoque` do Google Sheets.
- **Resiliência**: O sistema de compensação em `estoque.server.ts` reverterá o Notion automaticamente se um item do meio da lista falhar.
- **Integridade**: Uso de `PEDIDO:CICLO-N:ACAO` como chave primária de movimentação.

```text
Fluxo:
Admin clica "Processar" -> Chama previewBaixaEstoque -> Modal mostra status -> Admin confirma -> 
Chama aceitarVendaEBaixarEstoque -> 
  1. Incrementa Ciclo
  2. Executa Movimento (Notion PATCH + Sheets LOG)
  3. Se OK -> Atualiza Pedido Status=Concluído
```
