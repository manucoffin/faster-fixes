# @fasterfixes/svelte

## 1.0.2

### Patch Changes

- [#488](https://github.com/manucoffin/faster-fixes/pull/488) [`b2cc3d3`](https://github.com/manucoffin/faster-fixes/commit/b2cc3d3aa0da1976f6453f06b659ce9292038a2c) Thanks [@manucoffin](https://github.com/manucoffin)! - Select an area of the page as well as an element. In feedback mode, a click still makes an element Selection; a drag with a mouse or pen makes an area Selection, a rectangle of the viewport, for Feedback on a gap between elements, part of a large image or chart, or whitespace. No option or toggle: the gesture decides. Movement under 6 pixels still counts as a click, an area is at least 8 by 8 pixels and stops at the viewport edges, Escape during a drag discards the rectangle and stays in feedback mode, and touch screens keep scrolling on drag and selecting an element on tap. The Screenshot stays the full viewport. See https://faster-fixes.com/docs/concepts/how-it-works.

  The selector of an area Feedback targets its container, the smallest element that holds the whole rectangle, and its Pin sits at the rectangle's top-left corner. Hovering or opening that Pin redraws the area. A hint next to the cursor names both gestures, set through the new `annotationHint` label, and the new `hint`, `area` and `pin-area` parts style the hint and the rectangles. `@fasterfixes/core` makes `SelectionGeometry` a union of the new `ElementSelectionGeometry` and `AreaSelectionGeometry` types, told apart by their `element` and `click` or `area` keys.

  `@fasterfixes/react`, `@fasterfixes/vue`, `@fasterfixes/angular` and `@fasterfixes/svelte` gain the feature with no change to your integration.

- Updated dependencies [[`b2cc3d3`](https://github.com/manucoffin/faster-fixes/commit/b2cc3d3aa0da1976f6453f06b659ce9292038a2c)]:
  - @fasterfixes/widget@1.5.0

## 1.0.1

### Patch Changes

- [#279](https://github.com/manucoffin/faster-fixes/pull/279) [`bdec91d`](https://github.com/manucoffin/faster-fixes/commit/bdec91d566116d24297455f600236eacb0445a76) Thanks [@manucoffin](https://github.com/manucoffin)! - Add the `customMetadata` option: key/value pairs your site attaches to every Feedback, such as a user ID, a release version or a tenant. Pass a plain object, or a function the Widget calls at each submission so a value known only after sign-in is always current. Keys are strings and values are `string`, `number`, `boolean` or `null`. At most 50 keys are sent, keys are cut to 40 characters and values to 500; extra keys are dropped, long values truncated, and in development the Widget logs a warning for each, and for a key that looks sensitive, such as `token` or `email`. A function that throws sends the Feedback without Custom metadata. The pairs are independent of `captureDiagnostics`, shown to your team in the dashboard, the agent API and mirrored Issues, and never returned to a Reviewer. With the script tag, call `window.FasterFixes.init({...})` to pass it: there is no `data-*` attribute. `FeedbackProvider` in `@fasterfixes/react` accepts `customMetadata` as a prop, and an inline function does not re-initialise the Widget. `@fasterfixes/vue`, `@fasterfixes/angular` and `@fasterfixes/svelte` forward it unchanged; use the function form to keep values fresh. `@fasterfixes/core` exports the `CustomMetadata` type, the three limits and `normalizeCustomMetadata`.
- Updated dependencies [[`bdec91d`](https://github.com/manucoffin/faster-fixes/commit/bdec91d566116d24297455f600236eacb0445a76)]:
  - @fasterfixes/widget@1.3.0

## 1.0.0

### Major Changes

- [#235](https://github.com/manucoffin/faster-fixes/pull/235) [`3c2e40d`](https://github.com/manucoffin/faster-fixes/commit/3c2e40d1c85a2f03b08b1674525cbe8bbd83701d) Thanks [@manucoffin](https://github.com/manucoffin)! - First release of `@fasterfixes/svelte`, the Svelte Embed of the FasterFixes Widget. Install it with `initFasterFixes({ projectId })` in the script of your root component (the root `+layout.svelte` in SvelteKit) and control the Widget from any component under it with `getFeedback()`, which returns `show`, `hide`, `startAnnotation` and `togglePins`, plus `isVisible`, `feedbackItems` and `showPins` as read-only reactive properties. The install takes the same options as `@fasterfixes/widget`, does nothing during server rendering, destroys the Widget when the root component is destroyed, and ignores a second install under the same root. Requires Svelte 5.7 or later.
