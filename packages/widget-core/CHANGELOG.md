# Changelog

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
