# @fasterfixes/widget

> **[Documentation](https://faster-fixes.com/docs)** · [Website](https://faster-fixes.com)

The [FasterFixes](https://faster-fixes.com) feedback Widget for any website, with no framework required. Reviewers annotate elements on the page and submit visual feedback to your Project.

This package is under development and not published yet. React applications should install [`@fasterfixes/react`](https://www.npmjs.com/package/@fasterfixes/react).

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

## License

MIT
