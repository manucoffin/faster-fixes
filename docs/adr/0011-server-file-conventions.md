# Server file conventions: services folder over suffix

The folder architecture ADR gave each scope a server bucket but left its inside unspecified. The feature-folder era encoded roles in filename suffixes (`*.trpc.query.ts`, `*.server.mutation.ts`) and colocated data access inside UI features. Suffixes duplicate what a folder already says, multiply as roles grow, and couple the data layer to one transport (`*.trpc.*`) even though orchestration logic should be transport-agnostic. The governing idea is inverted: **the folder (`_services/`) declares the data/IO layer, the verb prefix declares read versus write, and tRPC is thin transport at the scope root that imports the services.**

## Decisions

- **`_services/` is the data/IO layer.** A file is plain-named after its export (`get-user.ts` exports `getUser`). No role suffixes. It holds reads, writes, IO-predicates, write-orchestrations, `*.inngest.ts` jobs, and `*.schema.ts`. Created lazily, per scope.
- **The verb prefix is load-bearing; read versus write is an invariant.**
  - Reads (never write) are a **closed set**: `get-` (one), `list-` (collections), `find-` (nullable lookup), `search-`, `has-` / `is-` (IO-predicates), `count-`. Computed reads (a feasibility check, a preview) use `get-` plus the result noun, never a process verb (`evaluate-`, `compute-`, `resolve-`). Each admitted process verb would erode the "verb outside the read set means possible write" signal.
  - Writes are an **open set**: generic CRUD verbs by default (`create-`, `update-`, `delete-`, `upsert-`, `send-`), a precise domain verb (`archive-`, `publish-`, `book-`) for a distinct domain transition, coined from the glossary. A write verb never collides with a read verb. Synonyms of `update` (`edit-`, `modify-`, `save-`, `change-`) are banned. Lint enforces the filename shape and the banned synonyms; the closed read set is a review concern.
  - `handle-` is the write-orchestration verb for event and webhook handlers.
  - A file is a read iff it performs no writes.
- **tRPC is the API layer, not duplicated by a hand-rolled fetcher layer.** The procedures and routers are the API. tRPC generates the fetcher, query options, hooks, and types from one procedure.
- **`trpc-router.ts` is thin transport at the scope root**, sibling of `_services/`, colocated with `page.tsx` for a route. Procedures are inlined when thin: auth procedure, Zod `.input()`, one service call. A fat procedure is a smell. Routers compose hierarchically following the route tree; the god-router is dissolved.
- **Services are transport-agnostic.** A service never imports tRPC. It is callable from a procedure, a job, a route handler, or a server component. The type source of truth is the service's return type (`Awaited<ReturnType<typeof getX>>`), not `inferProcedureOutput`.
- **All data operations go to `_services/`, even single-use.** Clutter is controlled by route-tree granularity (each segment owns its `_services/` and router) and, secondarily, by subfolders when three or more files cluster.
- **Per-use-case named reads sharing `select` fragments**, not one polymorphic read. The scope folder disambiguates identical names; a `-for-<shape>` qualifier only when two shapes coexist in one `_services/`.
- **Pure logic is a helper, not a service.** `_helpers/` is strictly behavioral: functions only, no IO, no JSX, no state, no schema, no standalone type. Predicates split by IO: pure predicate in `_helpers/`, IO-predicate in `_services/`.
- **Standalone shared types live in `_types/`.** A service-derived type stays in its service file.
- **Schemas live in `_services/`** as `*.schema.ts`, consumed by the procedure's `.input()` and the client form resolver. A schema stays pure Zod with no server-only import, so the client can import it without pulling server code. The client-boundary lint exempts `*.schema.ts` and type-only imports.
- **Structure grows on demand.** A feature is flat until a species crowds it (around three files), then collapses into a `_`-prefixed subfolder. No mandatory per-feature skeleton. No feature nested in a feature (lint-enforced).
- **Side-effecting orchestrations** (`*.inngest.ts`, `notify-*`, `send-*` on a write path) are services. Thin adapter calls with no domain decision are infrastructure in `src/lib/`.
- **External SDK code follows the domain decision, not the dependency.** Thin domain-agnostic adapters live in `src/server/<lib>/`. Domain logic that happens to call an SDK stays in the domain's `_services/`.

## Considered Options

- **Suffix over folder.** Rejected: the suffix duplicates the folder, multiplies with roles, and `*.trpc.*` couples the data layer to the transport.
- **Keep a `_server/` grab-bag.** Rejected: `_services/` names the layer precisely and pairs with the verb convention.
- **One polymorphic `getUser` returning a wide row.** Rejected: callers over-fetch or fight the type.
- **Hand-rolled API layer (fetcher, query options, hook, types per operation).** Rejected: tRPC generates all of it. We keep the principles (colocate, one dependency direction, deliberate promotion), not the file shapes.
- **A `_lib/` bucket for domain-touching pure code.** Rejected: `lib` already means infra adapters; `_helpers/` plus `_types/` cover the pure surface.

## Deviations in this repo

This ADR was adopted from another project's architecture playbook and committed as-is. Two points are settled locally.

- **A read service exports `<Service>Output`, not `<Service>`.** The source document names the derived alias after the function (`export type ListUsers = Awaited<ReturnType<typeof listUsers>>`). Here it keeps the `Output` suffix the app already uses: `export type ListUsersOutput = Awaited<ReturnType<typeof listUsers>>`. All 95 existing aliases are already named `<Procedure>Output` (`GetMrrOutput`, `GetPaginatedUsersOutput`), so a consumer changes an import path and nothing else, and `ListUsers` reads like an entity type rather than one operation's return shape. `require-trpc-output-type` checks the right-hand side, not the name, so both spellings lint clean and the convention is a review concern.
- **The ADR set this one amends is numbered here**: the folder architecture ADR is [ADR-0010](./0010-app-folder-architecture.md), and the answer to "what does a transport-agnostic service throw?" is [ADR-0012](./0012-domain-errors-and-transport-mapping.md).

**Status.** Accepted, committed 2026-09-18 with the step 3 prerequisites. The conventions are live in every scope of `apps/web/src/app/**`: the scope-by-scope rollout finished with step 3, and the pre-migration layout (`_utils/`, `*.trpc.query.ts`, `*.trpc.mutation.ts`) is gone from the tree.

## Consequences

- A migration extracts a service out of every procedure (even single-use), inlines thin procedures into a root `trpc-router.ts`, drops the role suffixes, and relocates routers to the scope root.
- `_utils/` is renamed to `_helpers/` and fanned out: pure functions stay, IO and schemas move to `_services/`, types to `_types/`, hooks to their feature, routers to the scope root.
- Lint rules enforce the boundaries: `no-client-import-of-services`, `services-no-trpc-import`, `schema-must-be-pure-zod`, `no-feature-nesting`, `services-verb-prefix`, `require-trpc-output-type`, `require-schema-conventions`, `require-use-client-suffix`, `no-default-export`.
- This ADR amends the folder architecture ADR: the bucket set is `_services/`, `_helpers/`, `_types/`, `_features/`, `_components/` plus a root `trpc-router.ts`.
- The question "what does a transport-agnostic service throw?" is answered by the domain errors ADR.
