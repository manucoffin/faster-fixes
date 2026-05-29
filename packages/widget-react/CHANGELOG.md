# Changelog

## 0.0.8

### Added
- `captureDiagnostics` prop on `FeedbackProvider` (default `true`). When enabled, the widget records a Diagnostic Trail — recent console output and network requests — from mount and attaches it to each submitted feedback, giving reviewers the browser context needed to reproduce issues. Capture is invisible to the reviewer. Set `captureDiagnostics={false}` to opt a site out entirely; the widget then never patches `console` or the network. Requires `@fasterfixes/core` 0.0.7+.

## 0.0.7

### Added
- `@fasterfixes/react/internal` subpath export exposing `FeedbackProviderCore`. Marked `@unstable` (no semver guarantees). Lets advanced integrators wire a custom `FeedbackClient` (from `@fasterfixes/core`) into the widget without using a real reviewer token or backend — useful for offline development, e2e tests, and embedded demos.

### Changed
- Internally split `FeedbackProvider` into a public init wrapper (resolves reviewer token + config) and `FeedbackProviderCore` (renders the widget given pre-resolved values). No change to the public `FeedbackProvider` API.
- Core defers portal mounting until after hydration to keep direct Core consumers SSR-safe.

## 0.0.6

### Fixed
- Feedback pin stability: pins now anchor to either the document or the viewport depending on whether the targeted element scrolls with the page, so they no longer drift, disappear, or jump when the user scrolls. Pin positioning logic extracted to shared utilities (`getPinAnchor`, `getPinPlacementMetadata`, `getViewportAnchoringKind`).
- Floating button interaction polish across modes (large internal refactor of the button, pin popover, and comment popover).

## 0.0.5

### Changed
- Screenshots upload in the background after feedback submission instead of blocking the submit. Visitors see "submitted" immediately; the screenshot is attached via a follow-up `attachScreenshot` call. Reduces perceived latency on slow connections.

## 0.0.4

### Changed
- Default API origin updated to `https://www.faster-fixes.com` (canonical host). Existing consumers passing an explicit `apiOrigin` are unaffected.

## 0.0.3

### Added
- Vertical toolbar with smooth expand/collapse animations
- Show/hide feedback pins toggle
- Feedback list toggle with slide-in/out animations
- Dark mode UI theme
- Element highlighting on pin hover and active feedback
- Cross-page feedback list with navigation
- Pending feedback deep linking via sessionStorage
- SPA navigation detection (URL change polling + popstate)
- Close-on-outside-click for pin popover
- Smart pin positioning (flips when near viewport edges)
- `middle-right` and `middle-left` widget positions
- Fade-out animation on successful feedback submission

### Fixed
- Screenshot capture failing with modern CSS color functions (switched to html2canvas-pro)
- Screenshot race condition where blob wasn't ready at submit time
- Widget buttons unclickable during feedback mode
- Dialogs/drawers closing when interacting with the widget
- Pins appearing at wrong position on page reload
- Pin popover retaining stale state (delete/edit) across different feedback items
- Popovers appearing behind the toolbar
- Z-index issues with host page modals and drawers

## 0.0.2

### Added
- Annotation overlay with element highlighting
- Comment popover with submit/cancel/retry states
- Feedback pins with status colors
- Pin popover for viewing, editing, and deleting feedback
- Collapsible feedback list with resolved filter
- Screenshot capture via html2canvas
- Floating UI positioning for popovers
- Configurable position, color, class names, and labels

## 0.0.1

### Added
- `FeedbackProvider` component
- `useFeedback` hook for programmatic control
- Basic floating button with annotation mode
