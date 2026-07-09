## Objetivo

Adicionar **coleções** (Brand, Arabic, Dream Brand + demais) ao catálogo, com selo "por encomenda", volumes corretos, autocomplete no admin e novas métricas. Notion é a fonte da verdade — Sheets só registra vendas.

## 1. Novas colunas no Notion (banco de perfumes)

Preciso confirmar antes de mexer, porque criar propriedade no Notion via API afeta a base ao vivo.

- **Coleção** (Select): `Brand Collection`, `Arabic Collection`, `Dream Brand Collection`, `Signature`, `Premium` (posso ajustar os nomes). Cada perfume passa a ter uma coleção.
- **Volume**: já existe como Select `50ml`/`100ml`. Vou **adicionar as opções** `25ml` e `80ml` para cobrir Brand/Arabic (25ml) e Dream Brand (80ml/100ml).
- **Por encomenda** (Checkbox, opcional): default `true` para as novas coleções. Se preferir, deixo apenas fixo por coleção no código, sem coluna nova.

Regras de volume por coleção (defaults na criação):

- Brand Collection → 25ml
- Arabic Collection → 25ml
- Dream Brand Collection → **escolha entre 80ml e 100ml** no formulário
- Demais coleções → 50ml/100ml como hoje

## 2. Importar catálogo para as coleções

Para popular as coleções preciso das listas de perfumes de cada uma (Brand/Arabic/Dream Brand + demais). Duas opções:

- **(a)** Você me manda a lista (ou um link para cada coleção do fornecedor) e eu classifico os itens já existentes + crio os que faltam no Notion.
- **(b)** Deixo criada só a **estrutura** (coleções, campos, defaults) e você cadastra os produtos pela nova tela de admin com autocomplete.

Vou seguir com (b) por padrão, e se você me mandar as listas eu importo em lote em seguida.

## 3. Home (`src/routes/index.tsx`)

- Agrupar produtos por **Coleção** em seções (uma faixa por coleção), no lugar do grid único atual.
- Cada card mostra: nome, **volume (ml)**, preço, imagem e — quando a coleção for de encomenda — um selo "Sob encomenda • prazo X dias" (texto configurável, defino "7–15 dias" por ora).
- Filtros existentes (gênero) continuam funcionando dentro de cada coleção.

## 4. Admin (`src/routes/admin.tsx`)

- **Aba Perfumes**: agrupar a lista por coleção; mostrar volume em cada linha.
- **Formulário Novo/Editar perfume**:
  - Campo `Coleção` (select).
  - Campo `Volume` com opções dinâmicas conforme coleção (25 fixo p/ Brand/Arabic; 80/100 p/ Dream Brand; 50/100 p/ resto).
  - **Autocomplete** em `Marca` (lista deduplicada das marcas já cadastradas) e em `Nome` (catálogo de perfumes conhecidos com marca/descrição/imagem pré-preenchidas quando o match é único). Uso um dicionário embutido no código com os perfumes já mapeados em `GENERO_MAP` + os que você adicionar; sem chamadas externas.
- **Novas métricas** (aba Analytics):
  - Vendas por **coleção** (barras).
  - Vendas por **volume** (25/50/80/100 ml).
  - Vendas por **gênero** (masculino vs feminino) — donut.
  - Mantém "Top perfumes" atual.

## 5. Sheets

Nenhuma coluna nova é obrigatória: coleção/volume/gênero são derivados via join com o Notion (já faço isso hoje pelo `perfumePorNome`). Se preferir redundância no histórico, adiciono colunas `Coleção` e `Volume` na planilha de itens — me avise.

## 6. "Por encomenda"

Fixo por coleção no código (Brand, Arabic, Dream Brand = sob encomenda). Selo aparece no card da home e no detalhe do produto. Sem mudança de checkout — o pedido flui igual.

---

## Perguntas rápidas antes de eu começar

1. **Nomes exatos** das coleções além das 3 citadas? ("Signature", "Premium", outros?)
2. **Prazo** que o selo "sob encomenda" deve mostrar? (sugestão: "Sob encomenda • 7 a 15 dias")
3. Opção (a) importar catálogo agora — me manda as listas — ou (b) só estrutura e você cadastra?
4. Posso **adicionar as opções 25ml e 80ml** no Select `Volume` do Notion agora?

Assim que responder, executo tudo em uma passada.  
  
Pode adicionar na do sheets as collections, para podermos comparar nas métricas  
  
coloque as métricas de fêminino e masculino, e lá no menu de admin coloque para eu poder mudar se o perfume é fêminino ou masculino, na tela principal do catalogo coloque uns botôes de selecionar os brand collectiosn  
dream collections   
e o arabic pois eles não aparecerão por defoult