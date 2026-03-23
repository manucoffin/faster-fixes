# @fasterfixes/mcp

MCP server for [Faster Fixes](https://faster-fixes.com) — connect AI agents like Claude Code to your client feedback.

Clients leave feedback on your site. This MCP server lets your AI coding agent fetch that feedback and update its status, so you never leave your terminal.

## Setup

### 1. Get your credentials

- **Agent token**: Organization Settings > Agent Tokens > Create token
- **Project ID**: Project Settings > the `proj_...` identifier

### 2. Configure Claude Code

Add to your Claude Code MCP settings (`.claude/mcp.json` or global settings):

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

### 3. Use it

Ask Claude Code:

- "Check for new feedback"
- "Get all open feedback and fix them"
- "Mark feedback abc123 as resolved"

## Tools

### `list_feedbacks`

List feedback items for your project. Returns page URL, CSS selector, click coordinates, component tree, browser info, and screenshot.

| Parameter  | Type   | Required | Description                                |
| ---------- | ------ | -------- | ------------------------------------------ |
| `status`   | string | No       | Filter: `new`, `in_progress`, `resolved`, `closed` |
| `page_url` | string | No       | Filter by the page where feedback was left |
| `format`   | string | No       | `markdown` (default) or `json`             |

### `update_feedback_status`

Update the status of a feedback item.

| Parameter     | Type   | Required | Description                                         |
| ------------- | ------ | -------- | --------------------------------------------------- |
| `feedback_id` | string | Yes      | The feedback ID                                     |
| `status`      | string | Yes      | `new`, `in_progress`, `resolved`, or `closed`       |

## Environment variables

| Variable               | Required | Description                                      |
| ---------------------- | -------- | ------------------------------------------------ |
| `FASTER_FIXES_TOKEN`   | Yes      | Agent token from Organization Settings           |
| `FASTER_FIXES_PROJECT` | Yes      | Project ID (`proj_...`) from Project Settings    |
| `FASTER_FIXES_URL`     | No       | API base URL (defaults to `https://faster-fixes.com`) |

## Security

- The agent token is scoped to your organization and can only read feedback and update status
- No delete, create, or admin operations are available
- Tokens can be revoked instantly from the dashboard
- All API calls are rate-limited and audit-logged

## License

[MIT](./LICENSE)
