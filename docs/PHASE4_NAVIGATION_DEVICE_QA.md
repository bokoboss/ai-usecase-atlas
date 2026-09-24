# Phase 4 — Navigation, Detail/Toolkit and Device QA

**Date:** 2026-09-24

## URL state

The app now serializes useful product state into the URL:

- tab,
- Discover search query and filters,
- expanded-library state,
- Start Here role,
- Quick Ideas query/moment/time filters,
- Toolkit view,
- open Use Case,
- open Quick Idea.

Unknown parameters such as campaign/source parameters are preserved.

Tabs and detail overlays create history entries; search typing/filter changes replace the current entry. Browser Back/Forward therefore returns users to meaningful prior states instead of losing context.

## Faster interaction

- Use Case cards now expose Save and Tried actions directly without forcing the user to open Detail first.
- Detail header exposes Copy Prompt as a primary action.
- Quick Idea Detail header exposes Copy Prompt and Share.
- Search result views have a Share this page action so a filtered result set can be copied as a URL.
- Toolkit cards can be removed from Saved/Tried directly.

## Mobile / touch QA

- modal body scroll is locked while overlays are open,
- Escape closes the active overlay on keyboard devices,
- full-width Detail on small screens,
- safe-area-aware mobile bottom navigation,
- 44 px touch targets on coarse-pointer devices,
- horizontal action overflow instead of wrapping the sticky detail header into a tall block,
- bottom-sheet behavior for Guided Finder on mobile,
- horizontal overflow clipped at root.

## Automated product regression

`npm run check:product` verifies:

1. 650 Quick Ideas remain after dedupe.
2. exactly 50 standalone ideas have explicit contextual guides.
3. every linked Quick Idea resolves to an existing Use Case.
4. legacy generic standalone prompts do not leak into generated prompts.
5. URL state round-trips without losing state.
6. unrelated URL query parameters are preserved.
