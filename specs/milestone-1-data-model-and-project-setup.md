# Milestone 1 — Data Model & Project Setup

## Objective

Define the core domain models and let authenticated users create projects, manage share links for client reviewers, and expose a public API endpoint for feedback submission.

---

## 1. Data Models (Prisma)

### 1.1 Project

| Field              | Type     | Notes                                              |
| ------------------ | -------- | -------------------------------------------------- |
| id                 | String   | UUID, primary key                                  |
| createdAt          | DateTime | Auto                                               |
| updatedAt          | DateTime | Auto                                               |
| name               | String   | Display name (e.g. "Client XYZ Website")           |
| url                | String   | Single URL for the project (e.g. https://client.com) |
| apiKey             | String   | Unique, generated at creation. Used by widget to submit feedback. Hashed in DB. |
| organizationId     | String   | FK to Organization                                 |

- **One URL per project.** Separate projects for staging vs production.
- **One API key per project.** Shown in full only at creation time. Masked (last 4 chars) in settings afterward. Regeneration creates a new key and invalidates the old one.
- **Plan-based limits:** Basic plan = 1 project, Premium = unlimited. Enforced at creation time.
- **Deletion:** Hard delete. Cascades to all related records (WidgetConfig, Reviewer, Feedback, FeedbackAttachment).

Relations: `Organization`, `WidgetConfig` (1:1), `Reviewer[]`, `Feedback[]`

### 1.2 WidgetConfig

| Field          | Type    | Notes                                    |
| -------------- | ------- | ---------------------------------------- |
| id             | String  | UUID, primary key                        |
| createdAt      | DateTime | Auto                                    |
| updatedAt      | DateTime | Auto                                    |
| projectId      | String  | FK to Project, unique (1:1)              |
| color          | String  | Hex color for widget button (default: brand color) |
| position       | String  | Enum-like: `bottom-right` or `bottom-left` (default: `bottom-right`) |

Separate model to keep Project lean and allow future expansion of widget settings without migrations on the Project table.

### 1.3 Reviewer

Represents a client reviewer invited to leave feedback on a project.

| Field          | Type     | Notes                                    |
| -------------- | -------- | ---------------------------------------- |
| id             | String   | UUID, primary key                        |
| createdAt      | DateTime | Auto                                     |
| updatedAt      | DateTime | Auto                                     |
| projectId      | String   | FK to Project                            |
| name           | String   | Display name set by the developer (e.g. "Marie - CEO") |
| token          | String   | Unique, generated at creation. Used in share URLs. |
| isActive       | Boolean  | Default true. Can be revoked by the developer. |

- **One token per reviewer, reusable.** The token identifies a specific person. They can submit unlimited feedback.
- **No expiry.** Token is valid until manually revoked (`isActive = false`).
- **Share URL format:** `{project.url}?ff_token={reviewer.token}`. Direct link to the client's site. Widget reads the token from the URL query param and stores it in localStorage.
- **All reviewers see all pins.** Feedback pins from all reviewers are visible on the website. Resolved feedback pins are hidden.

Relations: `Project`, `Feedback[]`

### 1.4 Feedback

| Field            | Type     | Notes                                     |
| ---------------- | -------- | ----------------------------------------- |
| id               | String   | UUID, primary key                         |
| createdAt        | DateTime | Auto                                      |
| updatedAt        | DateTime | Auto                                      |
| projectId        | String   | FK to Project                             |
| reviewerId       | String   | FK to Reviewer (who submitted it)         |
| status           | String   | `new` or `resolved` (default: `new`)      |
| comment          | String   | The feedback text from the reviewer       |
| pageUrl          | String   | Full URL of the page where feedback was left |
| clickX           | Float?   | X coordinate of the click (relative to page) |
| clickY           | Float?   | Y coordinate of the click (relative to page) |
| selector         | String?  | CSS selector of the clicked element       |
| browserName      | String?  | e.g. "Chrome"                             |
| browserVersion   | String?  | e.g. "120.0"                              |
| os               | String?  | e.g. "macOS 14.2"                         |
| viewportWidth    | Int?     | Browser viewport width in px              |
| viewportHeight   | Int?     | Browser viewport height in px             |
| metadata         | Json?    | Overflow JSON for any extra context       |
| screenshotId     | String?  | FK to Asset (reuse existing Asset model)  |

- **Statuses:** Simple two-state: `new` → `resolved`. No categories or priority in M1 (deferred to M4 AI milestone).
- **Screenshot:** Stored using the existing `Asset` model and S3 upload infrastructure. The `screenshotId` links to the Asset record.
- **Coordinates + CSS selector:** Stored for element-level precision. Selector helps developers locate the exact element in code.
- **Structured metadata fields** (browser, OS, viewport) for key info + a `metadata` JSON field for anything extra the widget captures.

Relations: `Project`, `Reviewer`, `Asset` (screenshot)

---

## 2. Project CRUD (Dashboard)

### 2.1 Navigation

Projects appear as a **sidebar nav item** in the organization-level navigation, alongside existing items (settings, members, billing).

### 2.2 Project List Page

- List of all projects for the current organization
- Each row: project name, URL, feedback count (simple counter), created date
- "Create project" button

### 2.3 Create Project

- **Simple form:** name + URL
- On creation: generate API key + create default WidgetConfig
- After creation: display the API key in full **once** (modal or inline alert) with copy button and a warning that it won't be shown again
- Enforce plan-based limit: if Basic plan and already at 1 project, block creation with upgrade prompt

### 2.4 Project Page

- **Empty state for now.** Feedback inbox will be built in M3.
- Tabs or sections for: Overview (empty/placeholder), Settings, Reviewers

### 2.5 Project Settings

- Edit name, URL
- Widget config: color picker, position selector (bottom-left / bottom-right)
- API key: masked display (last 4 chars), regenerate button with confirmation dialog
- Delete project: requires confirmation, hard deletes everything

### 2.6 Reviewer Management (Share Links)

Accessible from the project page.

- **List of reviewers:** name, token (masked), active/revoked status, share URL (copy button), feedback count
- **Create reviewer:** form with just a name field. Generates token and displays the full share URL to copy.
- **Revoke reviewer:** toggle `isActive` to false. Revoked reviewers cannot submit new feedback. Their existing feedback and pins remain.
- **No edit.** If the name is wrong, revoke and create a new one.

---

## 3. Public API Endpoint

### 3.1 POST `/api/feedback`

Public endpoint called by the widget (and testable with curl/Postman in M1).

**Authentication:** API key in `Authorization: Bearer {apiKey}` header. Validates against the Project's hashed API key.

**Request body:**

```json
{
  "reviewerToken": "abc123",
  "comment": "This button is misaligned",
  "pageUrl": "https://client.com/dashboard",
  "clickX": 450.5,
  "clickY": 320.0,
  "selector": "#main-content > div.card > button.submit",
  "browserName": "Chrome",
  "browserVersion": "120.0",
  "os": "macOS 14.2",
  "viewportWidth": 1440,
  "viewportHeight": 900,
  "metadata": {},
  "screenshot": "<base64 or multipart>"
}
```

**Validation:**
- API key must match an active project
- `reviewerToken` must match an active reviewer for that project
- `comment` is required, non-empty
- `pageUrl` is required
- Screenshot is optional

**Rate limiting:** Per reviewer token. E.g. 10 submissions per minute per token. Returns 429 on limit.

**Response:** `201 Created` with the feedback ID, or appropriate error codes (401, 403, 404, 422, 429).

**Screenshot handling:** If a screenshot is included, upload it to S3 via the existing Asset system and link it to the Feedback record.

### 3.2 GET `/api/feedback`

Public endpoint for the widget to fetch existing feedback pins (for display on the client's website).

**Authentication:** Same API key in header.

**Query params:**
- `reviewerToken` (required) — validates the reviewer is active
- `pageUrl` (optional) — filter to current page only
- `status` (optional) — defaults to `new` only (resolved feedback is hidden from pins)

**Response:** Array of feedback items with: id, comment, clickX, clickY, selector, status, reviewer name, createdAt. No screenshot data in this endpoint (not needed for pin display).

---

## 4. Scope Boundaries

### In scope for M1
- Prisma models: Project, WidgetConfig, Reviewer, Feedback (+ reuse Asset)
- Project CRUD in dashboard (list, create, settings, delete)
- Reviewer/share link management in dashboard
- Widget config (color + position) in project settings
- API key generation, masking, regeneration
- Plan-based project limit enforcement
- Public POST `/api/feedback` endpoint
- Public GET `/api/feedback` endpoint (for pin retrieval)
- Rate limiting on feedback submission (per reviewer token)

### Out of scope for M1 (deferred)
- The actual widget (M2)
- Feedback inbox/dashboard (M3)
- AI categorization, priority, task generation (M4)
- Integrations, webhooks, exports (M5)
- Email notifications
- Feedback assignment to org members
- Bulk actions on feedback
