# Milestone 2 — Feedback Widget (JavaScript SDK)

## Overview

Build a React-based feedback widget that allows reviewers to annotate elements on a website, leave comments, and capture screenshots. The widget communicates with the Faster Fixes API via public REST endpoints authenticated by project API key and reviewer token.

---

## Architecture

### Package Structure

Two new monorepo packages:

```
packages/
  widget-core/     ← API client, shared types, Zod schemas, constants   (npm: @fasterfixes/core)
  widget-react/    ← React provider, hooks, UI components, html2canvas  (npm: @fasterfixes/react)
```

**`widget-core`** (`@fasterfixes/core`) holds framework-agnostic code: the HTTP client for all `/api/v1/` endpoints, TypeScript types for request/response payloads, Zod validation schemas, and shared constants (status values, position options). This package is reused by future framework wrappers (Angular, Vue, etc.).

**`widget-react`** (`@fasterfixes/react`) is the React-specific implementation: the `FeedbackProvider` component, annotation mode logic, screenshot capture via html2canvas, CSS selector generation, popover/pin UI, and all hooks. It depends on `widget-core`.

### Widget Initialization

Provider-only API. The provider renders the floating button and all widget UI via a React portal. No separate component needed.

```tsx
import { FeedbackProvider } from "@faster-fixes/widget-react";

// Hosted (default — apiOrigin points to Faster Fixes)
<FeedbackProvider apiKey="proj_xxx">
  {children}
</FeedbackProvider>

// Self-hosted
<FeedbackProvider apiKey="proj_xxx" apiOrigin="https://feedback.mycompany.com">
  {children}
</FeedbackProvider>
```

---

## Reviewer Identity

Reviewers are created in the dashboard per project (existing `Reviewer` model with `name`, `token`, `isActive`).

### Token Flow

1. Project owner creates a reviewer in the dashboard → unique token generated
2. Owner shares a URL with the reviewer: `site.com/page?ff_token=abc123`
3. Widget reads `ff_token` from the URL query parameter
4. Token is stored in `localStorage` (key: `ff_reviewer_token`)
5. Widget removes the token from the URL using `history.replaceState` (clean URL)
6. On subsequent visits, the token is read from `localStorage`

### No Token Behavior

If no token is found in the URL or `localStorage`, the widget does not render at all. It is invisible to non-reviewers.

---

## Widget Lifecycle

### 1. Provider Mount

On mount, the provider:

1. Reads the reviewer token from URL → stores in localStorage → strips from URL
2. If no token found, bail — render nothing
3. Fetches widget config from `GET /api/v1/widget/config` (position, color, enabled status)
4. If `enabled === false`, render nothing
5. Validates the current page origin against the project's allowed domain
6. Fetches existing feedback for the current page URL from `GET /api/v1/feedback?url=...`
7. Renders the floating button and any existing feedback pins

### 2. Idle State

- Floating button visible at the configured position (default: bottom-right)
- Existing unresolved feedback displayed as icon pins on their target elements
- Toggle available to show/hide resolved feedback (default: unresolved only)

### 3. Feedback List Panel

When the widget is active, a collapsible list panel appears above the floating button showing all feedback for the current page:

- Each item shows: truncated comment, status color indicator, reviewer name
- Clicking an item scrolls to the target element (if on the same page) and opens its pin popover. If the feedback is on a different page, navigates to that page URL.
- The list can be collapsed/hidden independently of annotation mode — so the reviewer can dismiss the list to access elements behind it while staying in feedback mode
- The list respects the same show/hide resolved toggle as pins

### 4. Annotation Mode (activated by clicking the floating button)

- Cursor changes to crosshair
- As the user hovers over elements: a colored outline + semi-transparent overlay (transparent enough to see content underneath) highlights the element under the cursor
- Click an element to select it
- Pressing `Escape` or clicking the floating button again exits annotation mode without submitting
- If a popover is open, `Escape` closes the popover first

### 5. Element Selection & Screenshot

- On element click:
  - Screenshot is captured asynchronously via html2canvas (viewport only)
  - The comment popover opens immediately — user can start typing while screenshot captures in the background
  - A best-effort unique CSS selector is generated for the element
  - Click coordinates (relative to viewport) are recorded

### 6. Comment Popover

- Anchored to the selected element using smart auto-positioning (Floating UI / Popper — flips to the side with the most available space)
- Minimal UI: textarea + submit button + cancel/close link
- No additional fields beyond the text comment — all metadata captured automatically

### 7. Submission

- On submit: `POST /api/v1/feedback` (multipart form data)
  - Screenshot blob as file field (max 5MB)
  - JSON metadata: comment, elementSelector, clickX, clickY, pageUrl, browser info, viewport dimensions, reviewer token
- On success: popover content swaps to an in-place success state with a close button
- On failure: inline error message in the popover with a "Retry" button — form state preserved

### 8. Post-Submission

