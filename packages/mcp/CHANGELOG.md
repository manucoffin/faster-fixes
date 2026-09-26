# @fasterfixes/mcp

## 0.0.6

### Patch Changes

- [#173](https://github.com/manucoffin/faster-fixes/pull/173) [`24fa3b3`](https://github.com/manucoffin/faster-fixes/commit/24fa3b338844a4b35147ac18fbbda9642d9904e7) Thanks [@manucoffin](https://github.com/manucoffin)! - `create_feedbacks` tool: the summary returned when the plan limit is reached separates its two sentences with a colon rather than an em dash. No behavioral change.

## 0.0.5

- `list_feedbacks` tool description now states that captured console logs and network requests (the Diagnostic Trail) are included in the returned feedback. No behavioral change — the trail already flows through from the agent API; this just makes it discoverable to the calling agent.

## 0.0.4

- `create_feedbacks` tool: bulk-create feedback items from another tool's export (BugHerd, Marker.io, Userback, Usersnap). Atomic batch up to 100 items per call, preserves original timestamps, attributes to a named reviewer, and skips integration fan-out (no GitHub issues auto-opened on import).
- Internal: split `index.ts` into per-tool modules under `src/tools/` and extracted shared types/schemas for easier extension.

## 0.0.3

- Fix: default API origin normalized to `https://www.faster-fixes.com` (previously omitted the `www` subdomain, causing redirects).

## 0.0.2

- Fix: tool input schemas now use a plain object shape, matching the MCP SDK's expected format.
- Build: dist paths switched to ESM (`dist/index.mjs` / `dist/index.d.mts`).
- Docs: expanded setup instructions covering multiple editors.

## 0.0.1

### Initial release

- `list_feedbacks` tool: list feedback items with status/page URL filters, markdown or JSON output
- `update_feedback_status` tool: update feedback status (new, in_progress, resolved, closed)
- Token-based authentication via `FASTER_FIXES_TOKEN` environment variable
- Project targeting via `FASTER_FIXES_PROJECT` environment variable
