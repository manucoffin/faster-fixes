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

Step 3 is done. Every scope under `src/app` has the final bucket set: data and IO live in
verb-prefixed `_services/` functions, routers are thin `trpc-router.ts` files at a scope root,
schemas are pure Zod in `_services/`, `_utils/` gave way to `_helpers/` and `_types/`, and the
`*.trpc.query.ts` / `*.trpc.mutation.ts` role suffixes are gone. The `DomainError` vocabulary exists at
`@/server/errors/domain-errors` and the base tRPC procedure maps it back to a `TRPCError` with the
same code and message, so **any service you write throws domain errors, not `TRPCError` and not a
bare `Error`** (see `rules/backend.md` and `rules/errors.md`). The conventions are pinned by
ADR-0011 (server file conventions) and ADR-0012 (domain errors) in `docs/adr/`.

Step 4 has not started. `src/server/**` still holds domain logic that step 5 moves into its domain,
twelve route handlers still query Prisma inline, and the remaining error boundaries (route handler
responses, Next.js interrupts, non-retriable Inngest failures) and the masking of 500 messages
arrive in step 4.

While the migration runs:

- **All code under `src/app` follows the target architecture** described in these rule files. Since
  the step 3 final lock, the rules that guard it report at `error` under `ESLINT_AGENT_RULES=1`
  everywhere, with no per-scope allowlist: a violation is a regression, not a burn-down item.
- **Inside the `src/server` tree, follow that folder's existing conventions** until step 5
  relocates it. Do not mix the two in one folder: a half-converted folder is harder to finish than
  either convention applied consistently.
- `no-raw-tailwind-colors` is locked at `error` and reports nothing: use the semantic token
  (`text-destructive`, `text-success`, `text-muted-foreground`) rather than a palette class. Hues
  with no token yet (yellow, amber, blue) are not reported.

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