- After closing the success state, a pin icon remains on the selected element
- The pin is color-coded by status (e.g., red = open/new)
- Clicking the pin reopens a popover showing the feedback details
- From the pin popover, users can:
  - Edit the comment text (only the comment — element, screenshot, metadata are immutable)
  - Delete the feedback if no longer pertinent
- Status changes (new → in progress → resolved → closed) are managed exclusively from the dashboard

---

## Feedback Pins

### Rendering

- All existing feedback for the current page URL is fetched on provider mount
- Each feedback item renders as an icon marker (small chat bubble or flag icon) positioned at the target element
- Color-coded by status: distinct colors for open (new), in progress, resolved
- By default, only unresolved feedback is shown
- A toggle in the widget allows showing/hiding resolved feedback

### Positioning

- Primary: CSS selector match — pin rendered at the matched element's position
- Fallback: absolute page coordinates (stored as `clickX`, `clickY`) if the selector doesn't match
- Static after initial render — no recalculation on scroll/resize

### Interaction

- All pins are visible and editable by any reviewer (trust the team — no ownership enforcement in the widget)
- Click a pin to open its feedback popover (view comment, edit, delete)
- Status is read-only in the widget (display only, changes from dashboard)

---

## Styling

### Default Styles

Scoped CSS classes with a `ff-` prefix (e.g., `ff-button`, `ff-popover`, `ff-pin`). Self-contained — no external CSS dependencies required.

### Custom Class Overrides

The provider accepts a `classNames` prop for granular customization per widget slot:

```tsx
<FeedbackProvider
  apiKey="proj_xxx"
  classNames={{
    button: "bg-blue-500 rounded-full",
    popover: "shadow-lg border",
    textarea: "font-mono",
    pin: "bg-red-500",
    overlay: "opacity-20",
    successState: "text-green-600",
  }}
>
```

Host developers can pass their own CSS classes (including Tailwind utility classes from the host app) to customize any part of the widget. The widget's default styles serve as the base; custom classes override or extend them.

### Dashboard-Controlled Theming

- `WidgetConfig.color`: primary/brand color (default: `#6366f1`)
- `WidgetConfig.position`: floating button position (`bottom-right`, `bottom-left`, `top-right`, `top-left`)
- These are fetched on mount and applied automatically

### No Shadow DOM

Widget uses scoped CSS classes instead of Shadow DOM. This allows host developers to intentionally override styles with their own classes while keeping unintentional conflicts unlikely via the `ff-` prefix.

---

## API Endpoints

All endpoints are Next.js API routes under `/api/v1/`. URL path versioning — when breaking changes are needed, a `/api/v2/` is created.

### Authentication

- **API key**: sent in `X-API-Key` header on every request
- **Origin check**: server validates `Origin` or `Referer` header against `Project.url`
- **Reviewer token**: sent in `X-Reviewer-Token` header (required for write operations and fetching feedback)

### Rate Limiting

Per API key, generous limits:
- Submissions: 100/hour
- Reads: 1000/hour

### Endpoints

#### `GET /api/v1/widget/config`

Fetch project widget settings.

**Auth**: API key only (no reviewer token needed)

**Response**:
```json
{
  "enabled": true,
  "color": "#6366f1",
  "position": "bottom-right"
}
```

#### `GET /api/v1/feedback?url={pageUrl}`

Fetch existing feedback for a specific page URL.

**Auth**: API key + reviewer token

**Query params**:
- `url` (required): the page URL to filter feedback by

**Response**:
```json
{
  "feedback": [
    {
      "id": "uuid",
      "status": "new",
      "comment": "This button is misaligned",
      "pageUrl": "https://site.com/dashboard",
      "clickX": 450.5,
      "clickY": 200.3,
      "selector": "main > div:nth-child(2) > button",
      "screenshotUrl": "https://...",
      "reviewer": { "id": "uuid", "name": "Alice" },
      "createdAt": "2026-03-19T..."
    }
  ]
}
```

#### `POST /api/v1/feedback`

Submit new feedback.

**Auth**: API key + reviewer token + origin check

**Content-Type**: `multipart/form-data`

**Fields**:
- `screenshot` (file, optional): viewport screenshot blob, max 5MB
- `data` (JSON string): feedback metadata

```json
{
  "comment": "This button is misaligned",
  "pageUrl": "https://site.com/dashboard",
  "selector": "main > div:nth-child(2) > button",
  "clickX": 450.5,
  "clickY": 200.3,
  "browserName": "Chrome",
  "browserVersion": "124.0",
  "os": "macOS",
  "viewportWidth": 1440,
  "viewportHeight": 900
}
```

**Screenshot handling**: server uploads the blob to storage (S3/R2), creates an `Asset` record, stores the file key (not the full URL) for storage flexibility, and links it to the feedback via `screenshotId`.

**Response**: `201` with the created feedback object.

#### `PUT /api/v1/feedback/:id`

Edit feedback comment.

**Auth**: API key + reviewer token

**Body**:
```json
{
  "comment": "Updated comment text"
}
```

