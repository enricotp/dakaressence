# Plan for Catalog Ordering, Filters, and Signature Volumes

## User Summary
1. **Catalog Ordering**: Prioritize perfumes with stock (amount > 0) to appear first in the main listing.
2. **New Filters**: Add "Pronta Entrega" (In Stock) and "Sob Encomenda" (On Order) filters to the main page.
3. **Signature Volumes**: In the admin panel, allow selecting multiple volumes (50ml, 100ml) specifically for "Signature" collection perfumes.

## Technical Details

### 1. Catalog Ordering & Filters (Frontend)
- **File**: `src/routes/index.tsx`
- **Logic**: 
  - Update `perfumesFiltrados` sorting to group `emEstoque` (true) first, then `emEstoque` (false).
  - Add `disponibilidade` state (`"todos" | "pronta" | "encomenda"`) and integrate it into the filtering logic.
  - Add UI chips/buttons for the new filters, matching the existing design.

### 2. Signature Volumes (Backend & Admin)
- **Files**: `src/lib/perfumes.functions.ts`, `src/routes/painel-dakar-a7k9m2.tsx`
- **Schema**: 
  - I will check if the Notion database has a property for multi-select volumes or similar. 
  - If not, I'll leverage the existing `Volume` field. If a perfume needs *multiple* volumes (e.g., both 50ml and 100ml), I might need to clarify if the user wants separate items or one item with multiple volume options.
  - *Current understanding*: The user wants to *select* which volumes are available for a Signature perfume. Since the current structure seems to link one product to one volume, I will implement a UI that allows picking the volumes, but I need to see how the user expects this to be stored. 
  - *Refinement*: If the system supports multiple volumes per product, I'll store them as a comma-separated string or an array in a text field if a proper multi-select isn't available. However, looking at `Perfume` type, `volume` is a single `Volume`.
  - *Decision*: I will add a `volumesAssinatura` (or similar) field to store the selection for Signature perfumes.

### 3. Implementation Steps
1. **Frontend Filters & Sorting**:
   - Add state for availability filter.
   - Update sorting logic in `Index` component.
   - Add filter UI.
2. **Admin Panel Update**:
   - Modify `EditForm` to show volume checkboxes when collection is "Signature".
   - Update `Perfume` type and CRUD functions in `perfumes.functions.ts` to support multi-volume storage for Signature items.
   - Update Notion properties mapping.

## Acceptance Criteria
- [ ] In-stock items appear before out-of-stock items in the catalog.
- [ ] Users can filter by "Pronta Entrega" and "Sob Encomenda".
- [ ] Admin can select 50ml, 100ml, or both for Signature perfumes.
- [ ] Selection persists after saving and reloading.
