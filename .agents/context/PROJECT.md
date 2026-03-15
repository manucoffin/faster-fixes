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
   - Timestamp
3. **A developer dashboard** where feedback is collected and organized.

The key idea is to transform:

> **messy client feedback → clear developer tasks**

## AI Integration

A core feature of the system is the ability to **convert raw client comments into structured tasks** using AI.

The AI layer can:

- Summarize feedback
- Clarify vague comments
- Categorize issues (bug, UI tweak, content change, etc.)
- Generate developer-friendly tasks
- Produce structured output that can be used by coding agents

This allows feedback to become **agent-ready instructions**.

## Developer Workflow

The product is designed for **developer-first workflows**.

Typical usage:

1. A client leaves feedback directly on the website.
2. The system captures the context.
3. The feedback is transformed into a structured task.
4. Developers can:
   - copy it as Markdown
   - send it to their issue tracker
   - expose it via API or webhook
   - allow AI coding agents to process it.

The goal is to reduce the gap between:

> **client comment → developer action**

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
- **Clear workflows**
- **Automation-ready**

It should feel closer to a **developer tool** than a heavy project management system.

## Long-Term Vision

In the long term, the system should become a **bridge between client feedback and autonomous development tools**, enabling workflows such as:

client feedback → structured task → AI coding agent → code fix → pull request
