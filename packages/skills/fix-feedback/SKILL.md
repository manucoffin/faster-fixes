---
name: fix-feedback
description: Fix client feedback collected by Faster Fixes. Use this skill whenever the user wants to check for new feedback, process client bug reports, fix issues reported through Faster Fixes, triage website feedback, or says anything like "fix feedback", "check feedback", "any new feedback", "process client reports", "what did clients report", "fix the bugs clients found". Also use when the user mentions Faster Fixes in the context of resolving issues. Requires the Faster Fixes MCP server to be configured.
---

# Fix Feedback

Process and fix client feedback collected by the Faster Fixes widget. This skill orchestrates the full workflow: fetch pending feedback, understand each issue, locate the relevant code, apply fixes, and mark feedback as resolved.

## Prerequisites

The Faster Fixes MCP server (`@fasterfixes/mcp`) must be configured with valid `FASTER_FIXES_TOKEN` and `FASTER_FIXES_PROJECT` environment variables. If the MCP tools (`list_feedbacks`, `update_feedback_status`) are not available, tell the user to set up the MCP server first and link them to https://faster-fixes.com/docs.

## Workflow

### Step 1: Fetch pending feedback

Call the `list_feedbacks` MCP tool with `status: "new"` and `format: "markdown"`.

If there are no new feedbacks, inform the user and stop.

### Step 2: Process each feedback item

For each feedback item, follow this sequence:

1. **Mark as in progress** — Call `update_feedback_status` with `status: "in_progress"` so other team members know it's being handled.

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
- Any feedbacks that could not be resolved, and why

## Handling ambiguous feedback

Client comments are often vague ("this looks weird", "broken on mobile", "the button doesn't work"). Use the screenshot and captured context to infer the actual issue before touching code. If the intent truly cannot be determined, skip that item, leave its status unchanged, and flag it in the summary — don't guess.

## Processing order

Handle feedbacks one at a time, sequentially. Apply each fix and verify it doesn't break related functionality before moving to the next item. Don't batch unrelated fixes into a single change.
