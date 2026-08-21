# Plan: Dakar Essence Improvements - Phase 2 (Part 1)

## Context & Strategy
- **Notion Database**: `38858811-29ca-83c5-b57d-0102c05505b1`.
- **Scope**: **Part 1 of 3** - Permanent Perfume Numbers and Calculator Correction.
- **Current State**: Property `Número` (number) created in Notion. Empty values.
- **Rules**: Uniqueness, Persistence, Auto-increment (Max+1), historical snapshot in orders.

## 1. Permanent Perfume Numbers (Notion)
- **Migration Status**: Report generated (453 items). Duplicates identified in Notion (Armani Code, Blackxs, etc.).
- **Next Steps (Post-Approval)**:
    - Write proposed numbers (1 to 453) to the `Número` property in Notion.
    - Resolve duplicates by assigning unique numbers to each ID.
- **Backend Changes** (`src/lib/perfumes.functions.ts`):
    - Update `Perfume` type to include `numero: number | null`.
    - Fetch `Número` in `getPerfumes`.
    - Implement `formatarNumeroPerfume(n: number): string` (e.g., `Nº 001`).
    - Update `criarPerfume` to fetch the current max number and assign `Max + 1`.
    - Update `atualizarPerfume` with duplicate number validation.

## 2. Calculator Precision (`src/components/calculadora-panel.tsx`)
- **New Logic Sequence**:
    1.  **Strict Number Match**: Parse `Nº XXX`, convert to numeric, search `Número` property.
    2.  **Compatibility Check**: Verify if the name matches. Show warning if names diverge.
    3.  **Fuzzy Fallback**: Only if no `Nº` is provided, use fuzzy search by name.
    4.  **Ambiguity Handling**: If fuzzy search yields multiple items, show a manual selection list.
    5.  **UI Feedback**: Highlight unidentifiable or divergent lines. Prevent total calculation if items are ambiguous.

## 3. Order History Preservation
- **Checkout Snapshot**: Update `src/lib/orders.functions.ts` to save a JSON snapshot of the product at the time of purchase (Number, Name, Collection, Volume, Price).
- **Historical Consistency**: Ensure orders created before the migration maintain their displayed numbers (based on indices at the time, if captured).

## 4. UI Consistency
- Replace all index-based numbers with the new `formatarNumeroPerfume(p.numero)` in:
    - Catalog, Cards, Product Page, Cart, Checkout, WhatsApp, Admin Panel.

## Files to be Modified
- `src/lib/perfumes.functions.ts`
- `src/lib/orders.functions.ts`
- `src/components/calculadora-panel.tsx`
- `src/components/catalog-viewer.tsx`
- `src/components/cart-drawer.tsx`
- `src/routes/perfume.$id.tsx`
- `src/routes/painel-dakar-a7k9m2.tsx`

## Verification (Tests)
- Unique number assignment and persistence.
- Auto-increment for new items.
- Calculator priority: Number > Fuzzy Name.
- Historical data preservation in orders.
