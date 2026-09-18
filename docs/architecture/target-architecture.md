# Target architecture

> The application architecture of `apps/web` after the 2026 refactor: two tiers (domains and routes) sharing one bucket set, transport-agnostic services under thin tRPC routers, one domain-error vocabulary mapped once per boundary, and lint rules that keep all of it true. Written so that another project on the same stack can adopt it as its end state.

This document is the reference for the migration kit in `migration-kit/`. It describes **where things end up**, not how to get there. The per-step documents in the kit each carve out one slice of this picture.

## Core files (in this repo)

| File                                                                          | Role                                                                        |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `docs/adr/0010-app-folder-architecture.md`                                    | Two tiers, buckets, per-domain public API. Committed as ADR 0010 in step 2. |
| `docs/architecture/migration-kit/adrs/server-file-conventions.md`             | `_services/`, verb prefixes, thin routers. Becomes an ADR in step 3.        |
| `docs/architecture/migration-kit/adrs/domain-errors-and-transport-mapping.md` | `DomainError` vocabulary and boundary mapping. Becomes an ADR in step 4.    |
| `docs/architecture/migration-kit/adrs/package-extraction-boundaries.md`       | When code earns a workspace package. Becomes an ADR in step 5.              |
| `.claude/skills/coding-standards/`                                            | The rule files agents load while coding                                     |
| `packages/eslint-config/next.js`                                              | Rule wiring and severity gating                                             |
| `packages/eslint-config/local-rules/`                                         | The custom ESLint rules                                                     |
| `apps/web/src/server/errors/`                                                 | Domain errors and boundary helpers. Created in step 3.                      |
| `apps/web/src/server/trpc/trpc.ts`                                            | tRPC init, procedures, error middleware                                     |

## How to read this document

Every statement falls into one of three classes:

- **Invariant**: holds in any project adopting this architecture. Unmarked statements are invariants.
- **If present**: applies only when the project has the underlying mechanism (marked `[if present]`).
- **Faster Fixes-specific**: holds here for local reasons and is not part of the exported architecture (marked `[Faster Fixes]`).

**Status.** This is the end state, not the current state of `apps/web`. Steps 1 and 2 of the kit have run: `src/app/_domains/` holds the domain-bound code behind a per-domain `index.ts`, and the root `_components/`, `_providers/` and `_constants/` folders hold the domain-agnostic code. Steps 3 to 5 have not run: the per-scope `_services/` folders and `src/server/errors/` do not exist yet, domains keep their pre-migration internal layout (`_utils/`, `*.trpc.query.ts`, `*.trpc.mutation.ts`), and `src/server/**` still holds domain logic. New code follows this document; inside a scope that has not been migrated, follow the folder's existing conventions and do not mix the two. `docs/_migration/README.md` tracks what is migrated and what is not.

The frontend and code-shape conventions (React components, `matchQueryStatus`, forms, Tailwind, TypeScript style, file size) are **not** repeated here. They live in the `coding-standards` skill, which is copied alongside this document. This document covers structure, layers, boundaries, and enforcement.

## Vocabulary

These words have one precise meaning each. Two of them (**feature** and **service**) change meaning compared with the pre-refactor architecture, so a project migrating must stop using the old meanings before the new ones can be read unambiguously.

