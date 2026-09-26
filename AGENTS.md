## Approach

- Think before acting. Read existing files before writing code.
- Be concise in output but thorough in reasoning.
- Prefer editing over rewriting whole files.
- Do not re-read files you have already read unless the file may have changed.
- Skip files over 100KB unless explicitly required.
- Suggest running /cost when a session is running long to monitor cache ratio.
- Recommend starting a new session when switching to an unrelated task.
- Test your code before declaring done.
- No sycophantic openers or closing fluff.
- Keep solutions simple and direct.
- User instructions always override this file.

## Non-negotiables

- You are FORBIDDEN from deleting any files yourself.
- If a file must be retired by you: keep an empty `_deprecated_*.ts(x)` replacement with a short comment.
- The user MAY delete files. If a file is already deleted (shows as `deleted` in git status), do NOT restore it — include the deletion as-is in the commit.
- If env vars change, update `.env.example` only.
- Never run a bare `pnpm install` to "refresh" anything. `pnpm-lock.yaml` is committed with Prettier's quoting (lint-staged reformats it), and pnpm rewrites it with its own, producing a ~20,000-line diff unrelated to your change. Install only when you are deliberately adding or removing a dependency, and check the lockfile diff before committing.
- Never run production database migrations (`pnpm --filter @workspace/db migrate:prod`).
- Only run development migrations (`pnpm --filter @workspace/db migrate:dev`); production migration execution is user-managed.
- Code identifiers, comments, filenames, schemas: English only.
- User-facing UI copy: English only. Professional, clear, and concise — match the tone of serious developer tools (e.g., Vercel, Linear, Stripe). No marketing fluff, no casual language, no exclamation marks. Prefer precise, understated wording.
- Never use the em dash character (`—`) in user-facing text. Use a comma, colon, or period instead.

## Code comments

- Add inline comments only when the logic is not self-evident — complex conditions, non-obvious side effects, tricky workarounds, or subtle business rules.
- Never comment what the code plainly says (e.g. no `// get user` above `getUser()`).
- Prefer a short inline `// why` over a multi-line block above a function.

## Critical conventions

All coding standards for this project live in the `coding-standards` skill at `.claude/skills/coding-standards/`.

**Load that skill** before writing code, reviewing changes, or answering questions about conventions.

- Use canonical domain terms defined in `CONTEXT.md`.

## Required checks before done

- **On a fresh clone, generate before you check.** The Prisma client, the published package builds and the Next.js route types are all untracked, so `pnpm typecheck` and the type-aware lint rules report errors unrelated to your change until you have run `pnpm build:packages`, `pnpm --filter @workspace/db db:gen` and `pnpm --filter web exec next typegen`.
- Run from repo root: `pnpm typecheck`.
- Run from repo root: `pnpm test`.
- Run from repo root: `pnpm lint` (all workspaces). Zero warnings tolerated: it runs with `--max-warnings 0`, so a warning fails it just like an error. Every convention rule is at `error` and reports nothing, which means any report is a regression.
- If DB schema changed: run `pnpm --filter @workspace/db migrate:dev`, then `pnpm --filter @workspace/db db:gen`.
- A production build is `pnpm --filter web build` from the repo root, not `pnpm build` inside `apps/web`: the filter is what resolves the workspace packages. Note that `apps/web/src/app/_domains/integration/_services/github/github-app.ts` reads `GITHUB_PRIVATE_KEY` at module evaluation, so page-data collection for `/api/github/setup` fails without a value in the environment.
- Never declare completion while required checks fail.
- The pre-commit hook runs the same checks: lint-staged (Prettier on every staged file, ESLint with zero warnings on staged `ts`, `tsx`, `js`, `jsx` files), then `pnpm typecheck` and `pnpm test`. There is one lint mode, so the hook enforces every convention rule (ADR-0015). The hook only sees staged files and `--no-verify` skips it, which is why CI runs the same commands.

## Keep costs low

- Reuse existing patterns in touched folders.
- Keep edits scoped to the task.
- Prefer enforceable rules in lint/CI/hooks over prompt text.

## Subagent Strategy

- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

## Agent skills

### Issue tracker

Issues live in GitHub Issues at `manucoffin/faster-fixes`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default canonical vocabulary (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`). See `docs/agents/triage-labels.md`.

### Releasing packages

`@fasterfixes/*` packages are published by CI from `main` through Changesets. Use the `release` skill to write the changeset; CI is the only publisher.

### Domain docs

Single-context repo. Glossary at `CONTEXT.md`; ADRs in `docs/adr/`. See `docs/agents/domain.md`.

## Next.js

`apps/web` runs a Next.js version with breaking changes against your training data. Before writing Next.js code, read the relevant guide in `apps/web/node_modules/next/dist/docs/` (see `apps/web/AGENTS.md`).
