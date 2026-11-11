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
  <a href="https://www.npmjs.com/package/@fasterfixes/widget"><img src="https://img.shields.io/npm/v/@fasterfixes/widget?label=%40fasterfixes%2Fwidget&color=0a0a0a" alt="@fasterfixes/widget on npm" /></a>
  &nbsp;
  <a href="https://www.npmjs.com/package/@fasterfixes/react"><img src="https://img.shields.io/npm/v/@fasterfixes/react?label=%40fasterfixes%2Freact&color=0a0a0a" alt="@fasterfixes/react on npm" /></a>
  &nbsp;
  <a href="https://www.npmjs.com/package/@fasterfixes/vue"><img src="https://img.shields.io/npm/v/@fasterfixes/vue?label=%40fasterfixes%2Fvue&color=0a0a0a" alt="@fasterfixes/vue on npm" /></a>
  &nbsp;
  <a href="https://www.npmjs.com/package/@fasterfixes/angular"><img src="https://img.shields.io/npm/v/@fasterfixes/angular?label=%40fasterfixes%2Fangular&color=0a0a0a" alt="@fasterfixes/angular on npm" /></a>
  &nbsp;
  <a href="https://www.npmjs.com/package/@fasterfixes/svelte"><img src="https://img.shields.io/npm/v/@fasterfixes/svelte?label=%40fasterfixes%2Fsvelte&color=0a0a0a" alt="@fasterfixes/svelte on npm" /></a>
  &nbsp;
  <a href="https://www.npmjs.com/package/@fasterfixes/mcp"><img src="https://img.shields.io/npm/v/@fasterfixes/mcp?label=%40fasterfixes%2Fmcp&color=0a0a0a" alt="@fasterfixes/mcp on npm" /></a>
  &nbsp;
  <a href="https://github.com/manucoffin/faster-fixes/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-AGPLv3-0a0a0a" alt="License" /></a>
</p>

---

## About

During the review phase of a web project, clients send feedback through WhatsApp messages, scattered screenshots, and vague descriptions with no link to the page. Developers then spend time deciphering what was meant, finding the right page, and turning it into something actionable.

Faster Fixes replaces that workflow. Clients leave feedback directly on the website through a lightweight widget. The system captures the full context automatically: screenshot, a Recording of the moments leading up to the feedback, page URL, DOM selector, browser metadata, and React component tree when available. Developers consume that feedback from a dashboard or directly from their AI coding agent via MCP.

The goal is a short path from client comment to resolved fix:

> **client feedback &rarr; structured context &rarr; AI agent fixes it**

## How It Works

### 1. Collect feedback with the widget

Add the widget to any website: WordPress, Webflow, static HTML, or an app built with any framework. Paste one tag, replacing the Project ID with your own:

```html
<script
  src="https://cdn.jsdelivr.net/npm/@fasterfixes/widget@1/dist/widget.iife.js"
  data-project-id="proj_your_project_id"
  defer
></script>
```

In a React application, use the React embed instead. It mounts the same widget:

```tsx
import { FeedbackProvider } from "@fasterfixes/react";

function App() {
  return (
    <FeedbackProvider projectId="proj_your_project_id">
      <YourApp />
    </FeedbackProvider>
  );
}
```

In a Vue or Nuxt application, use the Vue embed:

```ts
import { createFasterFixes } from "@fasterfixes/vue";

createApp(App)
  .use(createFasterFixes({ projectId: "proj_your_project_id" }))
  .mount("#app");
```

In an Angular or Analog application, use the Angular embed:

```ts
import { provideFasterFixes } from "@fasterfixes/angular";

export const appConfig: ApplicationConfig = {
  providers: [provideFasterFixes({ projectId: "proj_your_project_id" })],
};
```

In a Svelte or SvelteKit application, use the Svelte embed in the root component or layout:

```svelte
<script lang="ts">
  import { initFasterFixes } from "@fasterfixes/svelte";

  initFasterFixes({ projectId: "proj_your_project_id" });
</script>
```

