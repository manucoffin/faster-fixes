# @fasterfixes/core

Core client library for [FasterFixes](https://fasterfixes.com) — the visual feedback tool for web applications.

This package provides the API client, types, and utilities used by the FasterFixes widget. Most users should install `@fasterfixes/react` instead, which includes this package automatically.

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
  screenshotBlob // optional
);

// Fetch feedback for a page
const { feedback } = await client.getFeedback(reviewerToken, pageUrl);
```

## API

### `FasterFixesClient`

| Method | Description |
|--------|-------------|
| `getConfig()` | Fetch widget configuration (color, position, enabled) |
| `getFeedback(token, url?)` | Fetch feedback items, optionally filtered by page URL |
| `createFeedback(data, token, screenshot?)` | Submit new feedback with optional screenshot |
| `updateFeedback(id, data, token)` | Update an existing feedback comment |
| `deleteFeedback(id, token)` | Delete a feedback item |

### Utilities

| Export | Description |
|--------|-------------|
| `generateSelector(element)` | Generate a CSS selector path for a DOM element |
| `getBrowserInfo()` | Detect browser name, version, OS, and viewport size |
| `resolveReviewerToken()` | Resolve reviewer token from URL param or localStorage |

## Types

All TypeScript types are exported: `WidgetConfig`, `WidgetPosition`, `FeedbackItem`, `FeedbackStatus`, `CreateFeedbackData`, and more.

## License

[MIT](./LICENSE)
