# @fasterfixes/mcp

> **[Documentation](https://faster-fixes.com/docs)** · [Website](https://faster-fixes.com)

MCP server for [Faster Fixes](https://faster-fixes.com) — connect AI coding agents to your client feedback.

Clients leave feedback on your site via the widget. This MCP server lets your AI coding agent fetch that feedback and update its status, so you never leave your terminal.

## Prerequisites

1. **Agent token** — Organization Settings > Agent Tokens > Create token
2. **Project ID** — Project Settings > the `proj_...` identifier

## Installation

No global install needed. Run a single command to configure your editor.

### Claude Code

```bash
claude mcp add faster-fixes -s project \
  --env FASTER_FIXES_TOKEN=ff_agent_xxx \
  --env FASTER_FIXES_PROJECT=proj_xxx \
  -- npx -y @fasterfixes/mcp
```

Or add to `.mcp.json` at your project root:

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

### Cursor

Add to `.cursor/mcp.json` in your project (or `~/.cursor/mcp.json` for global):

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

### VS Code (GitHub Copilot)

Add to `.vscode/mcp.json` in your project:

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

Note: VS Code uses `"servers"` (not `"mcpServers"`) and requires `"type": "stdio"`.

### Windsurf

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

### Codex

Add to `.codex/config.toml` in your project (or `~/.codex/config.toml` for global):

```toml
[mcp_servers.faster-fixes]
command = "npx"
args = ["-y", "@fasterfixes/mcp"]

[mcp_servers.faster-fixes.env]
FASTER_FIXES_TOKEN = "ff_agent_your_token_here"
FASTER_FIXES_PROJECT = "proj_your_project_id"
```

Note: Codex uses TOML, not JSON.

### Zed

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

Note: Zed uses `"context_servers"` as the key, and the config goes directly in your main settings file.

## Agent Skill (optional)

For a one-command workflow, install the **fix-feedback** skill. It teaches your agent the full loop: fetch → fix → resolve.

```bash
npx skills add manucoffin/faster-fixes/packages/skills/fix-feedback
```

Then just say `fix feedback` and your agent handles the rest. Works with Claude Code, Cursor, Windsurf, and 40+ other agents via [skills.sh](https://skills.sh).

## Usage

After configuring, ask your agent:

- "Check for new feedback"
- "Get all open feedback and fix them"
- "Mark feedback abc123 as resolved"

Or set up a scheduled task to fetch and fix feedback automatically.

## Tools

### `list_feedbacks`

List feedback items for your project. Returns page URL, CSS selector, click coordinates, component tree, browser info, and screenshot.

| Parameter  | Type   | Required | Description                                        |
| ---------- | ------ | -------- | -------------------------------------------------- |
| `status`   | string | No       | Filter: `new`, `in_progress`, `resolved`, `closed` |
| `page_url` | string | No       | Filter by the page where feedback was left         |
| `format`   | string | No       | `markdown` (default) or `json`                     |

### `update_feedback_status`

Update the status of a feedback item.

| Parameter     | Type   | Required | Description                                   |
| ------------- | ------ | -------- | --------------------------------------------- |
| `feedback_id` | string | Yes      | The feedback ID                               |
| `status`      | string | Yes      | `new`, `in_progress`, `resolved`, or `closed` |

## Environment variables

| Variable               | Required | Description                                           |
| ---------------------- | -------- | ----------------------------------------------------- |
| `FASTER_FIXES_TOKEN`   | Yes      | Agent token from Organization Settings                |
| `FASTER_FIXES_PROJECT` | Yes      | Project ID (`proj_...`) from Project Settings         |
| `FASTER_FIXES_URL`     | No       | API base URL (defaults to `https://faster-fixes.com`) |

## Security

- The agent token is scoped to your organization and can only read feedback and update status
- No delete, create, or admin operations are available
- Tokens can be revoked instantly from the dashboard
- All API calls are rate-limited

## License

[MIT](./LICENSE)
