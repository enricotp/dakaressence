# Plano: Correção da Devolução de Estoque ao Cancelar Pedidos

Este plano visa corrigir a falha onde o estoque não retorna ao Notion quando um pedido concluído é cancelado no painel administrativo.

## Mudanças Técnicas

### Backend (Motor de Estoque)

1. **Motor de Devolução**: Implementar `cancelarPedidoEDevolverEstoque` em `src/lib/orders.functions.ts`.
  - Esta função verificará se o pedido está em estado `Concluído`.
    - Chamará o motor de estoque (`estoque.server.ts`) para realizar a ação `DEVOLUCAO`.
    - O motor de estoque usará a idempotência baseada no `MovimentoID` (ex: `PED-XXX:CICLO-N:DEVOLUCAO`) para garantir que o estoque volte apenas uma vez por ciclo.
2. **Validação de Ciclo**: Garantir que a devolução só ocorra se houver uma baixa `APLICADA` no ciclo atual do pedido.
3. **Registro de Movimentação**: Todas as devoluções serão registradas na aba `MovimentacoesEstoque` do Google Sheets, seguindo os estados `INICIADA`, `APLICADA`, `FALHOU` ou `REVERTIDA`.

### Frontend (Painel Administrativo)

1. **Interceptação do Cancelamento**: Modificar a função `mudarStatus` em `src/routes/painel-dakar-a7k9m2.tsx`.
  - Se o status atual for `Concluído` e o novo for `Cancelado`, abrir um modal de confirmação específico: *"Cancelar este pedido irá devolver as unidades ao estoque. Confirmar?"*.
2. **Visualização de Devolução**: Adicionar um preview da devolução (itens e quantidades) no modal de confirmação.
3. **Prevenção de Erros**: Desabilitar botões durante o processamento e exibir feedback em tempo real.

## Regras de Negócio Implementadas

- **Pendente → Cancelado**: Apenas altera o status no Sheets (estoque nunca foi baixado).
- **Concluído → Cancelado**: Devolve o estoque no Notion e altera o status no Sheets.
- **Cancelado → Concluído**: O sistema exigirá o processo de "Processar e Atualizar Estoque" novamente para baixar as unidades (novo ciclo).

## Arquivos Afetados

- `src/lib/orders.functions.ts`: Novas funções de servidor para cancelamento com estoque.
- `src/lib/estoque.server.ts`: Ajustes na lógica de `executarMovimento` para suportar `DEVOLUCAO` com segurança.
- `src/routes/painel-dakar-a7k9m2.tsx`: Integração da UI com o novo fluxo de cancelamento.
- `src/routes/index.tsx`: Remoção do texto de instrução temporário.  
  
Ajuste o plano com estes pontos obrigatórios:
  1. Incluir o status `PRECISA_RECONCILIACAO` na movimentação de devolução. Ele está faltando. Se o Notion for alterado parcialmente, ou se o Notion atualizar mas o Sheets falhar depois, o sistema não pode fingir que terminou.
  2. O pedido só pode receber status `Cancelado` depois que a devolução no Notion estiver marcada como `APLICADA`. Se a devolução falhar, manter o pedido como `Concluído` e mostrar erro/reconciliação.
  3. Não confiar apenas no status atual `Concluído`. Antes de devolver, verificar se existe uma baixa `APLICADA` para aquele `PedidoID` e `EstoqueCiclo`. Sem baixa aplicada, não devolver nada.
  4. A devolução deve usar os itens, IDs do Notion e quantidades registrados na baixa original. Não localizar produto somente pelo nome e não recalcular usando dados atuais do catálogo.
  5. Se houver vários produtos e a devolução falhar no meio, tentar compensar os produtos que já receberam devolução. Se não conseguir, marcar `PRECISA_RECONCILIACAO` com os itens já processados.
  6. “Cancelado → Concluído” não deve criar ciclo novo automaticamente por qualquer clique. O ciclo só aumenta quando o pedido for explicitamente reaberto para uma nova tentativa de venda, depois de a devolução anterior estar `APLICADA`.
  7. Não remover texto de `src/routes/index.tsx` nesta tarefa. A correção é de pedidos, estoque e painel administrativo; não mexer na página inicial sem relação direta.
  8. Testar obrigatoriamente:
    - pedido pendente cancelado não altera estoque;
    - pedido concluído devolve estoque;
    - clique duplo não devolve duas vezes;
    - falha no Notion não muda o pedido para cancelado;
    - falha parcial gera reconciliação;
    - pedido cancelado, reaberto e concluído gera uma nova baixa válida.