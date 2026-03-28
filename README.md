<p align="center">
  <h1 align="center">/fasterfixes</h1>
</p>

<p align="center">
  Turn messy client feedback into agent-ready bug reports.
</p>

<p align="center">
  <a href="https://faster-fixes.com">Website</a>
  &nbsp;&bull;&nbsp;
  <a href="https://faster-fixes.com/docs">Docs</a>
  &nbsp;&bull;&nbsp;
  <a href="https://x.com/manucoffin">Twitter</a>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@fasterfixes/react"><img src="https://img.shields.io/npm/v/@fasterfixes/react?label=%40fasterfixes%2Freact&color=0a0a0a" alt="@fasterfixes/react on npm" /></a>
  &nbsp;
  <a href="https://www.npmjs.com/package/@fasterfixes/mcp"><img src="https://img.shields.io/npm/v/@fasterfixes/mcp?label=%40fasterfixes%2Fmcp&color=0a0a0a" alt="@fasterfixes/mcp on npm" /></a>
  &nbsp;
  <a href="https://github.com/manucoffin/faster-fixes/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-AGPLv3-0a0a0a" alt="License" /></a>
</p>

---

## About

During the review phase of a web project, clients send feedback through WhatsApp messages, scattered screenshots, and vague descriptions with no link to the page. Developers then spend time deciphering what was meant, finding the right page, and turning it into something actionable.

Faster Fixes replaces that workflow. Clients leave feedback directly on the website through a lightweight widget. The system captures the full context automatically — screenshot, page URL, DOM selector, browser metadata, and React component tree when available. Developers consume that feedback from a dashboard or directly from their AI coding agent via MCP.

The goal is a short path from client comment to resolved fix:

> **client feedback &rarr; structured context &rarr; AI agent fixes it**

## How It Works

### 1. Collect feedback with the widget

Install the React widget in your application. Clients click anywhere on the page to leave feedback. The widget captures the screenshot, element selector, component tree, and browser info automatically — no setup required from the client.

```tsx
import { FeedbackProvider } from "@fasterfixes/react";

function App() {
  return (
    <FeedbackProvider apiKey="your-project-api-key">
      <YourApp />
    </FeedbackProvider>
  );
}
```

### 2. Review feedback on the dashboard

Open the Faster Fixes dashboard to see all feedback items organized by project and page. Each item includes the client's comment alongside the captured context. Copy any item as a structured markdown report, ready to paste into your AI coding agent.

### 3. Or let your agent handle it via MCP

Connect the Faster Fixes MCP server to your editor. Your AI coding agent can fetch new feedback, read the full context, locate the relevant code, fix the issue, and mark it as resolved — without leaving the terminal.

```bash
claude mcp add faster-fixes \
  --env FASTER_FIXES_TOKEN=ff_agent_xxx \
  --env FASTER_FIXES_PROJECT=proj_xxx \
  -- npx -y @fasterfixes/mcp
```

The MCP server works with Claude Code, Cursor, VS Code, Windsurf, Codex, and Zed.

## Features

- **Visual feedback widget** — clients click on elements to leave feedback, no training needed
- **Automatic context capture** — screenshot, page URL, DOM selector, component tree, browser info
- **Developer dashboard** — organized view of all feedback across projects
- **Markdown export** — copy any feedback item as a structured bug report for AI agents
- **MCP server** — AI coding agents fetch and resolve feedback programmatically
- **Agent skill** — install as a skill for autonomous feedback-to-fix workflows
- **GitHub integration** — automatically create issues from feedback items
- **Team collaboration** — organizations, projects, and role-based access
- **Review links** — share a link with clients so they can leave feedback without an account

## Packages

This monorepo publishes three npm packages:

