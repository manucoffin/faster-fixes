# Milestone 3 — Developer Dashboard (Feedback Inbox)

## Overview

Build a Kanban-based feedback inbox within the project dashboard where developers can see, triage, and manage all feedback submitted by reviewers via the widget. The inbox provides visual status management, assignment to org members, and bulk actions — giving teams full control over their feedback workflow.

---

## Architecture

### Schema Changes

Add one field to the `Feedback` model:

```prisma
model Feedback {
  // ... existing fields ...
  assigneeId String?
  assignee   Member? @relation(fields: [assigneeId], references: [id], onDelete: SetNull)
}
```

- `assigneeId` is optional (nullable). Feedback starts unassigned.
- References `Member` (not `User`) — assignment is scoped to the organization.
- `onDelete: SetNull` — if the member is removed from the org, assignment clears gracefully.
- No `category` field. Categories are deferred to a future milestone.

### Data Source

New tRPC procedures under the existing `projets` router (note: existing router name is `projets`). All procedures use session auth with org membership checks.

**Do not** reuse the v1 REST endpoints — those are for the widget (API key + reviewer token auth). The dashboard uses tRPC with session auth.

---

## Main View: Kanban Board

The Kanban board replaces the current "Inbox" placeholder tab on the project page.

### Layout

Three status columns displayed side by side:

| New | In Progress | Resolved |
|-----|-------------|----------|

- `closed` items are **not** shown on the board — they go to a separate Archive view (see below).
- Each column header shows the column name and an item count badge: `New (12)`.
- A total feedback count is shown above the board.
- Filters (page URL) are displayed above the board columns.

### Cards

Each card displays:

- **Comment**: Truncated to 2–3 lines.
- **Page URL**: Displayed as hostname + path (e.g. `example.com/pricing`).
- **Assignee**: Avatar or "Unassigned" placeholder.
- **Reviewer**: Name of the reviewer who submitted the feedback.
- **Date**: Relative timestamp (e.g. "2h ago").

### Drag-and-Drop

- Cards are draggable between columns to change status.
- Library: **@dnd-kit** (accessible, performant, well-maintained).
- **Optimistic updates**: Card moves instantly on drop. If the server call fails, the card snaps back to its original column and an error toast is displayed.
- Status transitions are **free-form** — any status can transition to any other status (e.g. `new` → `resolved` directly).

### Sorting Within Columns

User-selectable sort order per column (or globally) via a dropdown:

- **Newest first** (default)
- **Oldest first**
- **Recently updated**

### Filtering

- **Page URL filter**: Searchable combobox populated with all distinct page URLs that have feedback in the project. User can type to search/filter the list, or select from the dropdown.
- All filter state is persisted in URL query parameters via **nuqs**, making filtered views shareable and bookmarkable.

### Data Fetching

- Load **all** feedback for the project in a single tRPC query (no server-side pagination for the board).
- Client-side filtering and grouping by status.
- Suitable for early-stage volume (<500 items). Pagination can be added later if needed.

---

## Detail Side Panel

Clicking a card opens a sliding panel on the right side. The Kanban board remains visible behind/beside the panel for quick navigation between items.

### Panel Content

From top to bottom:

1. **Page URL**: Prominent clickable link that opens the page in a new tab (external link icon).

2. **Comment**: Read-only. Displays the full reviewer comment. No editing, no internal notes field.

3. **Screenshot**: Displayed as a simple image (no pin overlay, no click coordinate visualization). Click coordinates and CSS selector shown as text metadata below the image. If no screenshot was captured, show an appropriate empty state.

4. **Browser Metadata**: Compact one-liner format:
   `Chrome 120 · macOS · 1440×900`
   Composed from `browserName`, `browserVersion`, `os`, `viewportWidth × viewportHeight`.

5. **Status**: Dropdown selector. Free-form transitions — any status to any status. Changing status here moves the card on the board.

6. **Assignee**: Dropdown of all org members for this project's organization.
   - Shows "Unassigned" when no assignee is set.
   - **"Assign to me"** shortcut button next to the dropdown for quick self-assignment.
   - Unassigning is also possible (set back to "Unassigned").

7. **Timestamps**:
   - "Submitted by [reviewer name] on [absolute date]" — creation metadata.
   - "Last updated [relative time]" — reflects the most recent status or assignment change (`updatedAt`).

### Panel Behavior

- Opens on card click with a slide-in animation from the right.
- Closable via close button or clicking outside the panel.
- URL updates to include the selected feedback ID (e.g. `?feedbackId=abc123`) so the panel state is shareable/restorable.

---

## Per-Column Bulk Actions

Each column header includes a **select-all checkbox** for that column.

When items are selected, a bulk action toolbar appears with the following options:

- **Move to [status]**: Move selected cards to any other status column. Available targets are the other two visible columns plus "Archive" (closed).
- **Archive**: Move selected cards to closed status (soft delete). Cards disappear from the board and appear in the Archive view.

Bulk actions trigger a single tRPC mutation that updates all selected items.

---

## Archive View

Closed feedback is accessible via a separate tab or toggle adjacent to the Kanban board (e.g. a "Board / Archive" tab pair or a button).

### Archive Table

Uses the existing **DataTable** component (`app/_features/core/datatable/`).

**Columns:**

| Comment | Page URL | Reviewer | Assignee | Closed Date | Actions |
|---------|----------|----------|----------|-------------|---------|

- Server-side pagination via the DataTable's `pageCount`/`currentPage` props.
- Search input to filter by comment text.
- Sorting by closed date.

