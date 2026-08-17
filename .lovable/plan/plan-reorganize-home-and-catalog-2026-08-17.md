# Plan - Reorganize Home and Catalog

Reorganize the application to separate the catalog from the home page, transforming the home page into a collection showcase.

## User Review Required

> [!IMPORTANT]
> The Home page will no longer show individual perfumes. It will show four cards (Signature, Brand Collection, Arabic Collection, Dream Brand Collection) with size selectors and dynamic pricing. The full catalog moves to `/catalogo`.

- **Home Page Prices**: I will use the following placeholder prices as requested:
    - **Signature 50ml**: R$ 149,90
    - **Signature 100ml**: R$ 229,90
    - **Other Collections**: Placeholder values like R$ 89,90 / R$ 159,90.
- **Navigation**: I will add a "Catálogo" link to the main navigation.

## Proposed Changes

### 1. New Page Components

- Create `src/components/catalog-viewer.tsx`: Move the entire catalog filtering and listing logic from `src/routes/index.tsx` into this reusable component.
- Create `src/components/collection-showcase.tsx`: A new component for the home page showcase cards with size selectors and dynamic prices.

### 2. Routes

- Create `src/routes/catalogo.tsx`: A new route that renders the `CatalogViewer` component.
- Update `src/routes/index.tsx`: Remove the catalog section and render the new `CollectionShowcase` component.

### 3. Navigation & UI

- Update `src/routes/__root.tsx`: Add "Catálogo" to the navbar (or update the navigation logic in `src/routes/index.tsx` if it's local to the layout).
- Update the mobile and desktop navigation items in `src/routes/index.tsx` to link to `/catalogo` instead of `#catalogo`.

## Technical Details

- **Showcase Data**: A centralized constant `COLLECTION_SHOWCASE_DATA` will store descriptions, sizes, and prices for easy editing.
- **State Management**: The catalog filtering state will be moved into the `CatalogViewer` component to keep it encapsulated.
- **Responsive Design**: Use Tailwind grid and flex classes to ensure the showcase looks premium on all devices.
