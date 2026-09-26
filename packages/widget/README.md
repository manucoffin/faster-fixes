# @fasterfixes/widget

> **[Documentation](https://faster-fixes.com/docs/widget/script-embed)** · [Website](https://faster-fixes.com)

The [FasterFixes](https://faster-fixes.com) feedback Widget for any website, with no framework required. Reviewers annotate elements on the page and submit visual feedback to your Project. It works on WordPress, Webflow, static HTML and apps built with Vue, Angular, Svelte or any other framework. React applications can also use [`@fasterfixes/react`](https://www.npmjs.com/package/@fasterfixes/react).

The Widget ships no framework runtime and renders inside an open Shadow DOM, so your site's CSS does not affect it.

## Script tag

Paste one tag into your site, replacing the Project ID with your own:

```html
<script
  src="https://cdn.jsdelivr.net/npm/@fasterfixes/widget@1/dist/widget.iife.js"
  data-project-id="proj_your_project_id"
  defer
></script>
```

The tag works in the `<head>` with `defer`, at the end of the `<body>`, or injected after the page has loaded. The `@1` channel serves every 1.x release: fixes arrive without editing the snippet, and a breaking change only ships under a new major version.

### Attributes

| Attribute                  | Required | Description                                                                       |
| -------------------------- | -------- | --------------------------------------------------------------------------------- |
| `data-project-id`          | Yes      | Your Project ID. Without it, the script loads but does not initialize the Widget. |
| `data-api-origin`          | No       | Origin of the FasterFixes API. Defaults to `https://www.faster-fixes.com`.        |
| `data-color`               | No       | Accent color. Accepts any CSS color value. Defaults to `#02527E`.                 |
| `data-position`            | No       | Floating button placement. Defaults to `bottom-right`.                            |
| `data-capture-diagnostics` | No       | Set to `"false"` to disable the Diagnostic Trail. Enabled by default.             |

`labels` cannot be set through attributes. Use `init` for them.

### Manual initialization

Leave out `data-project-id` to load the script without mounting the Widget, then call `window.FasterFixes.init` yourself, for example from a framework's mount hook:

```html
<script src="https://cdn.jsdelivr.net/npm/@fasterfixes/widget@1/dist/widget.iife.js"></script>
<script>
  window.FasterFixes.init({
    projectId: "proj_your_project_id",
    labels: { submitButton: "Send" },
  });
</script>
```

Calling `init` while a Widget is mounted destroys the previous instance first, so the Widget never mounts twice. After initialization, `window.FasterFixes.instance` holds the current instance.

## npm

With a bundler, install the package and import `init`. The package ships an ESM entry with TypeScript types.

```bash
npm install @fasterfixes/widget
```

```ts
import { init } from "@fasterfixes/widget";

const widget = init({ projectId: "proj_your_project_id" });
```

`window.FasterFixes` is only defined by the script tag.

## Visibility

The Widget mounts only for Reviewers: a Reviewer token must be present (from the `ff_token` URL parameter, then local storage) and the Project must have the Widget enabled. Public visitors see nothing, and no config request is sent without a token.

## Options

`init` accepts one option object:

| Option               | Type              | Default                        | Description                                                                                   |
| -------------------- | ----------------- | ------------------------------ | --------------------------------------------------------------------------------------------- |
| `projectId`          | `string`          | required                       | Your Project public ID, `proj_...`.                                                           |
| `apiOrigin`          | `string`          | `https://www.faster-fixes.com` | Origin of the FasterFixes API.                                                                |
| `color`              | `string`          | `#02527E`                      | Accent color.                                                                                 |
| `position`           | `WidgetPosition`  | `bottom-right`                 | One of `bottom-right`, `bottom-left`, `top-right`, `top-left`, `middle-right`, `middle-left`. |
| `labels`             | `Partial<Labels>` | English defaults               | Replaces any visible or announced string. Omitted keys keep their default.                    |
| `captureDiagnostics` | `boolean`         | `true`                         | Records the console and network history leading to a report.                                  |

An unknown `position`, a `projectId` that is not a non-empty string or a `labels` value that is not an object prevents the Widget from mounting. Development builds log a console error naming the option.

## Instance

`init` returns a `Widget`. Its members match the `useFeedback` hook of `@fasterfixes/react`:

| Member              | Description                                                                        |
| ------------------- | ---------------------------------------------------------------------------------- |
| `show()`            | Shows the Widget after `hide()`.                                                   |
| `hide()`            | Removes the Widget from the page until `show()`.                                   |
| `isVisible`         | `true` while the Widget is on the page.                                            |
| `startAnnotation()` | Shows the Widget and enters annotation mode.                                       |
| `feedbackItems`     | The Feedback items of the Project loaded so far.                                   |
| `togglePins()`      | Hides or shows every pin on the page.                                              |
| `showPins`          | `true` while pins are shown.                                                       |
| `destroy()`         | Removes the Widget, stops the Diagnostic Trail and restores `console` and `fetch`. |

```html
<button type="button" onclick="window.FasterFixes.instance?.startAnnotation()">
  Report an issue
</button>
```

## Labels

Every string the Widget displays or announces to screen readers comes from `labels`. Pass partial overrides; omitted keys keep their English default. `pinAriaLabel` is a function that receives an excerpt of the Feedback comment:

```js
window.FasterFixes.init({
  projectId: "proj_your_project_id",
  labels: {
    submitButton: "Envoyer",
    cancelButton: "Annuler",
    textareaPlaceholder: "Décrivez le problème...",
    pinAriaLabel: (comment) => `Retour : ${comment}`,
  },
});
```

The full list of keys and defaults is in the [Customization docs](https://faster-fixes.com/docs/widget/customization#labels).

## Theming

Theme the Widget with CSS custom properties on its `[data-ff-widget]` host:

```css
[data-ff-widget] {
  --ff-background: #ffffff;
  --ff-foreground: #18181b;
}
```

| Property           | Default                                                             |
| ------------------ | ------------------------------------------------------------------- |
| `--ff-accent`      | the `color` option                                                  |
| `--ff-background`  | `#1c1c1c`                                                           |
| `--ff-foreground`  | `#e4e4e7`                                                           |
| `--ff-radius`      | `8px`                                                               |
| `--ff-font-family` | `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` |
| `--ff-z-index`     | `2147483647`                                                        |

`--ff-accent` is set inline from the `color` option, so prefer `color` to change it. Reach deeper elements with `::part()`: `button`, `overlay`, `popover`, `textarea`, `pin`, `list` and `list-item`.

```css
[data-ff-widget]::part(button) {
  box-shadow: none;
}
```

## License

MIT
