# Project Overview

This project is a developer-focused tool designed to simplify the process of collecting and handling client feedback on web applications.

## Problem

During the **review / QA phase of a project**, clients often send feedback in messy ways:

- Long WhatsApp or Slack messages
- Multiple screenshots without context
- Bullet lists of issues
- Vague UI/UX comments
- No link to the exact page or element

Developers then have to:

1. Understand the feedback
2. Find the correct page
3. Reproduce the issue
4. Rephrase it as a technical task
5. Create a ticket
6. Implement the fix

This creates **friction, lost time, and mental overhead**.

## Solution

This application simplifies the workflow between **clients and developers**.

It provides:

1. **A website widget** that allows clients to click anywhere on the page and leave feedback.
2. **Automatic context capture**, including:
   - Screenshot
   - Page URL
   - Browser metadata
   - DOM selector and element description
   - React component tree (when available)
   - Timestamp
3. **A developer dashboard** where feedback is collected and organized.
4. **Agent-ready markdown export** — each feedback item can be copied as a structured markdown bug report, ready to paste into an AI coding agent like Claude Code.

The key idea is to transform:

> **messy client feedback → agent-ready bug report → AI-assisted fix**

## Developer Workflow

The product is designed for **developer-first workflows**.

Typical usage:

1. A client leaves feedback directly on the website via the widget.
2. The system captures the full context (screenshot, URL, selector, component tree, browser info).
3. The developer opens the dashboard and copies the feedback as structured markdown.
4. The developer pastes the markdown into an AI coding agent (e.g., Claude Code).
5. The agent locates the relevant code and fixes the issue.

The markdown export is the core feature. It formats feedback as a structured report with sections for location (URL, component path, source file, DOM selector), the user's comment, environment details, and a screenshot — everything an AI agent needs to understand and address the feedback without further context.

The goal is to reduce the gap between:

> **client comment → copy markdown → paste into AI agent → fix**

## Target Users

Primary users are:

- Freelance developers
- Small web agencies
- Teams building SaaS or web applications

Typical stack:

- React
- Next.js
- Node.js
- Vercel
- GitHub
- Linear / Jira / Notion

Their clients are usually **non-technical stakeholders**.

## Design Philosophy

The product follows these principles:

- **Developer-first**
- **Simple for non-technical clients**
- **Minimal friction**
- **Agent-ready output**
- **No AI magic in the product itself** — the AI is the developer's coding agent, not a feature of this tool

It should feel closer to a **developer tool** than a heavy project management system.

## Future Possibilities

In the future, the system could evolve to include:

- **AI-powered task transformation** — summarizing feedback, clarifying vague comments, categorizing issues (bug, UI tweak, content change)
- **Direct integrations** — pushing structured tasks to issue trackers (Linear, Jira) or triggering webhooks
- **Autonomous workflows** — end-to-end pipelines where feedback automatically triggers an AI coding agent to produce a fix and open a pull request

These features are not currently in scope but represent the long-term direction.
