# Changelog

## 1.0.0

### Major Changes

- [#199](https://github.com/manucoffin/faster-fixes/pull/199) [`0651dae`](https://github.com/manucoffin/faster-fixes/commit/0651daee8a972235e424ecda5e4d0bcfd12db8fd) Thanks [@manucoffin](https://github.com/manucoffin)! - `@fasterfixes/react` is now a thin wrapper around `@fasterfixes/widget`. `FeedbackProvider` mounts the same Widget as the script embed, and both embeds share one contract: the same options, the same `labels`, the same CSS custom properties and the same instance methods. `FeedbackProvider` and `useFeedback` keep their names, props and return shape, so for most installs the upgrade is a version bump. Read the list below before upgrading from 0.0.x.

  **Dependencies**
  - The package depends on `@fasterfixes/widget` and no longer on `@fasterfixes/core`, `@floating-ui/react` or `modern-screenshot`. Peer dependencies are unchanged: `react` and `react-dom` 18 or later.

  **Rendering**
  - The Widget renders inside an open Shadow DOM attached to a `[data-ff-widget]` host element. Your site's styles, resets and `!important` rules no longer reach it, and styles that targeted the Widget's elements from your stylesheet no longer apply.
  - The Widget mounts in an effect, on the client, after hydration. On the server and on the first client render, `FeedbackProvider` renders only its `children`.
  - When `FeedbackProvider` unmounts, the Widget is destroyed: it is removed from the page, the Diagnostic Trail stops, and the patched `console`, `fetch` and `XMLHttpRequest` are restored.
  - Changing `projectId`, `apiOrigin`, `color`, `position`, `labels` or `captureDiagnostics` replaces the Widget with a new one. An inline `labels` object is compared by its values, so re-rendering with the same labels keeps the Widget in place.

  **Deprecated props**
  - `classNames` is ignored. It stays in the prop types so existing code compiles, and development builds log a console warning. Theme the Widget with the CSS custom properties `--ff-accent`, `--ff-background`, `--ff-foreground`, `--ff-radius`, `--ff-font-family` and `--ff-z-index` on `[data-ff-widget]`, and with the `::part()` selectors `button`, `overlay`, `popover`, `textarea`, `pin`, `list` and `list-item`. `color` still sets `--ff-accent`.
  - `apiKey` still works: when `projectId` is absent, its value is used as the Project ID. Development builds now log a console warning. Rename it to `projectId`.
  - Both props will be removed in version 2.

  **Removed**
  - The `@fasterfixes/react/internal` entry and `FeedbackProviderCore`. To run the Widget with a custom `FeedbackClient`, use `createWidget` from `@fasterfixes/widget/internal`.

  **Labels**
  - No key was removed or renamed. `Partial<Labels>` now accepts any string for each key; in 0.0.x its types only accepted the default English strings.
  - Strings that were hard-coded in the React UI now come from `labels`: the floating button (`startFeedback`), the exit control (`exitFeedbackMode`), the Feedback list control (`showFeedbackList`, `hideFeedbackList`) and the pins control (`showMarkers`, `hideMarkers`). The pin accessible name (`pinAriaLabel`, a function that receives an excerpt of the comment) and the branding link (`brandingLink`) are also new keys.
  - `closeButton` is now read, as the accessible name of the pin popover close control. `successMessage` is still accepted and still not displayed.

  **Hook**
  - `useFeedback` subscribes to the Widget instance: components re-render when `isVisible`, `feedbackItems` or `showPins` change. Before the Widget mounts, it returns `isVisible: false`, `feedbackItems: []` and `showPins: true`, and its methods do nothing.

  See https://faster-fixes.com/docs/widget/react for the updated documentation.

### Patch Changes

- Updated dependencies [[`9d43ac2`](https://github.com/manucoffin/faster-fixes/commit/9d43ac25e4435ea0b86d245fc9ecd9965c1f3b02)]:
  - @fasterfixes/widget@1.1.0

## 0.0.13

### Patch Changes

- [#197](https://github.com/manucoffin/faster-fixes/pull/197) [`9ec2011`](https://github.com/manucoffin/faster-fixes/commit/9ec2011155c0eb66d95485c5c98b862d2fc0ccdd) Thanks [@manucoffin](https://github.com/manucoffin)! - The comment and pin popovers now stay inside the viewport when the selected element is taller than the screen. When neither side of the element has room, the popover sits against the visible edge of the viewport, over the element, instead of rendering off screen.
- Updated dependencies [[`571b6f9`](https://github.com/manucoffin/faster-fixes/commit/571b6f9f9a00104ece629d6ce45dfb64846e78d8)]:
  - @fasterfixes/core@0.1.0

## 0.0.12

### Patch Changes

- [#173](https://github.com/manucoffin/faster-fixes/pull/173) [`69e80e5`](https://github.com/manucoffin/faster-fixes/commit/69e80e563af5685cbcae11b511cbfa0c0a674db6) Thanks [@manucoffin](https://github.com/manucoffin)! - Diagnostic Trail: a console argument that `JSON.stringify` cannot represent is now recorded as `[Unserializable]` instead of `[object Object]`. Internal typing cleanup in both packages, with no public API change.

- [#173](https://github.com/manucoffin/faster-fixes/pull/173) [`68548c8`](https://github.com/manucoffin/faster-fixes/commit/68548c875c5a3ff52753ec70b4ec1668cdccee56) Thanks [@manucoffin](https://github.com/manucoffin)! - Internal cleanup for the React Compiler lint rules: popovers, pins and the feedback list no longer read refs during render or set state synchronously inside effects. No public API change; a few state updates now land one frame earlier.

- [#173](https://github.com/manucoffin/faster-fixes/pull/173) [`e904154`](https://github.com/manucoffin/faster-fixes/commit/e90415436338f37e512a2fc9698197f4d5bbc528) Thanks [@manucoffin](https://github.com/manucoffin)! - Internal typing cleanup: null checks, fallbacks and non-null assertions now match the real types. No public API change. A feedback status the widget does not know still renders with the `new` color, and an invalid `position` still falls back to `bottom-right`.
- Updated dependencies [[`5ec51c6`](https://github.com/manucoffin/faster-fixes/commit/5ec51c67e79287bc8ee457d8df2c29b25225476d), [`69e80e5`](https://github.com/manucoffin/faster-fixes/commit/69e80e563af5685cbcae11b511cbfa0c0a674db6), [`e904154`](https://github.com/manucoffin/faster-fixes/commit/e90415436338f37e512a2fc9698197f4d5bbc528)]:
  - @fasterfixes/core@0.0.8

## 0.0.11

### Patch Changes

- [`4a3e22a`](https://github.com/manucoffin/faster-fixes/commit/4a3e22a5bc2b6b4d58486b2e0fa9ad3d872079ce) Thanks [@manucoffin](https://github.com/manucoffin)! - Screenshots now capture the viewport as currently scrolled instead of the top of the document, so the image matches what the reviewer was looking at when they pinned the feedback.

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
