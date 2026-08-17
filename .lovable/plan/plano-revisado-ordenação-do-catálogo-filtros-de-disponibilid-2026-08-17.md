# Plano Revisado — Ordenação do Catálogo, Filtros de Disponibilidade e Volumes Signature

## Resumo

Implementar três alterações na aplicação existente:

1. **Ordenação do catálogo:** perfumes com quantidade maior que `0` devem aparecer primeiro na listagem principal.
2. **Filtros de disponibilidade:** adicionar os filtros **Pronta Entrega** e **Sob Encomenda** na tela principal.
3. **Volumes Signature:** no painel administrativo, quando o perfume for da coleção **Signature**, permitir selecionar **50 ml**, **100 ml** ou **ambos**.

---

## 1. Ordenação do catálogo e filtros de disponibilidade

### Arquivo principal

`src/routes/index.tsx`

### Fonte de verdade

A disponibilidade deve ser determinada diretamente pela **quantidade do produto**, seguindo a regra:

```text
quantidade > 0 → Pronta Entrega
quantidade <= 0 → Sob Encomenda
```

Não criar uma segunda regra independente baseada apenas em `emEstoque` caso esse valor possa ficar dessincronizado da quantidade.

### Ordenação

Atualizar a lógica de `perfumesFiltrados` para separar os perfumes em dois grupos:

```text
1º → quantidade > 0
2º → quantidade <= 0
```

Todos os perfumes disponíveis para **Pronta Entrega** devem aparecer antes dos perfumes **Sob Encomenda**.

Não é necessário ordenar pela quantidade do maior estoque para o menor. Dentro de cada grupo, preservar a ordenação atual sempre que possível.

### Novo filtro de disponibilidade

Adicionar um estado de disponibilidade, integrado ao sistema de filtros existente:

```ts
"todos" | "pronta" | "encomenda"
```

Comportamento:

```text
todos
→ não filtra por disponibilidade

pronta
→ quantidade > 0

encomenda
→ quantidade <= 0
```

### Interface

Adicionar na área de filtros existente:

- **Pronta Entrega**
- **Sob Encomenda**

Reutilizar o mesmo padrão visual dos filtros/chips/botões já existentes.

Os novos filtros devem funcionar em conjunto com todos os outros filtros existentes.

Exemplo:

```text
Marca X + Pronta Entrega
```

deve retornar somente perfumes da Marca X com `quantidade > 0`.

Não criar um sistema paralelo de filtros.

---

## 2. Volumes dos perfumes Signature no painel administrativo

### Arquivos relacionados

- `src/lib/perfumes.functions.ts`
- `src/routes/painel-dakar-a7k9m2.tsx`
- demais arquivos de tipos, persistência ou integração com Notion relacionados ao perfume, caso necessário.

### Investigação antes da implementação

Antes de criar um novo campo, verificar:

1. Como `Signature` está representado atualmente.
2. Como o campo `Volume` funciona.
3. Como os dados de volume são armazenados no sistema.
4. Se o Notion já possui uma propriedade que suporte múltiplos volumes, multi-select, variantes ou estrutura equivalente.
5. Se o banco/tipos atuais já possuem alguma estrutura reutilizável para múltiplas opções.

Não assumir antecipadamente que é necessário criar `volumesAssinatura`.

### Comportamento esperado

Quando a coleção/tipo selecionado for **Signature**, mostrar no formulário administrativo:

```text
Volumes disponíveis

[ ] 50 ml
[ ] 100 ml
```

O administrador deve conseguir selecionar:

```text
50 ml
```

ou:

```text
100 ml
```

ou:

```text
50 ml + 100 ml
```

Portanto, a estrutura precisa suportar **seleção múltipla**.

### Persistência

A seleção precisa ser realmente persistida.

Exemplo:

Se o administrador selecionar:

```text
[x] 50 ml
[x] 100 ml
```

salvar o perfume, sair da página e posteriormente abrir esse perfume novamente para edição, as duas opções devem continuar selecionadas.

O mesmo deve funcionar quando somente um dos volumes estiver selecionado.

### Estrutura dos dados

Prioridade:

1. Reutilizar uma estrutura existente adequada, caso exista.
2. Se não existir, criar uma estrutura apropriada para múltiplos volumes e compatível com a arquitetura atual.

Evitar armazenar algo como:

```text
"50ml,100ml"
```

em uma string separada por vírgulas apenas por conveniência, se a arquitetura permitir uma estrutura adequada como array, multi-select ou variantes.

Também não criar automaticamente dois produtos separados, um de 50 ml e outro de 100 ml, apenas para contornar essa necessidade, a menos que a arquitetura existente já seja baseada em variantes/produtos separados e isso seja necessário para manter compatibilidade.

---

## 3. Atualização dos tipos e CRUD

Depois de identificar a estrutura correta para os volumes Signature:

- atualizar o tipo `Perfume` somente se necessário;
- atualizar leitura e gravação dos perfumes;
- atualizar criação e edição no painel;
- atualizar o mapeamento com o Notion, caso os volumes sejam persistidos/sincronizados por ele;
- garantir compatibilidade com perfumes existentes.

Não quebrar produtos que utilizam o campo `volume` atual.

---

## 4. Painel administrativo

No `EditForm` ou componente equivalente:

- detectar quando a coleção/tipo for `Signature`;
- exibir as opções **50 ml** e **100 ml**;
- permitir seleção múltipla;
- carregar automaticamente os valores já salvos ao editar;
- persistir corretamente alterações;
- seguir o padrão visual atual do painel.

Perfumes que não são Signature não devem ser afetados por essa alteração.

---

## 5. Regras de implementação

Esta é uma aplicação existente.

Antes de alterar código, analisar a implementação atual e reutilizar componentes, tipos, funções e padrões existentes sempre que possível.

Não reconstruir funcionalidades que já existem.

Não modificar páginas, rotas, banco, integração com Notion ou regras de negócio que não sejam necessárias para essas três alterações.

Preservar todas as funcionalidades existentes que estejam funcionando.

---

# Critérios de Aceite

### Catálogo

- Perfumes com `quantidade > 0` aparecem antes dos perfumes sem estoque.
- Perfumes com `quantidade <= 0` continuam aparecendo, porém depois dos disponíveis.
- A ordenação existente dentro de cada grupo é preservada sempre que possível.

### Filtros

- Existe o filtro **Pronta Entrega**.
- Existe o filtro **Sob Encomenda**.
- **Pronta Entrega** mostra somente perfumes com `quantidade > 0`.
- **Sob Encomenda** mostra somente perfumes com `quantidade <= 0`.
- Os filtros funcionam em conjunto com os filtros existentes.
- O visual segue o padrão atual da interface.
- Os filtros funcionam corretamente em desktop e mobile.

### Signature

- Ao selecionar `Signature` no admin, aparecem as opções **50 ml** e **100 ml**.
- É possível selecionar somente 50 ml.
- É possível selecionar somente 100 ml.
- É possível selecionar 50 ml e 100 ml simultaneamente.
- A seleção é persistida corretamente.
- Ao reabrir um perfume para edição, as opções salvas continuam marcadas.
- A implementação reutiliza a estrutura existente quando houver suporte adequado.
- Perfumes existentes continuam funcionando.
- Perfumes que não são Signature não são afetados.

### Validação geral

- A integração existente com o Notion continua funcionando.
- Não há erros relevantes no console.
- Nenhuma funcionalidade não relacionada foi alterada.
- A aplicação continua funcionando corretamente após as alterações.