| Term                   | Meaning                                                                                                                                                                  | Old meaning (retired)                                                       |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| **Scope**              | A folder that owns a bucket set: either a domain folder or a route segment.                                                                                              | n/a                                                                         |
| **Domain**             | A folder under `src/app/_domains/<name>/`, named after a canonical term of the project glossary, with a public barrel `index.ts`. Reusable across routes.                | The root `_features/<name>/` folder, whose children were really domains.    |
| **Route tier**         | A route segment under `src/app/` (route groups included). It composes domains and owns route-bound code with the same buckets as a domain.                               | n/a                                                                         |
| **Feature**            | A capability slice under `<scope>/_features/<name>/`: client or server UI tied to one capability, plus its container hooks. Never nested. **No data access lives here.** | A folder holding UI _and_ its tRPC procedures, queries, schemas, and types. |
| **Service**            | One data or IO function in `<scope>/_services/<verb>-<entity>.ts`, named after its export, transport-agnostic.                                                           | Loosely, any server file.                                                   |
| **Helper**             | A pure behavioral function in `<scope>/_helpers/`: no IO, no JSX, no React state, no schema.                                                                             | `_utils/`, which also held IO files, schemas, hooks, routers.               |
| **Type**               | A hand-written, isomorphic shared type in `<scope>/_types/`. Service-derived types stay in their service file.                                                           | `*.types.ts` files scattered in features.                                   |
| **Component**          | Pure UI bound to a scope, one file, in a flat `<scope>/_components/`.                                                                                                    | Same, but often wrapped in per-component folders.                           |
| **Barrel**             | A domain's `index.ts`. The only path another domain may import from. Exports contracts, never server implementations.                                                    | n/a                                                                         |
| **Transport boundary** | A place where the app's process meets the outside: a tRPC procedure, a route handler, a React Server Component, an Inngest job. Each maps domain errors exactly once.    | n/a                                                                         |
| **Domain error**       | A `DomainError` subclass thrown by a service for an expected business failure. Its message is final user-facing copy.                                                    | `TRPCError` thrown from procedures, or bare `Error`.                        |
| **Read / write**       | A service is a read iff it performs no writes. Reads use a closed verb set; writes use an open one.                                                                      | n/a                                                                         |

## Repository layout

The repo is a pnpm + Turborepo monorepo. Only the shape matters here.

```
apps/
  web/            # the Next.js app this document describes
packages/
  database/       # @workspace/db: Prisma schema, migrations, generated client
  ui/             # @workspace/ui: domain-agnostic design-system primitives
  eslint-config/  # @workspace/eslint-config: shared configs + local-rules/
  typescript-config/
  widget-core/    # [Faster Fixes] @fasterfixes/core: published widget runtime
  widget-react/   # [Faster Fixes] @fasterfixes/react: published React bindings
  mcp/            # [Faster Fixes] @fasterfixes/mcp: published MCP server
  <domain-pkg>/   # [if present] packages that 2+ apps consume, see "Packages"
```

### `apps/web/src`

