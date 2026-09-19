---
name: coding-standards
description: Faster Fixes project coding conventions and rules for apps/web. Use when writing, refactoring, reviewing, or placing code in this repo: React/client components, tRPC services and routers, Zod schemas, TypeScript, Tailwind styling, file/folder placement, CRUD naming, forms, or error handling. Routes you to only the rule files your task needs so you do not load every rule at once.
---

# Faster Fixes Coding Standards

Conventions live as focused rule files in `rules/` next to this file. This skill is a
**router**: read only the rule file(s) that match what you are about to do, then apply
them. **Do not read every rule file.**

## Where the architecture is written down

`docs/architecture/target-architecture.md` describes the live structure of `apps/web`: two tiers
sharing one bucket set, transport-agnostic services under thin tRPC routers, and one domain-error
vocabulary mapped exactly once per boundary. ADR-0010 to ADR-0014 in `docs/adr/` pin the decisions
behind it. The rule files under `rules/` are the working form of all of it, so read those first.

Three facts settle most placement questions:

- **All code under `src/app` follows these rule files.** The rules that guard the structure report at
  `error` under `ESLINT_AGENT_RULES=1` everywhere, with no per-scope allowlist, and report nothing
  today: a violation is a regression, not a burn-down item.
- **`src/server/` accepts a new file under two conditions only**: it is wiring (it configures or
  instantiates a library for the whole application and makes no business decision), or it is a
  cross-cutting abstraction at least two domains or transports need whose server implementation no
  barrel can export. Inverse test: a file that makes a business decision for one glossary entity is a
  domain service, even when it calls an SDK. The rule and its named exemptions are in
  `docs/architecture/target-architecture.md`, section "The server folder", and an always-on
  `no-restricted-imports` block stops the folder reaching into the app tree by deep path.
- **A service throws a domain error**, never a `TRPCError` and never a bare `Error`. The vocabulary
  is at `@/server/errors/domain-errors` and every boundary maps it back into its own dialect (see
  `rules/backend.md` and `rules/errors.md`).

`interruptOnDomainError` is the one piece of the error model that is not built: no RSC page calls a
throwing service yet, so the helper lands with its first caller.

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
