# Plano: Correção da Devolução de Estoque ao Cancelar Pedidos

Este plano visa corrigir a falha onde o estoque não retorna ao Notion quando um pedido concluído é cancelado no painel administrativo.

## Mudanças Técnicas

### Backend (Motor de Estoque)
1.  **Motor de Devolução**: Implementar `cancelarPedidoEDevolverEstoque` em `src/lib/orders.functions.ts`.
    - Esta função verificará se o pedido está em estado `Concluído`.
    - Chamará o motor de estoque (`estoque.server.ts`) para realizar a ação `DEVOLUCAO`.
    - O motor de estoque usará a idempotência baseada no `MovimentoID` (ex: `PED-XXX:CICLO-N:DEVOLUCAO`) para garantir que o estoque volte apenas uma vez por ciclo.
2.  **Validação de Ciclo**: Garantir que a devolução só ocorra se houver uma baixa `APLICADA` no ciclo atual do pedido.
3.  **Registro de Movimentação**: Todas as devoluções serão registradas na aba `MovimentacoesEstoque` do Google Sheets, seguindo os estados `INICIADA`, `APLICADA`, `FALHOU` ou `REVERTIDA`.

### Frontend (Painel Administrativo)
1.  **Interceptação do Cancelamento**: Modificar a função `mudarStatus` em `src/routes/painel-dakar-a7k9m2.tsx`.
    - Se o status atual for `Concluído` e o novo for `Cancelado`, abrir um modal de confirmação específico: *"Cancelar este pedido irá devolver as unidades ao estoque. Confirmar?"*.
2.  **Visualização de Devolução**: Adicionar um preview da devolução (itens e quantidades) no modal de confirmação.
3.  **Prevenção de Erros**: Desabilitar botões durante o processamento e exibir feedback em tempo real.

## Regras de Negócio Implementadas
- **Pendente → Cancelado**: Apenas altera o status no Sheets (estoque nunca foi baixado).
- **Concluído → Cancelado**: Devolve o estoque no Notion e altera o status no Sheets.
- **Cancelado → Concluído**: O sistema exigirá o processo de "Processar e Atualizar Estoque" novamente para baixar as unidades (novo ciclo).

## Arquivos Afetados
- `src/lib/orders.functions.ts`: Novas funções de servidor para cancelamento com estoque.
- `src/lib/estoque.server.ts`: Ajustes na lógica de `executarMovimento` para suportar `DEVOLUCAO` com segurança.
- `src/routes/painel-dakar-a7k9m2.tsx`: Integração da UI com o novo fluxo de cancelamento.
- `src/routes/index.tsx`: Remoção do texto de instrução temporário.