| Path                                                                    | Purpose                                                                                                                                        |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/`                                                                  | The Next.js App Router tree **and** the home of all application code. Domains live inside it.                                                  |
| `app/_domains/`                                                         | All domain-bound code, one folder per domain.                                                                                                  |
| `app/_components/`, `app/_hooks/`, `app/_providers/`, `app/_constants/` | Domain-**agnostic** UI, hooks, providers, constants. Candidates for extraction into packages, so they must carry no domain knowledge.          |
| `app/(group)/...`, `app/admin/`, `app/api/`                             | The route tier: the composition layer.                                                                                                         |
| `server/`                                                               | Cross-cutting **infrastructure only**: `trpc/`, `errors/`, `auth/`, `inngest/`, `cache/`, thin SDK adapters (`stripe/`, ...). No domain logic. |
| `lib/`                                                                  | Infra **adapters** with a client or provider flavour: `trpc/` (client, provider), `mailer/`, `auth/` (client), `routing/`.                     |
| `utils/`                                                                | Domain-agnostic pure utilities grouped by kind (`dates/`, `string/`, `url/`, `tanstack-query/` with `match-query-status.ts`, ...).             |
| `config/`, `types/`, `styles/`                                          | Feature flags and static config, global TS types, global CSS.                                                                                  |
| `content/`                                                              | `[if present]` MDX or static content sources.                                                                                                  |

Everything domain-bound lives under `app/_domains/` or inside a route. Nothing domain-bound lives at `src/` root folders.

## Two tiers, one bucket set

`src/app/` has two tiers with the **same** structure:

- **Domain tier**: `src/app/_domains/<domain>/`, reusable across routes, scoped to a glossary entity.
- **Route tier**: `src/app/<route segment>/`, bound to one route.

Each scope owns these buckets and nothing else:

```
trpc-router.ts   thin tRPC transport at the scope ROOT (not a bucket, one per scope, optional)
_services/       data/IO layer: verb-prefixed reads and writes, IO-predicates, *.schema.ts, *.inngest.ts
_helpers/        pure behavioral functions only
_types/          standalone shared isomorphic types
_features/       capability slices (UI + container hooks), never nested
_components/     pure UI bound to this scope, flat
index.ts         (domains only) the public barrel
```

Rules that follow:

- **Lazy buckets.** `_services/`, `_helpers/`, `_types/` exist only when real code of that kind exists. No empty skeletons.
- **No other `_*` folders in a scope.** No `_queries/`, `_server/`, `_utils/`, `_trpc/`, `_sections/`, `_hooks/` inside a domain or route. Hooks live in their owning feature.
- **`_components/` is flat.** One file per component. Variants, skeletons, and compound pieces are siblings. The only allowed subfolders are sub-libraries: coherent categories grouping many distinct components.
- **Structure grows on demand.** A feature is flat until roughly three files of one species accumulate; then they collapse into a `_`-prefixed subfolder inside the feature. Never a feature inside a feature (lint-enforced).
- **Root `_*` folders are domain-agnostic.** Anything carrying domain knowledge cannot live in `app/_components/`, `app/_hooks/`, `app/_providers/`, `app/_constants/`.

### Domain versus route: disambiguation

1. Domain-bound or domain-agnostic? Agnostic goes to a root `_*` folder. Bound continues.
2. Reusable across routes, or operates on a domain entity? Then `_domains/<x>/`. Bound to one route's own job (composition, layout, page orchestration)? Then the route.
3. Which bucket? IO or a Zod schema goes to `_services/`. A pure function goes to `_helpers/`. A standalone shared type goes to `_types/`. UI tied to a capability or its hook goes to `_features/`. Pure UI goes to `_components/`. tRPC procedures inline into the scope-root `trpc-router.ts`.
4. A data operation goes to `_services/` even when single-use. A **feature** is promoted to the domain on its second route consumer.

### Promotion rule

When a route feature gains a second consumer in a different route, **move the whole feature** to `_domains/<x>/_features/`. Do not extract a shared subset. The original location becomes an import. Export from the barrel only if another domain needs it.

## The services layer

`_services/` is the data/IO layer of a scope. Authority: `docs/architecture/migration-kit/adrs/server-file-conventions.md`.

- **Plain-named after the export, with a verb prefix.** `get-user.ts` exports `getUser`. No role suffixes (`*.server.query.ts`, `*.trpc.mutation.ts` are gone).
- **All data operations live here, even single-use.** Clutter is controlled by route-tree granularity (each segment owns its own `_services/` and router) and, secondarily, by subfolders when three or more files cluster.
- **Reads use a closed verb set**: `get-` (one), `list-` (collections, single entrypoint with an options object), `find-` (nullable lookup), `search-`, `has-` / `is-` (IO-predicates), `count-`. A computed read (a feasibility check, a preview) is still a read: `get-` plus the **result noun** (`get-session-feasibility`), never a process verb (`evaluate-`, `compute-`, `resolve-`).
- **Writes use an open verb set.** Generic CRUD by default (`create-`, `update-`, `delete-`, `upsert-`, `send-`); a precise domain verb (`archive-`, `publish-`, `book-`) when the operation is a distinct domain transition. A write verb never collides with a read verb. Synonyms of `update` (`edit-`, `modify-`, `save-`, `change-`) are banned. `handle-` is reserved for event and webhook orchestrations.
- **A file is a read iff it performs no writes.** The folder sets the layer, the verb sets the direction.
- **Transport-agnostic.** A service never imports tRPC. It is callable from a procedure, an Inngest job, a route handler, or a server component without an HTTP round-trip.
- **The service return type is the type source of truth.** Each read exports `export type GetX = Awaited<ReturnType<typeof getX>>`. `inferProcedureOutput` is never the canonical output type.
- **Per-use-case named reads, not one polymorphic read.** Shared `select` fragments factor the column lists. The same `get-user.ts` may exist in two scopes; the folder disambiguates. Add a `-for-<shape>` qualifier only when two shapes of one read coexist in the same `_services/`.
- **Schemas live in `_services/` as `*.schema.ts`** and must stay pure Zod: no `@/server/` import, no Prisma client, no sibling non-schema service. Generated Prisma enums are allowed via `z.enum(PrismaEnum)`. One schema per file unless tightly coupled. Name: PascalCase `XSchema`, type `XInput` (`z.infer`), plus `XValues` (`z.input`) only when defaults or coercions make input and output diverge.
- **Helpers versus services.** Pure logic is a helper. Predicates split by IO, not by verb: `isSubscriptionActive(sub)` is a helper, `hasActiveSubscription(userId)` is a service. A pure predicate never fetches its own data.
- **External SDKs follow the domain decision, not the dependency.** Thin domain-agnostic adapters live in `src/server/<lib>/`. Domain logic that happens to call an SDK stays in the domain's `_services/`. Test: if the provider were swapped, would this file's reason to exist change? Yes means domain service.
- **Side-effecting orchestrations.** Inngest jobs are `*.inngest.ts` in `_services/`. Senders on a write path (`notify-*`, `send-*`) are write services; thin adapter calls with no domain decision stay in `src/lib/`.
- **Dependency injection for testability.** A service that receives its dependencies (`prisma`, a root path) as trailing parameters with defaults is testable with fakes. Prefer this over reaching for singletons when the logic is worth testing.

## tRPC: thin transport at the scope root

- `trpc-router.ts` sits at the scope root, sibling of `_services/`, colocated with `page.tsx` for a route. It is the only tRPC file in a scope.
- **Procedures are inlined and thin**: auth procedure, Zod `.input()`, one service call. A fat procedure is a smell; push the logic into the service.
- **Transport-policy guards stay in the procedure.** Authentication, authorization asserts, rate limits, and anything whose failure has no domain-error equivalent (a `TOO_MANY_REQUESTS`) belong to the transport, not the service. The counts or facts they need come from a read service.
- **Routers compose hierarchically following the route tree.** A route-group router mounts its child segment routers. The app router mounts domain routers and route-group routers side by side. No god-router importing dozens of operations.
- **tRPC is the API layer.** There is no parallel hand-rolled fetcher, query-options, or hook layer. tRPC generates those from the procedure.

```ts
// src/server/trpc/routers/_app.ts (shape)
export const appRouter = router({
  public: publicRouter, // src/app/(public)/trpc-router.ts, mounts its segments
  authenticated: authenticatedRouter, // src/app/(authenticated)/trpc-router.ts
  listings: listingsRouter, // src/app/_domains/listing/trpc-router.ts
  admin: adminRouter, // src/app/admin/trpc-router.ts
});
```

## Client and server boundary

- A `'use client'` module is named `*.client.tsx`. Exceptions: `use-*.ts` hooks and Next special files (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`). Server components are `*.server.tsx` or plain `.tsx` when the distinction does not matter.
- A client module **never imports from a `_services/` path**, except `*.schema.ts` and type-only imports (`import type`), which TypeScript erases. Runtime data comes through a tRPC hook or a server component.
- A module-level `'use server'` lives only in `*.server.action.ts`, because it turns every export into a public endpoint.
- Container hooks (`use-*.ts`) own form state, mutation, optimistic update, toast, and invalidation. They live in their owning feature. A trivial single `useQuery` stays inline.
- Named exports only inside domains. No default exports outside Next special files.

