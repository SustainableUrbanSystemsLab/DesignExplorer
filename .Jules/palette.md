## 2024-04-17 - Actionable Empty States
**Learning:** Empty states in data exploration tools (like parallel coordinates) often happen accidentally via over-filtering. Users need immediate recovery paths within the context of the empty state itself, rather than hunting for global controls (like a Navbar reset button).
**Action:** Always provide an actionable recovery button (e.g., "Reset Filters") directly within "No results found" empty states to reduce cognitive load and friction.
## 2023-10-27 - Svelte Custom Tab Accessibility
**Learning:** Custom tab implementations built with Svelte `#if` blocks and state variables inherently lack the semantic meaning screen readers require to navigate tabs effectively.
**Action:** Always verify that components mimicking standard UI controls (like tabs) explicitly declare their roles (`tablist`, `tab`, `tabpanel`) and manage ARIA states (`aria-selected`, `aria-controls`, `aria-labelledby`) to ensure full accessibility. Additionally, apply `focus-visible` styles to tab buttons and active panels to support keyboard navigation.
