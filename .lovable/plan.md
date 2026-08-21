# Plan - Automate Perfume Availability in Notion

The objective is to replace the manual "Pronta entrega" and "Sob encomenda" checkboxes in the Notion database with a single automatic "Disponibilidade" formula property based on the "Amount" (stock) property.

## User Review Required

> [!IMPORTANT]
> - The new "Disponibilidade" property will be a formula: `if(prop("Amount") > 0, "Pronta Entrega", "Sob Encomenda")`.
> - The website logic already prioritizes the "Amount" field for calculations, but I will update the code to explicitly use the new "Disponibilidade" field where appropriate to maintain consistency.
> - Once validated, the old "Pronta entrega" and "Sob encomenda" checkboxes will be deleted from Notion.

## Technical Details

### 1. Notion Database Changes
- Create a new **Formula** property named `Disponibilidade`.
- Formula: `if(prop("Amount") > 0, "Pronta Entrega", "Sob Encomenda")`.
- Verify the formula works for both `Amount > 0` and `Amount = 0` records.

### 2. Frontend & Backend Code Updates
- **`src/lib/perfumes.functions.ts`**:
    - Update the `Perfume` type to include `disponibilidade: string`.
    - Update `getPerfumes` to read the new `Disponibilidade` property.
    - Clean up `atualizarPerfume` and `criarPerfume` to remove references to the old checkboxes and stop attempting to update them.
- **`src/components/catalog-viewer.tsx`**:
    - Update filtering logic to use the new `disponibilidade` property value instead of calculating it from `prontaEntrega`/`sobEncomenda` booleans.
- **`src/routes/painel-dakar-a7k9m2.tsx`**:
    - Remove the checkbox inputs for "Pronta entrega" and "Sob encomenda" from the Add/Edit perfume forms.

### 3. Cleanup
- After verification, delete the `Pronta entrega` and `Sob encomenda` properties from the Notion database using the Notion API.

## Validation Plan
- Check the catalog to ensure "Pronta Entrega" and "Sob Encomenda" filters still work.
- Verify in the Admin panel that the manual checkboxes are gone.
- Test that updating the "Amount" in Admin (or directly in Notion) correctly reflects in the "Disponibilidade" status on the site.