### Hard Delete

- Available **only** for closed/archived feedback items (from the archive table's actions column).
- Requires a **confirmation dialog** before execution.
- Hard delete removes:
  - The `Feedback` database record.
  - The associated `Asset` record (if a screenshot exists).
  - The screenshot file from R2 storage.
- Bulk hard delete is also available via the DataTable's row selection.

---

## Permissions

All organization roles (**owner**, **admin**, **member**) have **equal permissions** for feedback management:

- View all feedback
- Change status (drag-and-drop or side panel)
- Assign/unassign feedback
- Perform bulk actions
- Hard delete archived feedback

No role-based restrictions on feedback operations in this milestone.

---

## Notifications

**None** in this milestone. Assignment is purely informational — visible in the UI but does not trigger emails or in-app notifications. Notifications will be addressed in a future milestone.

---

## tRPC Procedures

All procedures live under the `projets` router namespace. All require session auth + org membership verification.

### Queries

**`feedback.list`**
- Input: `{ projectId: string }`
- Returns: All feedback for the project (all statuses) with relations: `reviewer` (name), `assignee` (member with user name/image), `screenshot` (asset URL).
- Used by: Kanban board (client-side groups by status).

**`feedback.listArchived`**
- Input: `{ projectId: string, page: number, pageSize: number, search?: string, sortBy?: string, sortOrder?: "asc" | "desc" }`
- Returns: Paginated closed feedback with total count.
- Used by: Archive DataTable.

**`feedback.distinctPageUrls`**
- Input: `{ projectId: string }`
- Returns: Array of distinct page URLs that have feedback in the project.
- Used by: Page URL filter combobox.

### Mutations

**`feedback.updateStatus`**
- Input: `{ feedbackId: string, status: FeedbackStatus }`
- Used by: Drag-and-drop, side panel status dropdown.

**`feedback.updateAssignee`**
- Input: `{ feedbackId: string, assigneeId: string | null }`
- Used by: Side panel assignee dropdown.

**`feedback.bulkUpdateStatus`**
- Input: `{ feedbackIds: string[], status: FeedbackStatus }`
- Used by: Per-column bulk actions (move to status, archive).

**`feedback.hardDelete`**
- Input: `{ feedbackId: string }`
- Deletes the feedback record, associated Asset record, and screenshot from R2 storage.
- Used by: Archive table actions.

**`feedback.bulkHardDelete`**
- Input: `{ feedbackIds: string[] }`
- Same as `hardDelete` but for multiple items.
- Used by: Archive table bulk actions.

---

## UI Components

### New Files (expected)

```
apps/web/src/app/(authenticated)/projects/[projectId]/
  _features/
    inbox/
      inbox-tab.client.tsx            ← Main Kanban board container
      kanban-board.client.tsx          ← Board with 3 columns + DnD context
      kanban-column.client.tsx         ← Single column with header, count, select-all
      kanban-card.client.tsx           ← Individual feedback card
      feedback-detail-panel.client.tsx ← Side panel with full feedback detail
      feedback-filters.client.tsx      ← Page URL combobox + sort selector
      bulk-action-toolbar.client.tsx   ← Toolbar shown when items selected
    archive/
      archive-tab.client.tsx           ← Archive table container
      archive-table.client.tsx         ← DataTable for closed feedback
      hard-delete-dialog.client.tsx    ← Confirmation dialog for hard delete
```

### tRPC Procedure Files

```
apps/web/src/app/(authenticated)/projects/[projectId]/
  _features/
    inbox/
      get-feedback.trpc.query.ts
      get-distinct-page-urls.trpc.query.ts
      update-feedback-status.trpc.mutation.ts
      update-feedback-assignee.trpc.mutation.ts
      bulk-update-feedback-status.trpc.mutation.ts
    archive/
      get-archived-feedback.trpc.query.ts
      hard-delete-feedback.trpc.mutation.ts
      bulk-hard-delete-feedback.trpc.mutation.ts
```

### Schemas

```
apps/web/src/app/(authenticated)/projects/[projectId]/
  _features/
    inbox/
      feedback-filters.schema.ts      ← Filter/sort schema
      update-feedback-status.schema.ts
      update-feedback-assignee.schema.ts
    archive/
      hard-delete-feedback.schema.ts
```

---

## Dependencies

| Package | Purpose |
|---------|---------|
| `@dnd-kit/core` | Drag-and-drop primitives |
| `@dnd-kit/sortable` | Sortable lists within columns |
| `@dnd-kit/utilities` | DnD utility hooks |

Install in `apps/web` only.

---

## Done When

- [ ] A developer can open a project and see all non-closed feedback on a Kanban board with 3 columns (New, In Progress, Resolved).
- [ ] Cards show comment preview, page URL, assignee, reviewer, and date.
- [ ] Cards can be dragged between columns to change status (optimistic update).
- [ ] Clicking a card opens a side panel with full feedback detail: screenshot, comment, page URL link, browser metadata, status selector, assignee selector, and timestamps.
- [ ] Page URL filter (searchable combobox) filters the board. Filter state is in the URL.
- [ ] Per-column select-all and bulk actions (move to any status, archive).
- [ ] Archive tab shows closed feedback in a paginated DataTable.
- [ ] Hard delete available for archived items (with confirmation), removes DB record + R2 screenshot.
- [ ] Assignment dropdown lists org members, includes "Assign to me" shortcut.
- [ ] All org roles have equal permissions.
- [ ] `pnpm typecheck`, `pnpm lint`, and `pnpm lint:agent-rules` pass.
