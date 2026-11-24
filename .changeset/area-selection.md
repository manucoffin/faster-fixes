---
"@fasterfixes/core": minor
"@fasterfixes/widget": minor
"@fasterfixes/vue": patch
"@fasterfixes/angular": patch
"@fasterfixes/svelte": patch
---

Select an area of the page as well as an element. In feedback mode, a click still makes an element Selection; a drag with a mouse or pen makes an area Selection, a rectangle of the viewport, for Feedback on a gap between elements, part of a large image or chart, or whitespace. No option or toggle: the gesture decides. Movement under 6 pixels still counts as a click, an area is at least 8 by 8 pixels and stops at the viewport edges, Escape during a drag discards the rectangle and stays in feedback mode, and touch screens keep scrolling on drag and selecting an element on tap. The Screenshot stays the full viewport. See https://faster-fixes.com/docs/concepts/how-it-works.

The selector of an area Feedback targets its container, the smallest element that holds the whole rectangle, and its Pin sits at the rectangle's top-left corner. Hovering or opening that Pin redraws the area. A hint next to the cursor names both gestures, set through the new `annotationHint` label, and the new `hint`, `area` and `pin-area` parts style the hint and the rectangles. `@fasterfixes/core` makes `SelectionGeometry` a union of the new `ElementSelectionGeometry` and `AreaSelectionGeometry` types, told apart by their `element` and `click` or `area` keys.

`@fasterfixes/react`, `@fasterfixes/vue`, `@fasterfixes/angular` and `@fasterfixes/svelte` gain the feature with no change to your integration.
