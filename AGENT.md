# agent.md

## Non-negotiables

- You are FORBIDDEN from deleting any files yourself.
- If a file must be retired by you: keep an empty `_deprecated_*.ts(x)` replacement with a short comment.
- The user MAY delete files. If a file is already deleted (shows as `deleted` in git status), do NOT restore it — include the deletion as-is in the commit.
- Never edit `.env`, `.env.local`, or any `.env*` file.
- If env vars change, update `.env.example` only.
- Never run production database migrations (`pnpm migrate:prod`).
- Only run development migrations (`pnpm migrate:dev`); production migration execution is user-managed.
- Code identifiers, comments, filenames, schemas: English only.
- User-facing UI copy: French, always vouvoiement (`vous`), never `tu`.
- All `unstable_cache` usage must include `cacheTags` from `@/server/cache/cache-tags`.

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
