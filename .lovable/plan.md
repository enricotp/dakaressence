# Plan - Stock Status Automation

Implement a consistent rule to automate "Pronta Entrega" (In Stock) and "Sob Encomenda" (On Order) labels based on Notion inventory quantity (`Amount`).

## Objectives
- Use Notion `Amount` as the single source of truth for stock status.
- Amount > 0: `Pronta Entrega` = true, `Sob Encomenda` = false.
- Amount <= 0 (or null): `Pronta Entrega` = false, `Sob Encomenda` = true.
- Ensure consistency between public catalog and admin panel.

## Proposed Changes

### 1. Data Logic (src/lib/perfumes.functions.ts)
- Update `getPerfumes` to calculate `prontaEntrega` and `sobEncomenda` properties directly from `amount` and `oosThreshold`.
- Ensure fallback values handle `null`/`undefined` amount as out-of-stock.

### 2. Admin Panel (src/routes/painel-dakar-a7k9m2.tsx)
- Update `EditForm` to automatically set the state of `prontaEntrega` and `sobEncomenda` checkboxes whenever the `amount` field changes.
- Ensure the initial state of these fields when opening the form matches the calculated status.
- Add visual indicators that these fields are now automated based on stock.

### 3. Public Catalog (src/routes/index.tsx)
- The display logic already uses `p.prontaEntrega` and `p.sobEncomenda`. By fixing the data calculation in the server function, the UI will automatically reflect the correct status.
- Verify if any additional filtering/sorting logic needs adjustment.

## Technical Details
- **Rule**: `prontaEntrega = amount > oosThreshold` and `sobEncomenda = amount <= oosThreshold`.
- **Sync**: Since the server function `getPerfumes` maps the Notion results directly, the recalculation happens on every fetch.
- **Admin**: The checkboxes in the admin form should become reactive to the `amount` input to provide immediate visual feedback.

## Validation
- Test with amount 0 (Should show "Sob Encomenda").
- Test with amount > 0 (Should show "Pronta Entrega").
- Verify consistency between Admin and Public views.