## Domain errors and transport mapping

Authority: `docs/architecture/migration-kit/adrs/domain-errors-and-transport-mapping.md`. Expected failures are domain facts, not transport facts, and there is exactly one vocabulary for them.

### The vocabulary

`src/server/errors/domain-errors.ts` is a zero-import module:

```ts
export type DomainErrorCode =
  | "NOT_FOUND"
  | "CONFLICT"
  | "BAD_REQUEST"
  | "FORBIDDEN"
  | "PRECONDITION_FAILED";

export abstract class DomainError extends Error {
  abstract readonly code: DomainErrorCode;
}
export class NotFoundError extends DomainError {
  readonly code = "NOT_FOUND" as const;
}
export class ConflictError extends DomainError {
  readonly code = "CONFLICT" as const;
}
export class BadRequestError extends DomainError {
  readonly code = "BAD_REQUEST" as const;
}
export class ForbiddenError extends DomainError {
  readonly code = "FORBIDDEN" as const;
}
export class PreconditionFailedError extends DomainError {
  readonly code = "PRECONDITION_FAILED" as const;
}
```

- Codes mirror tRPC's code strings and map 1:1 to HTTP statuses (404, 409, 400, 403, 412), so every boundary mapping is a pass-through.
- The set is closed at five. A sixth kind requires amending the ADR.
- Services throw a subclass for expected failures, never bare `Error`, never `TRPCError`. The message is final user-facing copy. Anything else escaping a service is a bug.
- `UNAUTHORIZED` is deliberately absent: identity is established at the transport edge before a service runs. `ForbiddenError` covers permission facts.

