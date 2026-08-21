# Plan: Dakar Essence Improvements - Phase 2

## Context & Strategy
- **Notion Database**: `38858811-29ca-83c5-b57d-0102c05505b1`.
- **Google Sheets**: `1YDXLWaevUB9LnrQGImIV9iGBT9ayCbZYdkzaWkXZrWw`.
- **Stock Strategy**: **Strategy C** (Confirm at acceptance). No reservation for pending orders.
- **Idempotency**: Use explicit columns in Google Sheets to track stock movements.

## 1. Permanent Perfume Numbers (Notion)
- **Database Schema**: Add a new property `Número` (type: `number`) to the Notion database.
- **Migration**:
    - Read all perfumes.
    - Map current index-based numbers (Nº 001, etc.) to the new permanent `Número` column.
    - Present a report to the user before finalizing (check for duplicates/conflicts).
- **Backend**:
    - Update `Perfume` type in `src/lib/perfumes.functions.ts`.
    - Update `getPerfumes` to fetch `Número`.
    - Update `criarPerfume` to automatically assign the next available number (Max + 1).
    - Update `atualizarPerfume` to handle manual edits (with warnings for duplicates).
- **Frontend**:
    - Update all displays (Catalog, Cart, Order Summary, Admin) to use the permanent `Número`.

## 2. Checkout & Order Improvements
- **Google Sheets Schema**:
    - Column I: `Telefone`
    - Column J: `EstoqueBaixadoEm` (Timestamp)
    - Column K: `EstoqueDevolvidoEm` (Timestamp)
- **Checkout UI**:
    - Add "Telefone/WhatsApp" field in `CartDrawer`.
    - Validation: Brazilian DDD + 9 digits (10 or 11 total). Mask: `(99) 99999-9999`.
    - Save to Google Sheets via `criarPedido`.
- **Admin Orders**:
    - Display phone number.
    - Search by phone.
    - Add "Falar com o cliente" button (direct WhatsApp link).

## 3. Calculator Precision
- **Logic Overhaul** (`src/components/calculadora-panel.tsx`):
    1.  **Strict Number Match**: Extract `Nº XXX` from text and find exact match in catalog by `Número`.
    2.  **Verification**: If number matches, check if name is compatible. If not, show a "Divergence Warning".
    3.  **Fuzzy Fallback**: Only if no `Nº` is present, use fuzzy search.
    4.  **Ambiguity Handling**: If fuzzy search yields multiple results, show a selection list (Number, Name, Collection, Volume, Price).
    5.  **Error Reporting**: Clearly flag unidentifiable lines.

## 4. Stock Safety & Idempotency (Strategy C)
- **Transition Logic** (`src/lib/orders.functions.ts` -> `atualizarStatusPedido`):
    - **Accept Sale (Concluído)**:
        - Check `EstoqueBaixadoEm`. If present, skip stock reduction.
        - Fetch latest stock from Notion.
        - If `amount < requested_qty`, block transition and throw error "Estoque insuficiente".
        - Perform reduction and set `EstoqueBaixadoEm` in Sheets.
    - **Cancel (Cancelado)**:
        - Check `EstoqueDevolvidoEm`. If present, skip.
        - Check if `EstoqueBaixadoEm` was set. If not, skip (nothing to return).
        - Perform return and set `EstoqueDevolvidoEm` in Sheets.
- **UI Changes**:
    - Rename button to "Aceitar venda e baixar estoque".
    - Display confirmation modal with quantities and available stock before concluding.
    - Register all stock movements in Logs.

## 5. UI/UX Consistency
- **Site Catalog**: Items with only 1 unit show: "Última unidade — disponibilidade sujeita a confirmação".
- **Code Hygiene**: Ensure no changes to static marketing text in `src/routes/index.tsx`.

## Technical Inventory
- **Files**:
    - `src/lib/perfumes.functions.ts`: Notion property mapping, auto-number logic, stock check.
    - `src/lib/orders.functions.ts`: Sheets schema update, idempotency checks, phone handling.
    - `src/components/cart-drawer.tsx`: Checkout form, phone validation, permanent numbers.
    - `src/components/calculadora-panel.tsx`: Precise matching logic.
    - `src/routes/painel-dakar-a7k9m2.tsx`: Admin UI for phone, stock confirmation, number editing.
