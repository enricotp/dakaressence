# Plan: Dakar Essence Improvements - Phase 2 (Revised)

## Context & Strategy
- **Notion Database**: `38858811-29ca-83c5-b57d-0102c05505b1`.
- **Google Sheets**: `1YDXLWaevUB9LnrQGImIV9iGBT9ayCbZYdkzaWkXZrWw`.
- **Stock Strategy**: **Strategy C** (Confirm at acceptance). No reservation for pending orders.
- **Current Sheets Headers**: `ID, Data, Cliente, Itens, Total, Pagamento, Parcelas, Status`.

## 1. Permanent Perfume Numbers (Notion)
- **Database Schema**: Add a new property `Número` (type: `number`) to the Notion database.
- **Migration Protocol**:
    1.  **Read & Map**: Fetch all perfumes and map current index-based numbers.
    2.  **Validation Report**: Generate a preview for user approval showing Notion ID, Name, Collection, Volume, current index number, and proposed permanent number. Identify duplicates or conflicts.
    3.  **Write (Post-Approval)**: Permanently save numbers. Formatted as `Nº 001` in UI but stored as numeric values.
- **Business Rules**:
    - **Uniqueness**: Block duplicates at registration level.
    - **Persistence**: Numbers never change automatically and aren't reused from deleted items.
    - **New Items**: Automatically assign `Max(Número) + 1`.
    - **History**: Cart and Orders will save a snapshot (Number, Name, Collection, Volume, Price) to preserve historical accuracy.

## 2. Checkout & Order Improvements
- **Google Sheets Dynamic Columns**:
    - **Detection**: Read headers first. Add `Telefone`, `EstoqueMovimentado` (History/Log), and `EstoqueCiclo` (Counter) if missing, appended to the end.
    - **Access**: Update code to find columns by name instead of fixed indices.
- **Checkout UI**:
    - Add "Telefone/WhatsApp" field in `CartDrawer`.
    - **Validation**: Remove symbols. Brazilian Mobile (11 digits) or Fixed (10 digits).
    - **WhatsApp Integration**: Use `55` prefix and ensure format compatibility.
- **Admin Orders**:
    - Display phone number and add "Falar com o cliente" (WhatsApp link).
    - Search functionality includes phone numbers.

## 3. Calculator Precision (`src/components/calculadora-panel.tsx`)
- **Strict Matching Logic**:
    1.  **Extract Number**: Parse `Nº XXX`.
    2.  **Match Catalog**: Find exact numeric match in `Número` property.
    3.  **Cross-Verify**: If number matches, check if the parsed name is compatible. Show "Divergence Warning" if name differs.
    4.  **Fuzzy Fallback**: Only if no `Nº` is present, use fuzzy search.
    5.  **Manual Selection**: If fuzzy search yields multiple options, show a selection list (Number, Name, Collection, Volume, Price).
    6.  **Error Feedback**: Clearly highlight unidentifiable lines.

## 4. Atomic Stock Logic (Strategy C)
- **Transition: Pendente → Concluído**:
    - **Validation**: Group duplicate items in the order. Fetch latest Notion stock for all items.
    - **Atomicity**: If **any** item lacks stock, block the entire operation. Show specific insufficient items.
    - **Idempotency**: Use a movement log in the spreadsheet (`PED-XXXX:BAIXA`). State: `INICIADA`, `APLICADA`, `FALHOU`.
- **Transition: Concluído → Cancelado**:
    - Check if stock was previously reduced (`APLICADA`). Devolve once and mark log (`PED-XXXX:DEVOLUCAO`).
- **Transition: Reaberto → Concluído**:
    - Trigger a new full validation and a new stock reduction cycle.
- **Recovery Logic**:
    - If Notion update fails, operation is aborted.
    - If Notion succeeds but Sheets fails, mark as `PRECISA_RECONCILIACAO` for manual admin check.
- **UI**:
    - Button: "Aceitar venda e baixar estoque" (disabled during processing).
    - Confirmation modal showing quantities vs. available stock.

## 5. UI/UX Consistency
- **Catalog Availability**: Items with `Amount === 1` show: "Última unidade — disponibilidade sujeita a confirmação". Direct buy is replaced by "Consultar disponibilidade" (WhatsApp).
- **Code Hygiene**: No changes to static marketing text in `src/routes/index.tsx` unless directly required by functional logic.

## Technical Inventory
- `src/lib/perfumes.functions.ts`: Notion number logic, atomic stock check.
- `src/lib/orders.functions.ts`: Dynamic Sheets columns, idempotency state machine.
- `src/components/cart-drawer.tsx`: Phone validation, snapshot saving.
- `src/components/calculadora-panel.tsx`: Precise match & warning UI.
- `src/routes/painel-dakar-a7k9m2.tsx`: Confirmation modals, number editing UI, phone search.
