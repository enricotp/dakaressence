# Plan - Navigation & Catalog Refactoring

Refactor the application navigation to separate the catalog from the home page sections and standardize the header across all routes. Implement collection-to-catalog filtering with size support.

## User Review Required

> [!IMPORTANT]
> - I will separate "Catálogo" into its own standalone button in the header.
> - Clicking "Descobrir Fragrâncias" on the home page will redirect to the catalog with collection and size filters pre-applied.

## Proposed Changes

### 1. Header & Navigation (Global)

- **Standardize Header:** Modify `src/routes/index.tsx` and `src/routes/catalogo.tsx` to use a consistent header structure.
- **Separate Catálogo:** In the header, move "Catálogo" out of the scroll-spy pill and make it a separate standalone button/pill next to it.
- **Scroll-Spy Fix:** Correct the indicator logic in `src/routes/index.tsx` for Home/Sobre/FAQ and ensure it doesn't break when navigating between pages.
- **Persistent Controls:** Ensure "Rastrear" and "Carrinho" are visible on all pages.

### 2. Home Page Showcase

- **Action Label:** Update `src/components/collection-showcase.tsx` to replace all "Saber mais" buttons with "Descobrir Fragrâncias".
- **Navigation Logic:** Implement the redirect to `/catalogo` using URL parameters (e.g., `?colecao=Signature&volume=50ml`) when "Descobrir Fragrâncias" is clicked.

### 3. Catalog Enhancements (`/catalogo`)

- **Size Filter:** Add a segmented size selector to `src/components/catalog-viewer.tsx`.
- **Dynamic Options:** The size selector will show options based on the active collection (e.g., 50ml/100ml for Signature, 80ml/100ml for Dream Brand).
- **Filter State:** Update `CatalogViewer` to read initial filters from URL parameters and keep the size filter in sync with other filters.
- **Automatic Reset:** Reset the size filter if the user switches to a collection that doesn't support the currently selected size.

## Technical Details

- Use `@tanstack/react-router`'s `useSearch` and `useNavigate` for managing filter state via URL.
- Extract the Header into a shared component if feasible, or ensure identical implementations in both route files.
- Update `src/lib/perfumes.functions.ts` types if necessary for strict volume/collection handling.
