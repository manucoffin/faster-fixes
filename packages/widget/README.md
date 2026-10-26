# @fasterfixes/widget

> **[Documentation](https://faster-fixes.com/docs/widget/install/script-embed)** · [Website](https://faster-fixes.com)

The [FasterFixes](https://faster-fixes.com) feedback Widget for any website, with no framework required. Reviewers annotate elements on the page and submit visual feedback to your Project. It works on WordPress, Webflow, static HTML and apps built with any framework. React, Vue, Angular and Svelte applications can also use [`@fasterfixes/react`](https://www.npmjs.com/package/@fasterfixes/react), [`@fasterfixes/vue`](https://www.npmjs.com/package/@fasterfixes/vue), [`@fasterfixes/angular`](https://www.npmjs.com/package/@fasterfixes/angular) and [`@fasterfixes/svelte`](https://www.npmjs.com/package/@fasterfixes/svelte).

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

`labels` cannot be set through attributes. To set them, or to pass the full option object, see Manual initialization below.

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

| Option               | Type                                       | Default                        | Description                                                                                   |
| -------------------- | ------------------------------------------ | ------------------------------ | --------------------------------------------------------------------------------------------- |
| `projectId`          | `string`                                   | required                       | Your Project public ID, `proj_...`.                                                           |
| `apiOrigin`          | `string`                                   | `https://www.faster-fixes.com` | Origin of the FasterFixes API.                                                                |
| `color`              | `string`                                   | `#02527E`                      | Accent color.                                                                                 |
| `position`           | `WidgetPosition`                           | `bottom-right`                 | One of `bottom-right`, `bottom-left`, `top-right`, `top-left`, `middle-right`, `middle-left`. |
| `labels`             | `Partial<Labels>`                          | English defaults               | Replaces any visible or announced string. Omitted keys keep their default.                    |
| `captureDiagnostics` | `boolean`                                  | `true`                         | Records the console and network history leading to a report.                                  |
| `customMetadata`     | `CustomMetadata \| (() => CustomMetadata)` | none                           | Key/value pairs sent with every Feedback. See below.                                          |

An unknown `position`, a `projectId` that is not a non-empty string, a `labels` value that is not an object or a `customMetadata` value that is neither an object nor a function prevents the Widget from mounting. Development builds log a console error naming the option.

`customMetadata` is shown to your team, in the agent API and in mirrored Issues, never to Reviewers. Pass an object, or a synchronous function called at each submission so a value such as a signed-in user ID stays current. Values are strings, numbers, booleans or `null`. At most 50 keys are kept, keys are truncated to 40 characters and values to 500, with a console warning in development. A function that throws never blocks a submission: the Feedback is sent without Custom metadata. It is sent whether or not `captureDiagnostics` is on.

## Instance

`init` returns a `Widget`. Its members match the `useFeedback` hook of `@fasterfixes/react`, the `useFeedback` composable of `@fasterfixes/vue`, `injectFeedback` of `@fasterfixes/angular` and `getFeedback` of `@fasterfixes/svelte`:

| Member                | Description                                                                                                              |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `show()`              | Shows the Widget after `hide()`.                                                                                         |
| `hide()`              | Removes the Widget from the page until `show()`.                                                                         |
| `isVisible`           | `true` while the Widget is on the page.                                                                                  |
| `startAnnotation()`   | Shows the Widget and enters annotation mode.                                                                             |
| `feedbackItems`       | The Feedback items of the Project loaded so far.                                                                         |
| `togglePins()`        | Hides or shows every pin on the page.                                                                                    |
| `showPins`            | `true` while pins are shown.                                                                                             |
| `subscribe(listener)` | Calls `listener` after `isVisible`, `feedbackItems` or `showPins` changes. Returns a function that removes the listener. |
| `destroy()`           | Removes the Widget, stops the Diagnostic Trail and restores `console` and `fetch`.                                       |

```html
<button type="button" onclick="window.FasterFixes.instance?.startAnnotation()">
  Report an issue
</button>
```

`subscribe` lets your own UI follow the Widget state without polling. The listener receives no arguments: read the values from the instance. `destroy()` removes every listener.

```js
const widget = init({ projectId: "proj_your_project_id" });
const unsubscribe = widget.subscribe(() => {
  counter.textContent = String(widget.feedbackItems.length);
});
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
