# agent.md

**At the start of every session, invoke the `.agents/skills/caveman/` skill if it has not already been invoked this session.**

## Non-negotiables

- You are FORBIDDEN from deleting any files yourself.
- If a file must be retired by you: keep an empty `_deprecated_*.ts(x)` replacement with a short comment.
- The user MAY delete files. If a file is already deleted (shows as `deleted` in git status), do NOT restore it — include the deletion as-is in the commit.
- Never edit `.env`, `.env.local`, or any `.env*` file.
- If env vars change, update `.env.example` only.
- Never run production database migrations (`pnpm migrate:prod`).
- Only run development migrations (`pnpm migrate:dev`); production migration execution is user-managed.
- Code identifiers, comments, filenames, schemas: English only.
- User-facing UI copy: English only. Professional, clear, and concise — match the tone of serious developer tools (e.g., Vercel, Linear, Stripe). No marketing fluff, no casual language, no exclamation marks. Prefer precise, understated wording.
- All `unstable_cache` usage must include `cacheTags` from `@/server/cache/cache-tags`.

## Code comments

- Comments exist to capture **decisions**, not describe code. A dev returning in 6 months should understand _why_ the code is this way, not _what_ it does.
- Comment when: choosing one approach over an obvious alternative, working around a limitation, relying on non-obvious behavior, or enforcing a subtle business rule.
- Never comment what the code plainly says (e.g. no `// get user` above `getUser()`).
- Prefer a short inline `// why` over a multi-line block above a function.

## Critical conventions

- Follow detailed project rules in `.claude/rules/rules-index.md`.
- Naming:
- `*.client.tsx` for client components.
- `*.server.tsx` for server components.
- `*.trpc.query.ts` for tRPC queries.
- `*.trpc.mutation.ts` for tRPC mutations.
- `*.schema.ts` for Zod schemas.
- When a form is used for both create and edit: split into a dialog wrapper (fetches data, `matchQueryStatus`) and a pure form component (receives loaded data as props).

## Required checks before done

- Run from repo root: `pnpm typecheck`.
- Run both lint commands:
- `pnpm lint` (all workspaces).
- `pnpm lint:agent-rules` (web project rules only).
- If DB schema changed: run required `packages/database` generation/migration commands.
- Never declare completion while required checks fail.

## Keep costs low

- Reuse existing patterns in touched folders.
- Keep edits scoped to the task.
- Prefer enforceable rules in lint/CI/hooks over prompt text.

## Subagent Strategy

- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

<!-- BEGIN:nextjs-agent-rules -->

# Next.js: ALWAYS read docs before coding

Before any Next.js work, find and read the relevant doc in `node_modules/next/dist/docs/`. Your training data is outdated — the docs are the source of truth.

<!-- END:nextjs-agent-rules -->

<!-- code-review-graph MCP tools -->

## MCP Tools: code-review-graph

**IMPORTANT: This project has a knowledge graph. ALWAYS use the
code-review-graph MCP tools BEFORE using Grep/Glob/Read to explore
the codebase.** The graph is faster, cheaper (fewer tokens), and gives
you structural context (callers, dependents, test coverage) that file
scanning cannot.

### When to use graph tools FIRST

- **Exploring code**: `semantic_search_nodes` or `query_graph` instead of Grep
- **Understanding impact**: `get_impact_radius` instead of manually tracing imports
- **Code review**: `detect_changes` + `get_review_context` instead of reading entire files
- **Finding relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture questions**: `get_architecture_overview` + `list_communities`

Fall back to Grep/Glob/Read **only** when the graph doesn't cover what you need.

### Key Tools

| Tool                        | Use when                                               |
| --------------------------- | ------------------------------------------------------ |
| `detect_changes`            | Reviewing code changes — gives risk-scored analysis    |
| `get_review_context`        | Need source snippets for review — token-efficient      |
| `get_impact_radius`         | Understanding blast radius of a change                 |
| `get_affected_flows`        | Finding which execution paths are impacted             |
| `query_graph`               | Tracing callers, callees, imports, tests, dependencies |
| `semantic_search_nodes`     | Finding functions/classes by name or keyword           |
| `get_architecture_overview` | Understanding high-level codebase structure            |
| `refactor_tool`             | Planning renames, finding dead code                    |

### Workflow

1. The graph auto-updates on file changes (via hooks).
2. Use `detect_changes` for code review.
3. Use `get_affected_flows` to understand impact.
4. Use `query_graph` pattern="tests_for" to check coverage.