### Boundaries, each mapping exactly once

| Boundary                             | Mapping                                                                                                                                                                                    |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| tRPC                                 | One middleware on the base procedure rethrows a `DomainError` cause as `TRPCError({ code, message, cause })`. Every derived procedure inherits it. Procedures never try/catch for mapping. |
| Route handlers                       | `domainErrorResponse(error)` returns a `Response` with the 1:1 status, or `null` so the caller keeps its 500 path.                                                                         |
| React Server Components              | Preferred: a `find-` service returns null and the page calls `notFound()`. Fallback: `.catch(interruptOnDomainError)` maps `NOT_FOUND` to `notFound()` and `FORBIDDEN` to `forbidden()`.   |
| Inngest `[if present]`               | `rethrowDomainErrorsAsNonRetriable` wraps a `DomainError` in `NonRetriableError`. Business rejections never succeed on retry.                                                              |
| Server actions `[if present]`        | The action client's error handler gains a `DomainError` branch returning `{ message, code }`.                                                                                              |
| Authorization library `[if present]` | Denials throw `ForbiddenError` (403), not 401.                                                                                                                                             |

### Unexpected errors: mask and log

The tRPC `errorFormatter` replaces the message of any `INTERNAL_SERVER_ERROR` with generic copy and exposes `data.zodError` for `BAD_REQUEST` with a `ZodError` cause. Every masking point logs the original error with its `cause` chain. Masking is only safe once no legitimate user copy travels through the 500 channel, which is why the vocabulary lands first.

### Client display channels

Client code never imports `src/server/errors/*` and never uses `instanceof DomainError` (it does not survive serialization). It branches on `error.data.code`.

- **Mutations**: toast the message.
- **Queries**: the `Errored` branch of `matchQueryStatus`.
- **Invalid input**: Zod field errors on the form, never a toast.
- **Render crashes and interrupts**: route boundaries `error.tsx`, `global-error.tsx`, `not-found.tsx`, `forbidden.tsx`, `unauthorized.tsx`, all rendering one shared error screen component and never `error.message`.

## Cross-domain imports and the barrel

- A domain's `index.ts` is its public API. Another domain may import **only** `@/app/_domains/<x>`, never a deeper path (lint-enforced, always on).
- The barrel exports **contracts**: UI components, `*.schema.ts`, domain types, parsers, pure helpers, and type-only re-exports from `_services/`. It never exports a service function or the router.
- Routes and `app/api/` are the composition layer and may reach into a domain's internals.
- If a domain seems to need another domain's server implementation, one of three moves applies: wrap the data in a server component and export that; move the operation to the domain that owns it; lift the abstraction to `src/server/` or a package so both depend on it. A second "server barrel" is not an option.
- No cross-domain cycles. Soft hierarchy: low-level domains (`user`, `organization`) should not depend on high-level ones (`subscription`, `feedback`).

## Packages

Authority: `docs/architecture/migration-kit/adrs/package-extraction-boundaries.md`, amended below.

- **A package exists to reuse code across consumers, not because it is generic.** The gate is "consumed by two or more apps, or by an external consumer" (see amendment). Create it when the second consumer appears, never speculatively.
- **Layered, acyclic.** Layer 0 foundations (`db`, `ui`) depend on no internal package. Layer 1 domain packages depend on layer 0. Layer 2 apps depend on anything.
- **`@workspace/ui` is domain-agnostic primitives only**, the package analogue of root `_components/`.
- **A domain package is named after the domain**, with subpath entry points separating server logic from client UI (`@workspace/<domain>/search`, `@workspace/<domain>/ui`).
- **Share query result types, not presentation DTOs.**
- **Amendment for published packages.** A package published to npm has an external consumer by definition, so it satisfies the reuse gate. Its internal structure follows its own conventions and is out of scope of the bucket architecture, which applies to `apps/` only. It must still respect the layering: it never imports an app.
- `[Faster Fixes]` The concrete extractions here are the three published packages: `@fasterfixes/core` (widget runtime), `@fasterfixes/react` (React bindings) and `@fasterfixes/mcp` (MCP server). All three qualify under the published-package amendment, and all three are consumed outside this repo. No internal domain package exists yet.