Clients click anywhere on the page to leave feedback. The widget captures the screenshot, element selector, browser info, and the React component tree on React sites automatically, with no setup required from the client. See the [script embed](https://faster-fixes.com/docs/widget/install/script-embed), [React](https://faster-fixes.com/docs/widget/install/react), [Vue](https://faster-fixes.com/docs/widget/install/vue), [Angular](https://faster-fixes.com/docs/widget/install/angular) and [Svelte](https://faster-fixes.com/docs/widget/install/svelte) docs.

### 2. Review feedback on the dashboard

Open the Faster Fixes dashboard to see all feedback items organized by project and page. Each item includes the client's comment alongside the captured context. Copy any item as a structured markdown report, ready to paste into your AI coding agent.

### 3. Or let your agent handle it via MCP

Connect the Faster Fixes MCP server to your editor. Your AI coding agent can fetch new feedback, read the full context, locate the relevant code, fix the issue, and mark it as resolved — without leaving the terminal.

```bash
claude mcp add faster-fixes -s project \
  --env FASTER_FIXES_TOKEN=ff_agent_xxx \
  --env FASTER_FIXES_PROJECT=proj_xxx \
  -- npx -y @fasterfixes/mcp
```

The MCP server works with Claude Code, Cursor, VS Code, Windsurf, Codex, and Zed.

## Features

- **Visual feedback widget** — clients click on elements to leave feedback, no training needed
- **Automatic context capture** — screenshot, page URL, DOM selector, component tree, browser info
- **Recording**: the page content and the client's interactions over the last minute before each feedback, never the values typed into fields
- **Developer dashboard** — organized view of all feedback across projects
- **Markdown export** — copy any feedback item as a structured bug report for AI agents
- **MCP server** — AI coding agents fetch and resolve feedback programmatically
- **Agent skill** — install as a skill for autonomous feedback-to-fix workflows
- **GitHub integration** — automatically create issues from feedback items
- **Team collaboration** — organizations, projects, and role-based access
- **Review links** — share a link with clients so they can leave feedback without an account

## Packages

This monorepo publishes seven npm packages:

| Package                                                                      | Description                       | Install                                         |
| ---------------------------------------------------------------------------- | --------------------------------- | ----------------------------------------------- |
| [`@fasterfixes/widget`](https://www.npmjs.com/package/@fasterfixes/widget)   | Feedback widget for any website   | Script tag or `npm install @fasterfixes/widget` |
| [`@fasterfixes/react`](https://www.npmjs.com/package/@fasterfixes/react)     | React embed of the widget         | `npm install @fasterfixes/react`                |
| [`@fasterfixes/vue`](https://www.npmjs.com/package/@fasterfixes/vue)         | Vue embed of the widget           | `npm install @fasterfixes/vue`                  |
| [`@fasterfixes/angular`](https://www.npmjs.com/package/@fasterfixes/angular) | Angular embed of the widget       | `npm install @fasterfixes/angular`              |
| [`@fasterfixes/svelte`](https://www.npmjs.com/package/@fasterfixes/svelte)   | Svelte embed of the widget        | `npm install @fasterfixes/svelte`               |
| [`@fasterfixes/core`](https://www.npmjs.com/package/@fasterfixes/core)       | Framework-agnostic client library | `npm install @fasterfixes/core`                 |
| [`@fasterfixes/mcp`](https://www.npmjs.com/package/@fasterfixes/mcp)         | MCP server for AI coding agents   | `npx -y @fasterfixes/mcp`                       |

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

The widget packages (`@fasterfixes/widget`, `@fasterfixes/react`, `@fasterfixes/vue`, `@fasterfixes/angular`, `@fasterfixes/svelte`, `@fasterfixes/core`) and the MCP server (`@fasterfixes/mcp`) are licensed under MIT for unrestricted use in your applications.
