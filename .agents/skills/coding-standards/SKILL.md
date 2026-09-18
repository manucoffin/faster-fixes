---
name: coding-standards
description: Faster Fixes project coding conventions and rules for apps/web. Use when writing, refactoring, reviewing, or placing code in this repo: React/client components, tRPC services and routers, Zod schemas, TypeScript, Tailwind styling, file/folder placement, CRUD naming, forms, or error handling. Routes you to only the rule files your task needs so you do not load every rule at once.
---

# Faster Fixes Coding Standards

Conventions live as focused rule files in `rules/` next to this file. This skill is a
**router**: read only the rule file(s) that match what you are about to do, then apply
them. **Do not read every rule file.**

## Migration in progress

The web app is moving to the target architecture (`docs/architecture/target-architecture.md`) in
five steps. The log lives in `docs/_migration/`: it records the convention baseline, which scopes
are already locked, and what the next step needs.

Steps 1 and 2 are done. `src/app/_domains/` holds the domain-bound code behind a public `index.ts`
per domain, and root `_components/`, `_providers/` and `_constants/` hold the domain-agnostic code.

Step 3 is running. Its prerequisites have landed: the `DomainError` vocabulary exists at
`@/server/errors/domain-errors` and the base tRPC procedure maps it back to a `TRPCError` with the
same code and message, so **any service you write throws domain errors, not `TRPCError` and not a
bare `Error`** (see `rules/backend.md` and `rules/errors.md`). The conventions are pinned by
ADR-0011 (server file conventions) and ADR-0012 (domain errors) in `docs/adr/`.

Step 3 then reshapes the inside of each scope one at a time, so a scope it has not reached still
carries its pre-migration file layout (`_utils/`, `_constants/`, `*.trpc.query.ts`,
`*.trpc.mutation.ts`) and has no `_services/` folder. `src/server/**` still holds domain logic that
step 3 moves into its domain. The remaining error boundaries (route handler responses, Next.js
interrupts, non-retriable Inngest failures) and the masking of 500 messages arrive in step 4.

While the migration runs:

- **New code follows the target architecture** described in these rule files.
- **Inside a scope that has not been migrated yet, follow that folder's existing conventions.** Do
  not mix the two in one folder: a half-converted scope is harder to finish than either convention
  applied consistently.
- `pnpm lint:agent-rules` reports the remaining convention violations as warnings. They are the
  burn-down metric, not a task list: clear them when you migrate the scope.

Delete this section when the migration ends.

## How to use

1. Find the row(s) in the routing table matching your task.
2. `Read` the listed rule file(s) under `rules/`.
3. Apply them while you work. When unsure about placement, also read `rules/architecture.md`.

## Routing table

| You are about to…                                                               | Read                                                         |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| **Place a new file / decide where code goes**                                   | `rules/architecture.md`                                      |
| **Write backend / data layer** (services, queries, mutations, IO, tRPC routers) | `rules/backend.md` + `rules/naming.md`                       |
| **Define a Zod schema**                                                         | `rules/schemas.md`                                           |
| **Build React UI / a component / client component / styling / query status**    | `rules/frontend.md`                                          |
| **Build a create/edit form**                                                    | `rules/frontend.md` + `rules/schemas.md` + `rules/errors.md` |
| **Surface or handle an error to the user**                                      | `rules/errors.md`                                            |
| **Name a function or file (any language)**                                      | `rules/naming.md`                                            |
| **Write a test / decide where a test goes**                                     | `rules/testing.md`                                           |
| **Split a file / judge a file that feels too big / review readability**         | `rules/code-shape.md`                                        |

## Cross-cutting (small, almost always relevant)

- **Any TypeScript** → `rules/typescript.md` (`type` over `interface`, infer aggressively, English identifiers).
- **Reviewing or refactoring anything** → `rules/code-shape.md` (size thresholds, single responsibility, readability, flag-vs-auto-fix).

## Rule files

- `rules/architecture.md` — app folder structure, two tiers, buckets, file placement, cross-domain imports.
- `rules/backend.md` — `_services/` data/IO layer, verb vocabulary, transport-agnostic services, tRPC router, client/server boundary.
- `rules/schemas.md` — Zod schema naming, placement, type extraction, Prisma enums.
- `rules/frontend.md` — React component + client component patterns, Tailwind, `matchQueryStatus`, forms, user-facing copy.
- `rules/errors.md` — the four error display channels, route boundaries, anti-patterns.
- `rules/naming.md` — CRUD read/write verb vocabulary, resource and file naming.
- `rules/typescript.md` — type definition and inference standards.
- `rules/testing.md` — Vitest harness, colocated `*.test.ts`, test only `_services/`/`_helpers/` for now.
- `rules/code-shape.md` — file size thresholds, single-responsibility red flags, readability fixes, flag-vs-auto-fix.

## Maintaining this skill

When adding a rule, create or extend a file under `rules/` and add a row to the routing
table above so it stays discoverable. Keep this `SKILL.md` thin — it is only the index.
