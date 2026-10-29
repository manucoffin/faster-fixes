# Changelog

## 0.3.0

### Minor Changes

- [#287](https://github.com/manucoffin/faster-fixes/pull/287) [`4d6a401`](https://github.com/manucoffin/faster-fixes/commit/4d6a401c5ac6d9900bb2ad3d60210164d8972fa4) Thanks [@manucoffin](https://github.com/manucoffin)! - Record where the Selection sat on screen when the Reviewer made it. Each Feedback now carries a `selection` object in its metadata, measured in the same tick the Screenshot capture starts: the viewport size, the selected element's rectangle and the click point, all in viewport CSS pixels. The inbox uses it to draw the Selection frame over the Screenshot. `@fasterfixes/core` exports its shape as the `SelectionGeometry` type. No option, attribute or API contract changes.

## 0.2.0

### Minor Changes

- [#279](https://github.com/manucoffin/faster-fixes/pull/279) [`bdec91d`](https://github.com/manucoffin/faster-fixes/commit/bdec91d566116d24297455f600236eacb0445a76) Thanks [@manucoffin](https://github.com/manucoffin)! - Add the `customMetadata` option: key/value pairs your site attaches to every Feedback, such as a user ID, a release version or a tenant. Pass a plain object, or a function the Widget calls at each submission so a value known only after sign-in is always current. Keys are strings and values are `string`, `number`, `boolean` or `null`. At most 50 keys are sent, keys are cut to 40 characters and values to 500; extra keys are dropped, long values truncated, and in development the Widget logs a warning for each, and for a key that looks sensitive, such as `token` or `email`. A function that throws sends the Feedback without Custom metadata. The pairs are independent of `captureDiagnostics`, shown to your team in the dashboard, the agent API and mirrored Issues, and never returned to a Reviewer. With the script tag, call `window.FasterFixes.init({...})` to pass it: there is no `data-*` attribute. `FeedbackProvider` in `@fasterfixes/react` accepts `customMetadata` as a prop, and an inline function does not re-initialise the Widget. `@fasterfixes/vue`, `@fasterfixes/angular` and `@fasterfixes/svelte` forward it unchanged; use the function form to keep values fresh. `@fasterfixes/core` exports the `CustomMetadata` type, the three limits and `normalizeCustomMetadata`.

## 0.1.0

### Minor Changes

- [#197](https://github.com/manucoffin/faster-fixes/pull/197) [`571b6f9`](https://github.com/manucoffin/faster-fixes/commit/571b6f9f9a00104ece629d6ce45dfb64846e78d8) Thanks [@manucoffin](https://github.com/manucoffin)! - `DEFAULT_LABELS` gains the strings the widget used to hard-code: `startFeedback`, `exitFeedbackMode`, `showFeedbackList`, `hideFeedbackList`, `showMarkers`, `hideMarkers`, `brandingLink` (the product link in the Feedback list footer), and `pinAriaLabel`, a function that receives the Feedback comment excerpt and returns the pin's accessible name. `Labels` is now an explicit interface whose text keys are typed `string`, so a `Partial<Labels>` accepts any custom wording. No key was removed or renamed.

## 0.0.8

### Patch Changes

- [#173](https://github.com/manucoffin/faster-fixes/pull/173) [`5ec51c6`](https://github.com/manucoffin/faster-fixes/commit/5ec51c67e79287bc8ee457d8df2c29b25225476d) Thanks [@manucoffin](https://github.com/manucoffin)! - `ApiError`: an error response whose body is not JSON, is `null`, or carries a non-string `error` now yields `"Request failed"` as the message instead of throwing a `TypeError` or passing the raw value through. Well-formed error responses are unchanged.

- [#173](https://github.com/manucoffin/faster-fixes/pull/173) [`69e80e5`](https://github.com/manucoffin/faster-fixes/commit/69e80e563af5685cbcae11b511cbfa0c0a674db6) Thanks [@manucoffin](https://github.com/manucoffin)! - Diagnostic Trail: a console argument that `JSON.stringify` cannot represent is now recorded as `[Unserializable]` instead of `[object Object]`. Internal typing cleanup in both packages, with no public API change.

- [#173](https://github.com/manucoffin/faster-fixes/pull/173) [`e904154`](https://github.com/manucoffin/faster-fixes/commit/e90415436338f37e512a2fc9698197f4d5bbc528) Thanks [@manucoffin](https://github.com/manucoffin)! - Internal typing cleanup: null checks, fallbacks and non-null assertions now match the real types. No public API change. A feedback status the widget does not know still renders with the `new` color, and an invalid `position` still falls back to `bottom-right`.

## 0.0.7

### Added

- Diagnostic Trail capture. `createDiagnosticsRecorder({ apiOrigin })` instruments `console`, `fetch`, and `XMLHttpRequest` to keep a bounded in-memory ring of recent console and network activity, snapshotted into a `DiagnosticTrail` when feedback is submitted. Network entries are metadata-only (method, URL, status, duration); the widget's own traffic to the Faster Fixes API is excluded.
- `redactUrl` helper (applied internally during capture) that strips the values of sensitive query params (`token`, `key`, `secret`, …) from captured URLs client-side, so secrets never leave the page.
- New types `DiagnosticTrail`, `ConsoleEntry`, `NetworkEntry`, and `ConsoleLevel`; a new optional `diagnosticTrail` field on `CreateFeedbackData`; and `DIAGNOSTICS_MAX_ENTRIES`, `DIAGNOSTICS_MAX_MESSAGE_BYTES`, and `DIAGNOSTICS_REDACT_PARAMS` constants.

## 0.0.6

### Added

- `FeedbackClient` interface describing the shape implemented by `FasterFixesClient`. Lets consumers swap in custom backends (e.g. localStorage, in-memory mocks) without forking the widget.

## 0.0.5

### Added

- `attachScreenshot(feedbackId, blob, reviewerToken)` method on `FasterFixesClient`. Lets the widget upload a screenshot asynchronously after the feedback record has been created, so the submit interaction is no longer blocked on the upload.

## 0.0.4

### Changed

- `DEFAULT_API_ORIGIN` normalized to `https://www.faster-fixes.com` so client requests use the canonical host (avoids the redirect from the apex domain).

## 0.0.3

### Added

- `DEFAULT_WIDGET_COLOR` and `DEFAULT_WIDGET_POSITION` constants. Color and position are now applied as `FeedbackProvider` props instead of read from the server config, so the widget no longer needs a round-trip to render with the right styling.
- `branding: boolean` field on `WidgetConfig` to support white-label / paid-plan branding removal.

### Removed

- `color` and `position` fields from `WidgetConfig`. These moved to `FeedbackProvider` props in `@fasterfixes/react` — projects upgrading should pass them directly on the provider.

## 0.0.2

### Added

- Client-side logging for screenshot upload debugging
- `getFeedback` now accepts optional `url` parameter to fetch all project feedback

### Fixed

- Screenshot blob not being attached to feedback submissions

## 0.0.1

### Added

- `FasterFixesClient` with full CRUD operations for feedback
- `generateSelector` utility for CSS selector generation
- `getBrowserInfo` utility for browser/OS detection
- `resolveReviewerToken` for URL-based token resolution
- TypeScript types for all API contracts
- Widget position and configuration types
