# Development Plan — Fastest Path to Production

## Current State

The SaaS foundation is fully built: authentication, billing/subscriptions, organization management, admin dashboard, CMS/blog, UI component library, and file uploads. What remains is the **core product**: the feedback widget, context capture, developer dashboard, and AI processing.

---

## Milestone 1 — Data Model & Project Setup

> Define the core domain and let users create projects.

- Add Prisma models: `Project`, `Feedback`, `FeedbackAttachment`
  - Project: name, URL, API key, linked to Organization
  - Feedback: comment, status, page URL, browser metadata, screenshot, coordinates, created by (client identifier), assigned to, priority, category
  - FeedbackAttachment: screenshot storage (linked to existing Asset system)
- Build project CRUD in the dashboard (create, list, settings, delete)
- Generate and manage per-project API keys (used by the widget to submit feedback)

**Done when:** A user can create a project, see it listed, and get an API key.

---

## Milestone 2 — Feedback Widget (JavaScript SDK)

> The client-facing widget that captures feedback directly on the website.

- Create a new `packages/widget` package (vanilla JS/TS, framework-agnostic, lightweight)
- Core features:
  - Floating button to activate feedback mode
  - Click-to-select element on the page
  - Comment input (text)
  - Automatic context capture: page URL, viewport size, browser/OS, timestamp, selected element selector
  - Client-side screenshot (html2canvas or similar)
  - Submit feedback to the API via the project API key
- Build the corresponding API route to receive widget submissions (public, authenticated by API key)
- Publishable as an npm package or loadable via `<script>` tag

**Done when:** A non-technical user can click a button on any website using the widget, select an area, type a comment, and the feedback lands in the database with full context.

---

## Milestone 3 — Developer Dashboard (Feedback Inbox)

> The place where developers see, triage, and manage feedback.

- Feedback list view per project: filterable by status, category, page URL
- Feedback detail view: screenshot, comment, metadata, page URL, browser info
- Status management: new → in progress → resolved → closed
- Basic assignment: assign feedback to an org member
- Bulk actions: mark as resolved, delete

**Done when:** A developer can open a project, see all feedback with full context, update statuses, and assign items.

---

## Milestone 4 — AI Task Generation

> Turn raw client feedback into structured, actionable developer tasks.

- AI processing endpoint (using an LLM): takes a feedback item (comment + screenshot + metadata) and produces a structured task
  - Summary
  - Category (bug, UI tweak, content change, feature request)
  - Priority suggestion
  - Reproduction steps (if applicable)
  - Developer-friendly description
- Trigger AI processing automatically on new feedback (via Inngest background job) or manually from the dashboard
- Display AI-generated task alongside the original feedback
- Copy task as Markdown

**Done when:** A piece of messy client feedback gets transformed into a clear, structured developer task with one click or automatically.

---

## Milestone 5 — Integrations & Export

> Let developers push tasks into their existing workflow tools.

- Webhook support: send feedback/task payloads to a configurable URL on creation or status change
- REST API: expose project feedback via authenticated API endpoints (for external tools and coding agents)
- Copy as Markdown (already partially covered in M4)
- Linear integration (first third-party integration — high value for ICP)

**Done when:** A developer can push a structured task to Linear or receive it via webhook in their own system.

---

## Milestone 6 — Polish, Security & Production Readiness

> Harden everything for real users.

- Widget: rate limiting, spam protection, size limits on screenshots
- API key management: revoke, rotate, scoped permissions
- Dashboard: notifications (in-app + email) when new feedback arrives
- Onboarding flow: guide new users through creating their first project and installing the widget
- Error handling & edge cases across all new features
- Basic E2E tests for critical paths (submit feedback → view in dashboard → generate task)
- Deploy: production environment, domain, monitoring

**Done when:** The product is live, stable, and a new user can go from signup to receiving their first feedback without help.

---

## Execution Order & Dependencies

```
M1 (Data Model) → M2 (Widget) → M3 (Dashboard) → M4 (AI) → M5 (Integrations) → M6 (Production)
                       ↓               ↓
                   Can demo to      Can demo full
                   early users      feedback loop
```

M1–M3 form the **minimum viable product**. A team could start using it at the end of M3.
M4 adds the core differentiator (AI task generation).
M5–M6 make it production-grade and workflow-integrated.