## Cache tags `[if present]`

Only relevant when the app uses `unstable_cache` or tag-based revalidation.

- A central, typed registry (`src/server/cache/cache-tags.ts`) composes per-page tag shapes declared next to the page's services or helpers. Every leaf is a callable `CacheTag` with a `.base` string and a scoped form.
- Every `unstable_cache` call carries tags from the registry (non-negotiable). Cached reads live in `_services/` as a private cached function wrapped by an exported `getX` that rehydrates non-serializable values.
- Writes call `revalidateCacheTags(tag)` after committing.

## Enforcement

The architecture holds because it is enforced, not because it is documented.

### Commands and required checks

| Command                 | What it runs                                                                                                                                                                                                     |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm typecheck`        | `tsc --noEmit` in every workspace                                                                                                                                                                                |
| `pnpm lint`             | ESLint with `--max-warnings 0`, always-on rules only                                                                                                                                                             |
| `pnpm lint:agent-rules` | Same, with `ESLINT_AGENT_RULES=1`, enabling the convention rules. `[Faster Fixes]` It drops `--max-warnings 0` until the end of step 4: zero errors required, warnings counted per rule as the burn-down metric. |
| `pnpm test`             | Vitest in every workspace                                                                                                                                                                                        |

The pre-commit hook runs typecheck, tests, and lint-staged. An agent never declares work done while any required check fails.

### Custom ESLint rules

Rules live in `packages/eslint-config/local-rules/` and are wired in `packages/eslint-config/next.js` under the `local/` plugin namespace. Most are gated behind `ESLINT_AGENT_RULES=1` so the plain `pnpm lint` stays fast and stable while agents get the full set. A few are always on because their violation is a security or correctness problem, not a style one.

| Rule                                | Scope                 | Enforces                                                                                                           | Gate   |
| ----------------------------------- | --------------------- | ------------------------------------------------------------------------------------------------------------------ | ------ |
| `services-verb-prefix`              | `**/_services/**`     | Basename is `<lowercase-verb>-<entity>`; bans `edit-`, `modify-`, `save-`, `change-`.                              | agent  |
| `services-no-trpc-import`           | `**/_services/**`     | A service never imports the tRPC server or client modules.                                                         | agent  |
| `require-trpc-output-type`          | `**/_services/**`     | A read service exports `Awaited<ReturnType<typeof x>>` as its type. Tests exempt.                                  | agent  |
| `services-no-bare-error`            | `**/_services/**`     | No `throw new Error(...)`; throw a `DomainError` subclass. Rethrowing a caught variable is allowed.                | always |
| `no-client-import-of-services`      | all                   | A `'use client'` or `*.client.tsx` module never imports `_services/*`, except `*.schema.ts` and type-only imports. | agent  |
| `no-client-import-of-server-errors` | all                   | Client code never imports `src/server/errors/*`.                                                                   | agent  |
| `no-feature-nesting`                | `**/_features/**`     | A path never contains `_features/` twice.                                                                          | agent  |
| `schema-must-be-pure-zod`           | `**/*.schema.ts`      | No `@/server/`, no Prisma client, no non-schema sibling import. Generated enums allowed.                           | agent  |
| `require-schema-conventions`        | `**/*.schema.ts`      | PascalCase `XSchema` const, singular `Input` type suffix.                                                          | agent  |
| `no-cross-domain-deep-import`       | `src/app/_domains/**` | Another domain is imported only via its barrel.                                                                    | always |
| `no-default-export`                 | `src/app/_domains/**` | Named exports only.                                                                                                | agent  |
| `require-use-client-suffix`         | `src/**`              | A `'use client'` module is `*.client.tsx`; exempts `use-*` hooks and Next special files.                           | agent  |
| `require-server-action-suffix`      | all                   | A module-level `'use server'` only in `*.server.action.ts`.                                                        | always |
| `no-throw-literal` (built-in)       | all                   | Throw `Error` instances only.                                                                                      | always |
| `no-raw-tailwind-colors`            | all                   | `[optional]` Semantic color tokens over raw palette classes. Only useful with a token-based design system.         | agent  |

Fourteen custom rules, exported by `packages/eslint-config/local-rules/index.js`, plus the built-in `no-throw-literal`. Each custom rule has a `RuleTester` test beside it, run by `pnpm test`.

`require-use-client-suffix` runs on all of `src/**`, wider than the domain tier: the `.client.tsx` naming applies wherever a `'use client'` file lives, and a naming convention that holds in one folder only is half a convention.

### Severity ramp during a migration

A rule that cannot yet pass everywhere is introduced at `warn`, then locked to `error` per scope as each scope is migrated (an allowlist of migrated scopes in the ESLint config), and finally collapsed to plain `error` with the allowlist deleted. A rule whose violation surface is empty when it lands goes straight to `error`.

### The `coding-standards` skill

`.claude/skills/coding-standards/SKILL.md` is a router: a table from "what you are about to do" to the rule file to read. Rule files under `rules/`: `architecture.md`, `backend.md`, `naming.md`, `schemas.md`, `frontend.md`, `errors.md`, `typescript.md`, `testing.md`, `code-shape.md`. The repo's `AGENTS.md` points every agent to this skill before writing code. When a convention changes, the rule file changes, then the lint rule if one exists.

## Testing

- Vitest, colocated `*.test.ts` next to the unit, one test file per unit.
- Test only pure `_helpers/` and dependency-injected `_services/`. Components, hooks, and routers are out of scope until a real need appears.
- No module mocks. Inject fakes through parameters. If logic worth testing is trapped behind a singleton, extract it down into a helper or an injectable service.

`[Faster Fixes]` The harness matches that policy and nothing more. `apps/web/vitest.config.ts` runs `environment: "node"`, resolves the `@/*` alias through Vite's native tsconfig path resolution, pins `TZ` to `UTC` so date assertions hold on every machine, and loads no setup file. There is no jsdom and no `@testing-library/*`: they are added the day the first component test exists, not before, so the installed harness and the documented policy stay in agreement. `apps/web/src/utils/crypto/token-cipher.test.ts` is the reference test. The custom ESLint rules have their own Vitest project in `packages/eslint-config`; both run under `pnpm test` through Turbo.

## Faster Fixes-specific, not exported

These statements hold in this repo and are **not** part of the exported architecture. A project adopting the architecture decides each one for itself.

- **Inngest is present.** Durable jobs live under `src/server/inngest/`, so the Inngest boundary row of the mapping table and the `*.inngest.ts` service convention are live here rather than `[if present]`.
- **No authorization library.** There is no Kilpi and no policy layer. Authorization is asserted in the tRPC procedure; a denial becomes a `ForbiddenError` (403) once the vocabulary lands in step 4.
- **No `next-safe-action`.** There is no action client, so the server-action row of the mapping table has no implementation here. `require-server-action-suffix` still runs as an always-on error, so a module-level `'use server'` cannot appear under an unmarked filename.
- **No cache tags.** The app uses no `unstable_cache` and no tag-based revalidation, so the "Cache tags" section is inert and `src/server/cache/` does not exist.
- **English user-facing copy**, professional and understated, no exclamation marks, no em dash character. Identifiers, comments, filenames and schemas are English too.
- **`no-throw-literal` is on as an error** outside the agent gate, so only `Error` instances are thrown anywhere in the repo.
- **Three published npm packages** under `packages/`: `@fasterfixes/core`, `@fasterfixes/react`, `@fasterfixes/mcp`. They are released from `main` by CI through Changesets, and their internal structure follows their own conventions: the bucket architecture applies to `apps/` only.

## Rules

- Two tiers, one bucket set. Nothing else inside a scope.
- Every data operation is a verb-prefixed service in `_services/`. Reads are a closed verb set, writes an open one.
- Services never import tRPC and never throw anything but `DomainError` subclasses for expected failures.
- `trpc-router.ts` is thin transport at the scope root, composing hierarchically.
- Domains talk to each other through `index.ts` only, and the barrel exports contracts, never implementations.
- Root `_*` folders and `@workspace/ui` are domain-agnostic.
- A package exists for a second consumer, never for purity.
- A convention exists as a lint rule when it can be statically decided; the rule file explains it, the lint enforces it.
