# Plan: Exibir Marca dos Perfumes no Catálogo, Página Individual e Admin

Exibir a marca de cada perfume conforme as instruções do Notion, garantindo que o campo seja editável no painel administrativo e visível nas áreas públicas.

## Technical Details

### 1. Data Layer (Notion Integration)
- **File:** `src/lib/perfumes.functions.ts`
- **Action:**
    - Verify that `Perfume` type already includes `marca: string | null`. (Already confirmed in code).
    - Ensure `getPerfumes` correctly maps `page.properties["Marca"]?.select?.name` to the `marca` field. (Already confirmed in code).
    - In `atualizarPerfume`, ensure `Marca` is updated as a `select` property. (Already confirmed in code).
    - In `criarPerfume`, ensure `Marca` is included in the payload. (Already confirmed in code).

### 2. Admin Panel
- **File:** `src/routes/painel-dakar-a7k9m2.tsx`
- **Action:**
    - The `EditForm` component already includes a `Marca` field with autocomplete.
    - Ensure the `duplicar` functionality correctly passes the `marca`. (Already confirmed).
    - Verify that `criarPerfume` in admin passes `marca`. (Already confirmed).
    - No changes needed in Admin as it's already implemented, just verifying consistency.

### 3. Public Catalog
- **File:** `src/components/catalog-viewer.tsx`
- **Action:**
    - Update the perfume card rendering to display `p.marca` right below the perfume name.
    - Style it with a smaller, discrete font (e.g., `text-[10px]` or `text-xs`, `text-muted-foreground`).
    - Add a check: if `p.marca` is null/empty, hide the line.
    - Ensure names/brands handle overflow gracefully (using `truncate` or `line-clamp-1`).

### 4. Product Detail Page
- **File:** `src/routes/perfume.$id.tsx`
- **Action:**
    - Display `p.marca` below the perfume name and above the price/info row.
    - Style it as secondary text (smaller than the H1 name).
    - Hide if empty.

## User Interface Changes

- **Catalog:** Card now shows "Brand" below "Name".
- **Detail:** Product title is followed by the Brand name.
- **Admin:** (Verification) Field is present for editing.
