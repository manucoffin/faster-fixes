# @fasterfixes/react

> **[Documentation](https://faster-fixes.com/docs)** · [Website](https://faster-fixes.com)

React feedback widget for [FasterFixes](https://faster-fixes.com) — collect visual feedback with screenshots, element annotations, and inline comments.

## Installation

```bash
npm install @fasterfixes/react
```

## Quick start

Wrap your app with `FeedbackProvider`:

```tsx
import { FeedbackProvider } from "@fasterfixes/react";

function App() {
  return (
    <FeedbackProvider apiKey="your-project-api-key">
      <YourApp />
    </FeedbackProvider>
  );
}
```

That's it. The widget appears as a floating button. Reviewers with a valid token can click elements, annotate them, and submit feedback with automatic screenshots.

### Customize appearance

```tsx
<FeedbackProvider
  apiKey="your-project-api-key"
  color="#e63946"
  position="bottom-left"
>
  <YourApp />
</FeedbackProvider>
```

`color` accepts any CSS color value, including CSS variables:

```tsx
<FeedbackProvider apiKey="your-project-api-key" color="var(--brand-primary)">
```

The color is applied as a `--ff-accent` CSS custom property on the widget root. Any `classNames` overrides take precedence.

## How it works

1. A reviewer visits your site with a token link (`?ff_token=...`)
2. They click the floating widget button to enter feedback mode
3. They click any element on the page to annotate it
4. A comment popover appears — they describe the issue and submit
5. A screenshot is captured automatically and uploaded with the feedback
6. Feedback pins appear on the page showing existing feedback items

## Props

### `FeedbackProvider`

| Prop         | Type                  | Required | Description                                                    |
| ------------ | --------------------- | -------- | -------------------------------------------------------------- |
| `apiKey`     | `string`              | Yes      | Your FasterFixes project API key                               |
| `apiOrigin`  | `string`              | No       | Custom API origin (default: `https://www.faster-fixes.com`)    |
| `color`      | `string`              | No       | Widget accent color — any CSS color value (default: `#02527E`) |
| `position`   | `WidgetPosition`      | No       | Floating button position (default: `bottom-right`)             |
| `classNames` | `Partial<ClassNames>` | No       | CSS class overrides for widget elements                        |
| `labels`     | `Partial<Labels>`     | No       | Custom UI text labels                                          |

### `useFeedback` hook

Control the widget programmatically:

```tsx
import { useFeedback } from "@fasterfixes/react";

function MyComponent() {
  const {
    show,
    hide,
    isVisible,
    startAnnotation,
    feedbackItems,
    togglePins,
    showPins,
  } = useFeedback();

  return (
    <button onClick={() => (isVisible ? hide() : show())}>
      Toggle feedback widget
    </button>
  );
}
```

| Property          | Type             | Description                           |
| ----------------- | ---------------- | ------------------------------------- |
| `show`            | `() => void`     | Show the widget                       |
| `hide`            | `() => void`     | Hide the widget and reset mode        |
| `isVisible`       | `boolean`        | Whether the widget is currently shown |
| `startAnnotation` | `() => void`     | Enter annotation mode directly        |
| `feedbackItems`   | `FeedbackItem[]` | All feedback items for the project    |
| `togglePins`      | `() => void`     | Toggle pin visibility on the page     |
| `showPins`        | `boolean`        | Whether pins are currently visible    |

## Features

- Visual element annotation with click-to-select
- Automatic screenshot capture
- Edit and delete existing feedback
- Resolved feedback filtering
- Dark mode UI
- Animated toolbar with list and visibility toggles
- Feedback pins positioned on annotated elements
- Element highlighting on hover and active feedback
- Cross-page feedback list with navigation
- Configurable position (corners, middle-left, middle-right)
- Configurable accent color
- Custom CSS class overrides
- Custom text labels
- SPA navigation support (URL change detection)
- Full keyboard support (Escape to cancel)

## Browser support

Works in all modern browsers (Chrome, Firefox, Safari, Edge).

## License

[MIT](./LICENSE)
