## 2024-04-17 - Actionable Empty States
**Learning:** Empty states in data exploration tools (like parallel coordinates) often happen accidentally via over-filtering. Users need immediate recovery paths within the context of the empty state itself, rather than hunting for global controls (like a Navbar reset button).
**Action:** Always provide an actionable recovery button (e.g., "Reset Filters") directly within "No results found" empty states to reduce cognitive load and friction.
## 2023-10-27 - Svelte Custom Tab Accessibility
**Learning:** Custom tab implementations built with Svelte `#if` blocks and state variables inherently lack the semantic meaning screen readers require to navigate tabs effectively.
**Action:** Always verify that components mimicking standard UI controls (like tabs) explicitly declare their roles (`tablist`, `tab`, `tabpanel`) and manage ARIA states (`aria-selected`, `aria-controls`, `aria-labelledby`) to ensure full accessibility. Additionally, apply `focus-visible` styles to tab buttons and active panels to support keyboard navigation.
## 2024-04-19 - Accessible Disabled Action States
**Learning:** When actions like 'Export' are dynamically disabled due to state changes (e.g., empty filters), simply removing pointer events is insufficient. Providing a disabled state combined with a tooltip explaining *why* the action is unavailable prevents user frustration and improves discoverability.
**Action:** Add explicit visual disabled states and explanatory `title` or `aria-label` tooltips to context-dependent buttons when their prerequisites are not met.
## 2026-04-21 - Action Discoverability in Empty States
**Learning:** When components like Favorites lists have an empty state, wrapping all actions inside a 'count > 0' conditional completely removes the ability to populate the list via external means (e.g., Import JSON), trapping the user.
**Action:** Ensure that data-ingestion actions (like Import, Add, Create) remain visible and fully functional outside of empty-state blocks. Provide clear disabled states (with 'title' tooltips) for data-export actions instead of hiding them completely.
## 2024-05-18 - Consistent Keyboard Navigation and ARIA on Toggle Buttons
**Learning:** Custom toggle buttons and inline actions often miss keyboard focus states and screen reader state announcements (`aria-pressed`), making them invisible or confusing to non-mouse users.
**Action:** Always ensure that every interactive element has consistent `focus-visible:ring-2 focus-visible:ring-blue-500` styles. Additionally, explicitly use `aria-pressed` on buttons that act as toggles so their state is properly conveyed to assistive technologies.
## 2025-02-12 - Inline Deletion Actions for Quick Lists
**Learning:** For quick-access lists (like a favorites panel), requiring users to navigate away from their current context or select an item just to remove it causes unnecessary friction. Users expect inline management for simple lists.
**Action:** Provide inline deletion/removal buttons directly within list items, ensuring they are accessible via keyboard focus and screen readers, but visually subtle (e.g., appearing on hover or focus) to avoid cluttering the UI.
## 2026-04-24 - Consistent Keyboard Navigation Focus Rings on Native Inputs
**Learning:** Native input elements like range sliders and checkboxes often lack sufficient default focus indicators across browsers, making keyboard navigation difficult to track for users. While custom buttons often receive focus styles, native inputs are sometimes overlooked.
**Action:** Always ensure that native interactive elements (`<input type="range">`, `<input type="checkbox">`) have consistent `focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1` styles to clearly indicate focus state.
