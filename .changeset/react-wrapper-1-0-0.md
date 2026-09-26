---
"@fasterfixes/react": major
---

`@fasterfixes/react` is now a thin wrapper around `@fasterfixes/widget`. `FeedbackProvider` mounts the same Widget as the script embed, and both embeds share one contract: the same options, the same `labels`, the same CSS custom properties and the same instance methods. `FeedbackProvider` and `useFeedback` keep their names, props and return shape, so for most installs the upgrade is a version bump. Read the list below before upgrading from 0.0.x.

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
