## 2024-05-01 - Add missing ARIA labels to Icon Buttons and Focus Outlines
**Learning:** In highly interactive Svelte components like `ViewerPanel` and `ThumbnailGrid`, toggle buttons and icon-only buttons (like favorites) often lack accessible names, role groupings, or state attributes like `aria-pressed`. This leaves screen reader users completely unaware of what the control does, or its current state. Additionally, `focus-visible` styling was not implemented causing a bad keyboard user experience.
**Action:** When implementing toggles, add `role="group"` and `aria-pressed`. For icon-only buttons, use `aria-label` along with `aria-hidden="true"` on the underlying textual/graphical content to prevent redundant reading. Always add `focus-visible:ring-X` to interactive elements.

## 2026-04-06 - Expand/Collapse Accessibility
**Learning:** Found a common pattern where collapsible elements visually update using conditional rendering (`{#if showHelp}`), but screen reader users aren't informed of the state or the linked content.
**Action:** Always add `aria-expanded` indicating the boolean state and `aria-controls` pointing to the `id` of the content block it toggles.

## 2024-06-25 - Custom File Input Accessibility and Modal Escapes
**Learning:** Hidden file inputs (`class="hidden"`) inside stylized labels completely break keyboard navigation, as users cannot tab to the input to trigger the file browser. Additionally, modals without keyboard (Escape) or explicit visual close buttons trap keyboard and screen reader users.
**Action:** Use `class="sr-only"` instead of `class="hidden"` for custom file inputs, and add `focus-within:ring-2` on the parent label to visibly indicate focus. Always provide `<svelte:window onkeydown={(e) => e.key === 'Escape' && close()} />` and a clearly labeled `aria-label="Close modal"` button in dialog headers.