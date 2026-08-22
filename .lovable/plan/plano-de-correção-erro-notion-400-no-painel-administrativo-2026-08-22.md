# Plano de Correção: Erro Notion 400 no Painel Administrativo

O erro `Notion update failed [400]` foi diagnosticado e isolado. A causa raiz é a tentativa de atualizar a propriedade `Volumes Signature`, que não existe no schema atual da database do Notion (`38858811-29ca-83c5-b57d-0102c05505b1`).

## Diagnóstico Realizado
1.  **Isolamento**: Testes individuais confirmaram que o Notion rejeita o payload quando `Volumes Signature` está presente.
2.  **Schema Check**: Consulta direta aos metadados da database confirmou que as colunas válidas são: `Product Name`, `Número`, `Amount`, `Descrição`, `Preço`, `Custo`, `Volume`, `Marca`, `Coleção`, `Gênero`, `Low threshold `, `OoS threshold`, `Notas de topo`, `Notas de coração`, `Notas de fundo`, `Checkbox` e `Fotos`.
3.  **Campo Sensível**: O campo `Low threshold ` possui um espaço obrigatório ao final do nome.

## Alterações Propostas

### 1. Servidor (`src/lib/perfumes.functions.ts`)
*   **Remover `Volumes Signature`**: A função `atualizarPerfume` deixará de enviar esta propriedade para evitar o erro 400.
*   **Logs Detalhados**: Implementar captura total da resposta de erro do Notion (incluindo `message`, `code` e `request_id`) para facilitar diagnósticos futuros.
*   **Consistência de Tipos**: Garantir que campos numéricos vazios no formulário sejam enviados como `null` ou não enviados, conforme o schema.

### 2. Painel Admin (`src/routes/painel-dakar-a7k9m2.tsx`)
*   **Ajuste no Formulário**: Ocultar ou desativar a edição de múltiplos volumes para a coleção Signature enquanto a propriedade não existir no Notion.
*   **Tratamento de Feedback**: Melhorar a exibição da mensagem de erro para o usuário final.

### 3. Página Inicial (`src/routes/index.tsx`)
*   **Restauração**: Garantir que a página inicial esteja limpa e funcional, removendo qualquer resquício de mensagens técnicas de diagnóstico.

## Verificação
*   Testar a edição de cada campo individualmente através do painel.
*   Confirmar persistência no Notion e atualização imediata no catálogo.
