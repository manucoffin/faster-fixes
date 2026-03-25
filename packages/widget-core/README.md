# @fasterfixes/core

> **[Documentation](https://faster-fixes.com/docs)** · [Website](https://faster-fixes.com)

Core client library for [FasterFixes](https://faster-fixes.com) — the visual feedback tool for web applications.

This package provides the API client, types, and utilities used by the FasterFixes widget. Most users should install [`@fasterfixes/react`](https://www.npmjs.com/package/@fasterfixes/react) instead, which includes this package automatically.

## Installation

```bash
npm install @fasterfixes/core
```

## Usage

```typescript
import { FasterFixesClient } from "@fasterfixes/core";

const client = new FasterFixesClient({
  apiKey: "your-project-api-key",
});

// Fetch widget configuration
const config = await client.getConfig();

// Submit feedback
await client.createFeedback(
  {
    comment: "Button is misaligned on mobile",
    pageUrl: window.location.href,
    selector: "main > div > button",
    clickX: 150,
    clickY: 320,
  },
  reviewerToken,
  screenshotBlob, // optional
);

// Fetch feedback for a page
const { feedback } = await client.getFeedback(reviewerToken, pageUrl);
```

## API

### `FasterFixesClient`

| Method                                     | Description                                           |
| ------------------------------------------ | ----------------------------------------------------- |
| `getConfig()`                              | Fetch widget configuration (color, position, enabled) |
| `getFeedback(token, url?)`                 | Fetch feedback items, optionally filtered by page URL |
| `createFeedback(data, token, screenshot?)` | Submit new feedback with optional screenshot          |
| `updateFeedback(id, data, token)`          | Update an existing feedback comment                   |
| `deleteFeedback(id, token)`                | Delete a feedback item                                |

### `ApiError`

Thrown by all client methods on non-OK responses. Extends `Error`.

| Property  | Type      | Description               |
| --------- | --------- | ------------------------- |
| `status`  | `number`  | HTTP status code          |
| `message` | `string`  | Error message from the API |
| `details` | `unknown` | Additional error details  |

### Utilities

| Export                          | Description                                                                                           |
| ------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `generateSelector(element)`     | Generate a best-effort CSS selector for a DOM element                                                 |
| `generateSelectors(element)`    | Generate multiple selector strategies and return the most stable as `best`                            |
| `resolveElement(selector, strategies?)` | Find an element using the primary selector, falling back through strategies in priority order  |
| `captureElementContext(element, selectors)` | Capture rich context about a DOM element (description, React component path, nearby text) |
| `getBrowserInfo()`              | Detect browser name, version, OS, and viewport size                                                   |
| `resolveReviewerToken()`        | Resolve reviewer token from URL param (`ff_token`) or localStorage                                    |

### Types

All TypeScript types are exported, including: `WidgetConfig`, `WidgetPosition`, `FeedbackItem`, `FeedbackStatus`, `CreateFeedbackData`, `UpdateFeedbackData`, `SelectorStrategies`, `ElementContext`, `ClientOptions`, `Labels`, and more.

### Constants

Useful constants are also exported: `FEEDBACK_STATUSES`, `WIDGET_POSITIONS`, `STATUS_COLORS`, `DEFAULT_LABELS`.

## License

[MIT](./LICENSE)
