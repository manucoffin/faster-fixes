# Migration kit

> A set of documents to paste into another project on the same stack (Next.js App Router, tRPC, Prisma, pnpm + Turborepo monorepo) so that an agent there can migrate it, one step at a time, to the architecture described in `../target-architecture.md`.

The kit describes **end states**, not procedures. Each step document says what the code must look like when the step is done and how to prove it. The receiving project writes its own plan per step.

## Contents

| File                        | Paste it when                                                                 | Commit it there?                               |
| --------------------------- | ----------------------------------------------------------------------------- | ---------------------------------------------- |
| `../target-architecture.md` | Once, before anything else. Becomes the project's permanent architecture doc. | Yes, as `docs/architecture.md`                 |
| `example-listing-domain.md` | With the architecture doc. The canonical shape of one migrated domain.        | Optional; useful as a permanent reference      |
| `01-tooling.md`             | Step 1                                                                        | No                                             |
| `02-domain-folders.md`      | Step 2                                                                        | No                                             |
| `03-services.md`            | Step 3                                                                        | No                                             |
| `04-domain-errors.md`       | Step 4                                                                        | No                                             |
| `05-packages.md`            | Step 5                                                                        | No                                             |
| `adrs/*.md`                 | With the step that introduces each decision.                                  | Yes, renumbered into the project's `docs/adr/` |

Step documents are working input for the agent. They are not committed in the receiving project: once a step is done, the architecture doc and the ADRs are the record.

## Order and why

1. **Tooling**: the skill, the agent instructions, the lint rules at `warn`, the test harness conventions. Everything after this is verifiable.
2. **Domain folders**: outer structure only. Features move under `_domains/`, barrels appear, cross-domain deep imports become errors. Inner buckets are untouched.
3. **Services**: inner structure. Procedures become thin, logic moves to `_services/`, `_utils/` fans out, schemas move. The domain-error vocabulary and its tRPC middleware land at the **start** of this step so that no error code is lost during extraction.
4. **Domain errors**: the remaining boundaries, masking, client channels, error boundaries, lint lock.
5. **Packages**: the extraction rule. Usually a no-op for a single-app monorepo with independent published packages.

Each step ends by locking its lint rules to `error` for the migrated scopes. There is no separate "lock everything" step.

## Files to copy from Tobalgo by hand

These are code, not documents. Copy them verbatim, then adapt what the step document says to adapt. Paths are identical in both repos.

### Skills

Skills live in `.agents/skills/<name>/` with a symlink `.claude/skills/<name> -> ../../.agents/skills/<name>`. Copy the real folder and recreate the symlink.

| Skill                                     | Why                                                                                                                                                         |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `coding-standards`                        | **Required.** The rule files every step references. Adapt `rules/frontend.md` (UI language) and `rules/testing.md` (harness paths) as `01-tooling.md` says. |
| `codebase-design`                         | Vocabulary for deep modules, used when deciding seams during extraction.                                                                                    |
| `domain-modeling`                         | Keeps the glossary sharp while domain folders are named.                                                                                                    |
| `code-review`                             | Reviews a branch against the coding standards. Depends on `coding-standards`.                                                                               |
| `commit`                                  | One-concern commits in the Commitizen format the migration log expects.                                                                                     |
| `tdd`                                     | Test-first loop, useful once services are injectable.                                                                                                       |
| `writing-for-agents`                      | For editing `AGENTS.md` and the skill files themselves.                                                                                                     |
| `grilling`, `grill-me`, `grill-with-docs` | Optional. Used to stress-test each step's plan before executing it.                                                                                         |

### Lint rules

| Path                                           | What                                                                                                                                                              |
| ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/eslint-config/local-rules/*.js`      | The rule implementations and `index.js` (the plugin). Drop `no-deprecated-error-imports.js` and its entry in `index.js`. `no-raw-tailwind-colors.js` is optional. |
| `packages/eslint-config/local-rules/*.test.js` | Rule tests. Keep them running under the package's `vitest`.                                                                                                       |
| `packages/eslint-config/next.js`               | The wiring: `local` plugin registration, per-glob severities, the `ESLINT_AGENT_RULES` gate. Re-derive the severities from `01-tooling.md` (start at `warn`).     |
| `packages/eslint-config/package.json`          | `exports` and the `vitest` scripts.                                                                                                                               |

### Agent instructions

| Path                                   | What                                                                                                                                                                                                                                  |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `AGENTS.md` (symlinked as `CLAUDE.md`) | Copy the sections "Approach", "Non-negotiables", "Code comments", "Critical conventions", "Required checks before done", "Keep costs low". Remove the French copy rules and the `unstable_cache` rule. Keep "identifiers in English". |
| `docs/README.md`                       | The writing guidelines section, so the architecture doc and ADRs follow the same format.                                                                                                                                              |

### Runtime code

Step documents quote what to create. Two files are worth copying as-is rather than retyping:

| Path                                                                          | Step                                |
| ----------------------------------------------------------------------------- | ----------------------------------- |
| `apps/web/src/server/errors/domain-errors.ts`                                 | 3                                   |
| `apps/web/src/server/errors/{http-response,next-interrupts,non-retriable}.ts` | 4                                   |
| `apps/web/src/lib/trpc/match-query-status.ts`                                 | 4, if the project has no equivalent |

## Definition of done, shared by every step

- `pnpm typecheck` passes.
- `pnpm lint` passes with zero warnings.
- `pnpm lint:agent-rules` passes with the step's rules at `error` for every migrated scope.
- `pnpm test` passes.
- The step's "must be gone" greps return nothing.
- The app builds and the routes touched by the step render.

## Migration log

Tobalgo kept a short log during its own migration: one line per migrated scope, with the commit and the rules locked. It made "what is left" a lookup instead of a search. Recommended, in a temporary `docs/_migration/` folder that is deleted at the end.
