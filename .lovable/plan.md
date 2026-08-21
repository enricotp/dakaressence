# Plan: Dakar Essence Improvements

## Explore
- Checkout stores orders in Google Sheets (`src/lib/orders.functions.ts`).
- Admin panel (`src/routes/painel-dakar-a7k9m2.tsx`) views these orders.
- Calculator (`src/components/calculadora-panel.tsx`) uses regex and fuzzy matching.
- Perfumes have a code/number (`Nº XXX`) generated in the UI (`src/components/cart-drawer.tsx`) based on their index in the Notion query.
- Stock logic is in `src/lib/perfumes.functions.ts` (Notion `Amount` field).

## Implementation Details

### 1. Checkout Phone/WhatsApp
- **Google Sheets**: Add a new column "Telefone" (Column I) to the "Pedidos" sheet.
- **Frontend**:
    - Update `CartDrawer` checkout form to include a "Telefone/WhatsApp" field with validation and mask.
    - Update `criarPedido` server function to save this new field.
    - Update WhatsApp message summary to include the phone.
- **Admin**:
    - Update `PedidosTab` to show the phone number.
    - Add a "Falar com o cliente" button opening WhatsApp.
    - Update order search to include phone.

### 2. Calculator Precision
- **Logic Refactor**:
    - Update `parseTexto` in `src/components/calculadora-panel.tsx` to:
        1. Extract `Nº XXX`.
        2. Match exactly by the code (index-based number).
        3. Verify name compatibility; show warning if divergent.
        4. Fallback to fuzzy search ONLY if no number is found.
    - UI: Add manual selection for ambiguous fuzzy matches.
    - UI: Clear indication of unidentifiable items.

### 3. Stock Strategy Recommendations (Pending Approval)
- **Current State**: Orders stored in Google Sheets. Notion `Amount` is only reduced on "Concluído".
- **Recommendation**: Strategy A (Reusing Google Sheets).
    - **Pros**: Simplest, no new databases, unified order source.
    - **Cons**: Requires reading all "Pendente" orders to calculate "Reserved".
- **Strategy C (Confirmation only)** is safer for API limits but riskier for user experience.
- **Decision Needed**: Approve Strategy A?

### 4. Logic & Safety
- **Protections**:
    - Modify `atualizarStatusPedido` to check `Amount` before allowing "Concluído".
    - Implement a "download" tracking mechanism (or check current status) to prevent double-returns of stock on cancellation.
- **UI**:
    - Change button text to "Aceitar venda e baixar estoque".
    - Show stock confirmation modal before conclusion.

## User Review Required
> [!IMPORTANT]
> I recommend **Strategy A** for stock management: Reuse the existing Google Sheets orders to calculate reserved stock. This avoids data duplication and complex expiração logic in Notion.
> **Do you approve Strategy A or prefer another approach?**

## Next Steps
1.  Apply text edits to `src/routes/index.tsx`.
2.  Implement Phone field in Checkout (UI + Server Fn + Admin).
3.  Implement Calculator logic overhaul (Precise matching + UI warnings).
4.  Implement stock safety (Prevent negative, prevent double return).
5.  (After approval) Implement stock reservation logic.