| Package                                                                  | Description                       | Install                          |
| ------------------------------------------------------------------------ | --------------------------------- | -------------------------------- |
| [`@fasterfixes/react`](https://www.npmjs.com/package/@fasterfixes/react) | React feedback widget             | `npm install @fasterfixes/react` |
| [`@fasterfixes/core`](https://www.npmjs.com/package/@fasterfixes/core)   | Framework-agnostic client library | `npm install @fasterfixes/core`  |
| [`@fasterfixes/mcp`](https://www.npmjs.com/package/@fasterfixes/mcp)     | MCP server for AI coding agents   | `npx -y @fasterfixes/mcp`        |

## MCP Setup

The MCP server exposes two tools: `list_feedbacks` and `update_feedback_status`. It connects to the Faster Fixes API using an organization-scoped agent token.

<details>
<summary><strong>Claude Code</strong></summary>

Add to your `.mcp.json`:

```json
{
  "mcpServers": {
    "faster-fixes": {
      "command": "npx",
      "args": ["-y", "@fasterfixes/mcp"],
      "env": {
        "FASTER_FIXES_TOKEN": "ff_agent_your_token_here",
        "FASTER_FIXES_PROJECT": "proj_your_project_id"
      }
    }
  }
}
```

</details>

<details>
<summary><strong>Cursor</strong></summary>

Add to `.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "faster-fixes": {
      "command": "npx",
      "args": ["-y", "@fasterfixes/mcp"],
      "env": {
        "FASTER_FIXES_TOKEN": "ff_agent_your_token_here",
        "FASTER_FIXES_PROJECT": "proj_your_project_id"
      }
    }
  }
}
```

</details>

<details>
<summary><strong>VS Code (GitHub Copilot)</strong></summary>

Add to `.vscode/mcp.json`:

```json
{
  "servers": {
    "faster-fixes": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@fasterfixes/mcp"],
      "env": {
        "FASTER_FIXES_TOKEN": "ff_agent_your_token_here",
        "FASTER_FIXES_PROJECT": "proj_your_project_id"
      }
    }
  }
}
```

</details>

<details>
<summary><strong>Windsurf</strong></summary>

Add to `~/.codeium/windsurf/mcp_config.json`:

```json
{
  "mcpServers": {
    "faster-fixes": {
      "command": "npx",
      "args": ["-y", "@fasterfixes/mcp"],
      "env": {
        "FASTER_FIXES_TOKEN": "ff_agent_your_token_here",
        "FASTER_FIXES_PROJECT": "proj_your_project_id"
      }
    }
  }
}
```

</details>

<details>
<summary><strong>Codex</strong></summary>

Add to `.codex/config.toml`:

```toml
[mcp_servers.faster-fixes]
command = "npx"
args = ["-y", "@fasterfixes/mcp"]

[mcp_servers.faster-fixes.env]
FASTER_FIXES_TOKEN = "ff_agent_your_token_here"
FASTER_FIXES_PROJECT = "proj_your_project_id"
```

</details>

<details>
<summary><strong>Zed</strong></summary>

Add to `~/.config/zed/settings.json`:

```json
{
  "context_servers": {
    "faster-fixes": {
      "command": "npx",
      "args": ["-y", "@fasterfixes/mcp"],
      "env": {
        "FASTER_FIXES_TOKEN": "ff_agent_your_token_here",
        "FASTER_FIXES_PROJECT": "proj_your_project_id"
      }
    }
  }
}
```

</details>

You can find your agent token and project ID in [Organization Settings](https://faster-fixes.com/docs) on the dashboard.

## Built With

- [Next.js](https://nextjs.org) — app framework
- [React](https://react.dev) — UI library
- [Prisma](https://prisma.io) — database ORM
- [tRPC](https://trpc.io) — type-safe API layer
- [Tailwind CSS](https://tailwindcss.com) — styling
- [Better Auth](https://better-auth.com) — authentication
- [Stripe](https://stripe.com) — billing
- [Inngest](https://inngest.com) — background jobs
- [Turborepo](https://turbo.build) — monorepo tooling

## License

This repository is licensed under the [GNU AGPLv3 License](./LICENSE).

The widget packages (`@fasterfixes/core`, `@fasterfixes/react`) and the MCP server (`@fasterfixes/mcp`) are licensed under MIT for unrestricted use in your applications.
