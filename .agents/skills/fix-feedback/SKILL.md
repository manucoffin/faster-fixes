---
name: fix-feedback
description: >
  Invoke when the user says "fix feedback", mentions Faster Fixes, or wants to check, triage, or fix issues that clients reported through a website feedback widget. This skill fetches client-submitted bug reports and comments from the Faster Fixes platform via MCP, then locates and fixes each reported issue in the codebase. Covers reviewing new client reports, triaging widget-collected feedback, fixing bugs clients found on the live site, processing comments left via an on-page widget. Does NOT cover code review comments, fixing feedback-form UI bugs, responding to product feedback, refactoring feedback components, or creating surveys.
---

# Fix Feedback

Process and fix client feedback collected by the Faster Fixes widget. This skill handles two modes: **listing** feedback (read-only) and **fixing** feedback (the full workflow). Read the user's intent to decide which mode to use.

## Prerequisites

The Faster Fixes MCP server (`@fasterfixes/mcp`) must be configured with valid `FASTER_FIXES_TOKEN` and `FASTER_FIXES_PROJECT` environment variables. If the MCP tools (`list_feedbacks`, `update_feedback_status`) are not available, tell the user to set up the MCP server first and link them to https://faster-fixes.com/docs.

## Deciding the mode

- If the user wants to **view, check, or triage** feedback without fixing ("show me what's there", "any new feedback?", "what did clients report", "don't fix anything yet") — use **List mode**.
- If the user wants to **fix, resolve, or process** feedback ("fix feedback", "fix the bugs", "resolve client issues") — use **Fix mode**.
- When in doubt, default to **Fix mode** — that's the primary value of this skill.

---

## List mode

Call `list_feedbacks` with `format: "markdown"`. Optionally filter by status — use `status: "new"` unless the user asks for something else (e.g., "what's in progress?" → `status: "in_progress"`).

Present the results to the user. Do not modify any code, do not call `update_feedback_status`, do not change any statuses. This is strictly read-only.

---

## Fix mode

### Step 1: Fetch pending feedback

Call `list_feedbacks` with `status: "new"` and `format: "markdown"`.

If there are no new feedbacks, inform the user and stop.

### Step 2: Process each feedback item

For each feedback item, follow this sequence:

1. **Mark as in progress** — Call `update_feedback_status` with `status: "in_progress"` so other team members know it's being handled. This is important for team coordination — don't skip it.

2. **Understand the issue** — Read the structured markdown report. Every report includes some combination of:
   - **Comment**: What the client described (may be vague — clients are non-technical)
   - **Page URL**: Where the issue was reported
   - **Component path**: The React component tree leading to the element
   - **Source file**: The mapped source file, when available
   - **CSS selector**: The DOM element the client clicked on
   - **Screenshot**: Visual context showing what the client saw
   - **Viewport and browser**: The client's environment (useful for responsive/compat issues)

3. **Locate the code** — Use the source file if provided. Otherwise, trace from the page URL to the route, then follow the component path to the relevant component. The CSS selector and screenshot help confirm you're looking at the right element.

4. **Fix the issue** — Apply the minimal, scoped fix that addresses the client's feedback. Don't refactor surrounding code or add unrelated improvements.

5. **Mark as resolved** — Call `update_feedback_status` with `status: "resolved"`.

### Step 3: Summarize

After processing all items, provide a brief summary:
- How many feedbacks were processed
- What was fixed for each one (one line per item)
- Any feedbacks that were skipped, and why

## When to skip a feedback item

Not every feedback can or should be fixed inline. Skip and leave the status unchanged when:

- **The intent is genuinely unclear** — vague comments like "this looks weird" with no screenshot context to help. Don't guess.
- **It's a large feature request** — things like "add animations", "redesign this section", or "build a new page" require design decisions and assets that can't be inferred from the feedback. Flag these for manual handling.
- **It requires external dependencies** — new packages, API integrations, or third-party services that aren't already in the project.

For skipped items, explain why in the summary so the user can triage them manually.

## Processing order

Handle feedbacks one at a time, sequentially. Apply each fix and verify it doesn't break related functionality before moving to the next item. Don't batch unrelated fixes into a single change.
