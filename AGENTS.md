## Approach

- Skip files over 100KB unless explicitly required.
- Quote glob arguments (`--include='*.tsx'`) or use `rg`: zsh aborts on an unmatched glob. macOS has no `timeout`.
- Recommend a new session when the user switches to an unrelated task.
- Prefer enforceable rules in lint/CI/hooks over prompt text.

## Non-negotiables

- Delete files your change makes obsolete. Never delete untracked or gitignored files you did not create: git cannot restore them.
- If a file already shows as `deleted` in git status, the user removed it on purpose: include the deletion as-is in the commit.
- If env vars change, update `.env.example` only.
- Install only to add or remove a dependency, never a bare `pnpm install` to refresh: pnpm rewrites the Prettier-quoted `pnpm-lock.yaml` into a ~20,000-line unrelated diff. Check the lockfile diff before committing.
- Run development migrations only (`pnpm --filter @workspace/db migrate:dev`); production migrations are user-managed.
- Code identifiers, comments, filenames, schemas: English only.
- User-facing UI copy: English, in the precise, understated register of Vercel, Linear or Stripe. End sentences with periods, never exclamation marks.
- Never use the em dash character (`—`) in user-facing text. Use a comma, colon, or period instead.
- CI is the only publisher of `@fasterfixes/*` packages: write a changeset with the `release` skill and leave publishing to CI.

## Conventions

- Load the `coding-standards` skill before writing code, reviewing changes, or answering questions about conventions.
- Comment only what the code cannot say (complex conditions, side effects, workarounds, business rules), as a short inline `// why`.
- Next.js in `apps/web` postdates your training: before writing Next.js code, read its guide in `apps/web/node_modules/next/dist/docs/` and heed deprecation notices.

## Required checks before done

- Work is done only when these pass:
  - The pre-commit hook, `.husky/pre-commit`, the single list of checks: read it rather than restating it. `git commit` runs it, so a successful commit is your proof; with no commit, run `sh .husky/pre-commit` from the repo root. Typecheck, tests and Knip read the whole working tree, so unstaged work fails the hook too, and parallel sessions each need their own worktree.
  - `pnpm lint` and `pnpm format:check`. They cover every workspace where lint-staged covers only staged files, so they catch a file your change broke without touching it. Every lint rule is at `error` with zero warnings, so any report is a regression.
- On a fresh clone or worktree, generate before you lint: the Prisma client, package builds and Next.js route types are untracked, and the type-aware lint rules report unrelated errors until `pnpm build:packages`, `pnpm --filter @workspace/db db:gen` and `pnpm --filter web exec next typegen` have run. `pnpm typecheck` generates them itself.
- If the DB schema changed: `pnpm --filter @workspace/db migrate:dev`, then `pnpm --filter @workspace/db db:gen`.
- A production build is `pnpm --filter web build` from the repo root: the filter resolves the workspace packages. It needs `GITHUB_PRIVATE_KEY` set, since `github-app.ts` reads it at module evaluation and page-data collection for `/api/github/setup` fails without it.

## Agent skills

### Issue tracker

Issues live in GitHub Issues at `manucoffin/faster-fixes`. See `docs/agents/issue-tracker.md`.

### Triage labels

Five canonical triage roles, all using default label names. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context repo. Glossary at `CONTEXT.md`: name domain concepts with its terms. ADRs in `docs/adr/`. See `docs/agents/domain.md`.

### Web app

- `pnpm dev:server start|stop|status` runs the dev server in the background, in cloud mode so `/`, `/docs` and `/blog` render instead of redirecting to `/login`. `start` returns once the server answers, with its URL and log path.
- Public docs and blog pages are MDX in `apps/web/src/content/docs` and `apps/web/src/content/blog`; each docs folder's `meta.json` sets its sidebar order.
