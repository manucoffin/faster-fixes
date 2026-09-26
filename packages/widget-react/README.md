# @fasterfixes/react

> **[Documentation](https://faster-fixes.com/docs/widget/react)** · [Website](https://faster-fixes.com)

React embed of the [FasterFixes](https://faster-fixes.com) feedback widget. Reviewers click an element of your site, describe the issue, and submit it with a screenshot and the browser context.

The package is a thin wrapper around [`@fasterfixes/widget`](https://www.npmjs.com/package/@fasterfixes/widget): it mounts the same widget as the script embed and exposes it through a provider and a hook. Both embeds share the same options, `labels`, CSS custom properties and instance methods.

## Installation

```bash
npm install @fasterfixes/react
```

Requires `react` and `react-dom` 18 or later.

## Quick start

Wrap your app with `FeedbackProvider`:

```tsx
import { FeedbackProvider } from "@fasterfixes/react";

function App() {
  return (
    <FeedbackProvider projectId="proj_your_project_id">
      <YourApp />
    </FeedbackProvider>
  );
}
```

The widget appears as a floating button for Reviewers who open your site with a token link (`?ff_token=...`). Other visitors see nothing.

The widget mounts on the client, after hydration, so server rendering (including the Next.js App Router) is unaffected. When the provider unmounts, the widget is removed and every global it patched is restored.

## Props

| Prop                 | Type              | Required | Description                                                                       |
| -------------------- | ----------------- | -------- | --------------------------------------------------------------------------------- |
| `projectId`          | `string`          | Yes      | Your Faster Fixes Project ID (found in project settings)                          |
| `apiOrigin`          | `string`          | No       | API base URL (default: `https://www.faster-fixes.com`)                            |
| `color`              | `string`          | No       | Accent color, any CSS color value (default: `#02527E`)                            |
| `position`           | `WidgetPosition`  | No       | Floating button position (default: `bottom-right`)                                |
| `labels`             | `Partial<Labels>` | No       | Replaces any visible or announced string                                          |
| `captureDiagnostics` | `boolean`         | No       | Records the console and network history leading to a report (default: `true`)     |
| `children`           | `ReactNode`       | Yes      | Your application                                                                  |
| `apiKey`             | `string`          | No       | Deprecated. Use `projectId`. Used as the Project ID when `projectId` is absent    |
| `classNames`         | `object`          | No       | Deprecated and ignored. Use the CSS custom properties below. Removed in version 2 |

Changing a prop replaces the widget with one that uses the new value. In development, `apiKey` and `classNames` log a console warning.

## `useFeedback`

Control the widget from any component inside `FeedbackProvider`:

```tsx
import { useFeedback } from "@fasterfixes/react";

function ReportButton() {
  const { startAnnotation, feedbackItems } = useFeedback();

  return (
    <button onClick={startAnnotation}>
      Report an issue ({feedbackItems.length})
    </button>
  );
}
```

| Property          | Type             | Description                                 |
| ----------------- | ---------------- | ------------------------------------------- |
| `show`            | `() => void`     | Show the widget                             |
| `hide`            | `() => void`     | Hide the widget                             |
| `isVisible`       | `boolean`        | Whether the widget is currently shown       |
| `startAnnotation` | `() => void`     | Show the widget and enter annotation mode   |
| `feedbackItems`   | `FeedbackItem[]` | Feedback items of the Project loaded so far |
| `togglePins`      | `() => void`     | Toggle pin visibility on the page           |
| `showPins`        | `boolean`        | Whether pins are currently visible          |

Components re-render when `isVisible`, `feedbackItems` or `showPins` change.

## Theming

The widget renders inside a Shadow DOM, so your site's styles do not reach it. Set the accent with the `color` prop, and theme the rest with CSS custom properties on the host element:

```css
[data-ff-widget] {
  --ff-background: #ffffff;
  --ff-foreground: #18181b;
  --ff-radius: 4px;
  --ff-font-family: "Inter", sans-serif;
}
```

Available properties: `--ff-accent`, `--ff-background`, `--ff-foreground`, `--ff-radius`, `--ff-font-family` and `--ff-z-index`. Individual elements can be targeted with `::part()`. See [Customization](https://faster-fixes.com/docs/widget/customization) for defaults, parts and `labels` keys.

## Upgrading from 0.0.x

Version 1.0.0 replaces the React UI with the widget of `@fasterfixes/widget`. `FeedbackProvider` and `useFeedback` keep their names, props and return shape. `classNames` is ignored, `@fasterfixes/react/internal` is removed, and `labels` accepts new keys. The [changelog](./CHANGELOG.md) lists every change.

## Browser support

Works in all modern browsers (Chrome, Firefox, Safari, Edge).

## License

[MIT](./LICENSE)