Only the `comment` field can be updated. All other fields are immutable after creation.

#### `DELETE /api/v1/feedback/:id`

Delete a feedback item.

**Auth**: API key + reviewer token

**Response**: `204 No Content`

---

## Schema Changes

### WidgetConfig — Add `enabled` field

```prisma
model WidgetConfig {
    // ... existing fields ...
    enabled  Boolean @default(true)  // NEW
}
```

This is the only schema change required. All other fields needed for feedback (selector, clickX, clickY, browser metadata, viewport, screenshotId, pageUrl) already exist on the Feedback model.

---

## Technical Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Screenshot library | html2canvas (bundled) | Most popular, well-tested. ~40KB gzipped. |
| Screenshot timing | On element click (async) | Captures page before popover appears. Popover opens immediately for fast UX. |
| Screenshot scope | Visible viewport only | Fastest, lowest payload. Shows exactly what the user sees. |
| Selector strategy | Best-effort unique CSS path | No host page cooperation needed. May break on DOM changes but good enough. |
| Popover positioning | Floating UI (smart auto-position) | Handles viewport edge cases, flips as needed. |
| CSS isolation | Scoped `ff-` prefixed classes | Simpler than Shadow DOM, allows intentional host overrides. |
| Pin positioning | Static after render | Lighter than tracking on scroll/resize. Uses selector + absolute coords fallback. |
| Screenshot upload | Server-side (multipart) | Simpler widget code. Server handles storage upload internally. |
| Screenshot storage | File key only (not full URL) | Flexible — storage provider can change without updating records. |
| Error handling | Show error + retry button | Preserves form state. User doesn't lose their comment on failure. |

---

## Provider Props

```tsx
interface FeedbackProviderProps {
  apiKey: string;
  apiOrigin?: string; // default: "https://app.fasterfixes.com" — override for self-hosted deployments
  classNames?: {
    button?: string;
    popover?: string;
    textarea?: string;
    pin?: string;
    overlay?: string;
    successState?: string;
    errorState?: string;
    feedbackList?: string;
    feedbackListItem?: string;
  };
  labels?: {
    submitButton?: string;       // default: "Submit"
    cancelButton?: string;       // default: "Cancel"
    textareaPlaceholder?: string; // default: "Describe the issue..."
    successMessage?: string;     // default: "Feedback sent"
    closeButton?: string;        // default: "Close"
    retryButton?: string;        // default: "Retry"
    errorMessage?: string;       // default: "Something went wrong"
    deleteConfirm?: string;      // default: "Delete this feedback?"
    deleteButton?: string;       // default: "Delete"
    editButton?: string;         // default: "Edit"
    saveButton?: string;         // default: "Save"
    showResolved?: string;       // default: "Show resolved"
    hideResolved?: string;       // default: "Hide resolved"
    feedbackListTitle?: string;  // default: "Feedback"
    emptyList?: string;          // default: "No feedback on this page"
  };
  children: React.ReactNode;
}
```

All widget text defaults to English. Pass a `labels` object to override any string — for translations or custom wording.

---

## Programmatic API

The `widget-react` package exports a `useFeedback` hook for programmatic control from any component inside the provider:

```tsx
import { useFeedback } from "@faster-fixes/widget-react";

function MyComponent() {
  const { show, hide, isVisible } = useFeedback();

  return (
    <button onClick={() => (isVisible ? hide() : show())}>
      Toggle feedback widget
    </button>
  );
}
```

### `useFeedback()` return value

| Method / Property | Type | Description |
|---|---|---|
| `show()` | `() => void` | Show the widget (floating button + pins). No-op if already visible. |
| `hide()` | `() => void` | Hide the widget entirely (button + pins + any open popover). Exits annotation mode if active. |
| `isVisible` | `boolean` | Whether the widget is currently visible. |

This allows developers to conditionally show the widget on specific pages, behind feature flags, or in response to user actions — without unmounting the provider.

---

## Scope

This milestone delivers the **full widget experience**:

- Collapsible feedback list panel above the floating button
- Annotation mode with hover highlighting and element selection
- Comment submission with async screenshot capture
- Existing feedback rendered as status-colored icon pins
- Show/hide resolved feedback toggle
- Edit comment and delete feedback from pin popovers
- Dashboard-controlled settings (color, position, enabled)
- Custom class overrides via `classNames` prop
- Customizable text/translations via `labels` prop (English defaults)
- Public REST API with API key + reviewer token + origin validation
- Rate limiting (per API key)

---

## Done When

A reviewer can:
1. Visit a page with `?ff_token=xxx`
2. Click the floating button to enter annotation mode
3. Hover over elements (outline + overlay feedback)
4. Click an element to select it
5. Type a comment in the popover
6. Submit — screenshot captured, metadata collected, feedback stored
7. See a success state, close it, see a pin remain
8. View existing feedback as pins on the page
9. Click a pin to view, edit the comment, or delete the feedback
10. All data lands in the database with full context (screenshot, selector, coordinates, browser, viewport, page URL)
