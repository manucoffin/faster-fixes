# @fasterfixes/widget

> **[Documentation](https://faster-fixes.com/docs)** · [Website](https://faster-fixes.com)

The [FasterFixes](https://faster-fixes.com) feedback Widget for any website, with no framework required. Reviewers annotate elements on the page and submit visual feedback to your Project.

This package is under development and not published yet. React applications should install [`@fasterfixes/react`](https://www.npmjs.com/package/@fasterfixes/react).

## Usage

```ts
import { init } from "@fasterfixes/widget";

const widget = init({ projectId: "proj_..." });
```

The Widget mounts only for Reviewers: a Reviewer token must be present (from the `ff_token` URL parameter, then local storage) and the Project must have the Widget enabled. Public visitors see nothing and no config request is sent without a token. Calling `init` again destroys the previous instance first.

## Options

The Widget is configured with one option object:

| Option               | Type              | Default                        | Description                                                                                   |
| -------------------- | ----------------- | ------------------------------ | --------------------------------------------------------------------------------------------- |
| `projectId`          | `string`          | required                       | Your Project public ID, `proj_...`.                                                           |
| `apiOrigin`          | `string`          | `https://www.faster-fixes.com` | Origin of the FasterFixes API.                                                                |
| `color`              | `string`          | `#02527E`                      | Accent color.                                                                                 |
| `position`           | `WidgetPosition`  | `bottom-right`                 | One of `bottom-right`, `bottom-left`, `top-right`, `top-left`, `middle-right`, `middle-left`. |
| `labels`             | `Partial<Labels>` | English defaults               | Replaces any visible or announced string. Omitted keys keep their default.                    |
| `captureDiagnostics` | `boolean`         | `true`                         | Records the console and network history leading to a report.                                  |

An unknown `position`, a `projectId` that is not a string or a `labels` value that is not an object prevents the Widget from mounting. Development builds log a console error naming the option.

## Instance

`init` returns a `Widget`:

| Member      | Description                                                                        |
| ----------- | ---------------------------------------------------------------------------------- |
| `show()`    | Shows the Widget after `hide()`.                                                   |
| `hide()`    | Removes the Widget from the page until `show()`.                                   |
| `isVisible` | `true` while the Widget is on the page.                                            |
| `destroy()` | Removes the Widget, stops the Diagnostic Trail and restores `console` and `fetch`. |

## Theming

The Widget renders inside an open Shadow DOM, so page styles do not reach it. Theme it with CSS custom properties on the `[data-ff-widget]` host:

| Property           | Default                                                             |
| ------------------ | ------------------------------------------------------------------- |
| `--ff-accent`      | the `color` option                                                  |
| `--ff-background`  | `#1c1c1c`                                                           |
| `--ff-foreground`  | `#e4e4e7`                                                           |
| `--ff-radius`      | `8px`                                                               |
| `--ff-font-family` | `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif` |
| `--ff-z-index`     | `2147483647`                                                        |

`--ff-accent` is set inline from the `color` option, so prefer `color` to change it. Style the floating button further with `[data-ff-widget]::part(button)`.

## License

MIT
