# Plan: Move Favorite Button to Bottom-Right

Reposition the favorite button in perfume cards to avoid overlap with stock badges.

## Proposed Changes

### 1. Catalog Page (src/routes/index.tsx)
- Modify the `button` used for favorites in the perfume card.
- Change its absolute position from `top-2 right-2` (and conditional variations) to `bottom-4 right-4`.
- Add `shadow-lg` and ensure a high `z-index` so it remains clickable and visible over the image or content.
- Remove the complex conditional logic that shifted the button when "Pronta entrega" was present, as the new bottom position is safe from all top-aligned badges.

### 2. Style Consistency
- Ensure the button retains its existing `backdrop-blur`, dimensions, and interaction logic.
- Verify that it doesn't collide with the "Adicionar" button if the layout expands, although the `article` has a `flex-col` structure where the `Link` (containing the image and badges) is separate from the action area below it.
- **Wait**: Re-examining the structure: the `button` is *inside* the `article` but *outside* the `Link`. The `Link` contains the image. If I put it at `bottom-4`, it might overlap the "Adicionar" button if it's placed relative to the whole `article`.
- **Refinement**: I will place the favorite button relative to the `Link` container (the image container) instead of the whole card, to ensure it stays within the image area but at the bottom-right of that area.

## Technical Details
- The card is a `group relative flex flex-col`.
- The favorite button is currently a sibling of the `Link`.
- The `Link` has `relative aspect-[4/5]`.
- I will move the button *inside* the `Link` or keep it as a sibling but ensure the `Link` doesn't capture the click if the button is overlayed. Keeping it as a sibling is safer for click handling.

## Verification Plan
- Check desktop and mobile views.
- Ensure the button is visible and works.
- Verify no overlap with "Sob encomenda" (bottom-left/right mobile) and "Pronta entrega" (top-right).
