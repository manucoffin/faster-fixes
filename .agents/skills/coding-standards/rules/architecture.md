# Architecture: app folder structure

Where code goes in `apps/web/src/app/`. Authority: `docs/adr/0010-app-folder-architecture.md` and `docs/adr/0011-server-file-conventions.md`. The data/IO layer itself is specified in [backend.md](backend.md).

`apps/web/src/app/` is organised into **two tiers** with the **same bucket structure** at each tier:

- **Domain tier**: `src/app/_domains/<domain>/` — reusable, cross-route, scoped to a domain entity from `CONTEXT.md`.
- **Route tier**: `src/app/[route]/` — bound to a specific route.

Each scope (domain or route segment) uses the same buckets and nothing else:

```
trpc-router.ts   thin tRPC transport at the scope ROOT (not a bucket; one per scope)
_services/       data/IO layer: verb-prefixed reads, writes, IO-predicates, *.schema.ts, *.inngest.ts — transport-agnostic, lazy
_helpers/        pure behavioral functions only (formatters, labels, calculators, parsers, pure predicates) — no IO, no JSX, no state
_types/          standalone shared isomorphic domain types — lazy
_features/       capability slices (UI + container hooks; needs UI, a schema, or a service slice)
_components/     pure UI bound to this scope, no schema, no server
```

The server/data conventions (`_services/`, verb vocabulary, the root `trpc-router.ts`, schemas-in-services, helpers-vs-services) are in [backend.md](backend.md). This file covers placement and the bucket set.

## Root layout

```
src/app/
├── layout.tsx
├── _components/   # domain-agnostic UI primitives (future package)
│   ├── dashboard/ # sub-library: page shell, page header, breadcrumbs, period selector
│   ├── mdx/       # sub-library: the MDX component set
│   └── seo/       # sub-library: the JSON-LD emitters
├── _providers/    # domain-agnostic React providers (future package)
├── _constants/    # domain-agnostic constants (future package)
├── _domains/      # all domain-bound code, one folder per glossary term
│   ├── auth/
│   ├── feedback/
│   ├── integration/ # every external system, sub-structured by provider (ADR-0014)
│   ├── organization/
│   ├── project/
│   ├── subscription/
│   └── user/
├── (auth)/        # route groups
├── (authenticated)/
├── (public)/
├── admin/
└── api/
```

**Anything at root `_*` is domain-agnostic.** It must not carry domain knowledge — those folders are slated for extraction into shared packages. Domain-bound code lives under `_domains/` or inside a route. Enforced by the root-bucket row of `local/no-cross-layer-import`: root `_components/`, `_providers/` and `_constants/` may not import `@/app/_domains/**`.

Root `_components/` is **flat** apart from the three sub-libraries above, each flat inside and extractable into a package on its own. Root `_hooks/` is created with the first domain-agnostic hook, like every other lazy bucket.

Layout chrome bound to one route group stays at the route tier: the public header, mobile navigation, footer, launch banner and manage-consent button live in `(public)/_components/`, not at the root.

## Domain layout

```
_domains/animal/
├── index.ts          # public API: only this is importable from other domains
├── trpc-router.ts    # thin tRPC router for the domain (at the root)
├── _features/
│   ├── selector/
│   ├── health/
│   └── identity-form/
├── _components/      # pure UI bound to this domain
│   └── animal-avatar.client.tsx
├── _helpers/         # pure behavioral functions
│   ├── get-animal-age.ts
│   └── physical-activity-labels.ts
├── _types/           # standalone shared types (lazy)
└── _services/        # data/IO layer (lazy)
    ├── get-animal.ts
    ├── create-animal.ts
    └── animal.schema.ts
```

- Each domain folder is named after a canonical term in `CONTEXT.md`.
- `_services/`, `_helpers/`, `_types/` are created **lazily** — only when real shared code of that kind exists.
- `_helpers/` is **pure** (no IO, no JSX, no React state). `_services/` is the only place IO lives outside a feature. The import half is enforced by the helper row of `local/no-cross-layer-import`: a helper imports neither the database, nor `next`, nor `react`. "No JSX, no React state" follows from the `react` ban; five named response and request builders are exempt, listed in `layerImportRows`.
- **Database access lives in `_services/` or `src/server/`**, and the database package is reached through `@workspace/db`, `@workspace/db/types` and `@workspace/db/generated/prisma/enums`. Both are rows of `local/no-cross-layer-import` (ADR-0011, ADR-0013).
- Purity is about IO, not about import direction: a helper may import a shared error class from its scope's `_services/` root. `_helpers/linear/verify-webhook-signature.ts` imports `IntegrationConfigurationError` from `_services/integration-configuration-error.ts` rather than the bucket growing a second copy of the class.
- A Zod enum that is **domain vocabulary** rather than an operation input lives in `_types/`, not in `_services/` as a `*.schema.ts`. `_types/feedback-status.ts` exports `FeedbackStatusEnum` and `FeedbackStatus`: the DB column is free-form, so the enum is the only runtime validator, ten modules read it as vocabulary, and Zod is client-safe so the validator travels with the type it defines. Naming it `*.schema.ts` would force `FeedbackStatusInput` on a glossary type to satisfy a rule aimed at input schemas. See [schemas.md](schemas.md).
- `trpc-router.ts` sits at the scope **root**, never inside `_services/` (services must not import tRPC, enforced by `local/services-no-trpc-import`). A router itself imports no Prisma: that is a row of `local/no-cross-layer-import`.
- **Capability folders sit at the domain root, not under `_features/`.** Six live today: `auth/send-verification-email-button/`, `auth/stop-impersonate-button/`, `subscription/plan-card/`, `subscription/plan-gate/`, `subscription/upgrade-subscription/` and `project/active-project/`. This is an accepted deviation from ADR-0010 carried through the migration, not an oversight, and nothing lint-enforces it either way. The open decision is whether domains gain a `_features/` bucket or this becomes the documented shape; until it is taken, follow the existing tree rather than creating a domain `_features/` for a seventh. Route scopes are unaffected and keep `_features/`.
- **A hook read by more than one feature in the same scope is promoted to a capability folder of its own** (`subscription/plan-gate/`, `inbox/_features/feedback-mutations/`), barrel-exported when the scope is a domain. A single-consumer hook moves inside the feature that consumes it. No `_hooks/` bucket is ever created inside a scope: a hook is a capability and a capability is a feature. This intra-scope trigger (a second _feature_ consumer) is distinct from the cross-route promotion rule below.

## Route layout

Same buckets, scoped to the route, with the router colocated next to `page.tsx`:

```
(authenticated)/mon-compte/
├── page.tsx
├── layout.tsx
├── trpc-router.ts   # optional, when the route has procedures
├── _features/
│   └── account-sidebar/
├── _services/       # optional
├── _helpers/        # optional
└── _components/     # optional
```

**No other `_*` folders at the route level** (**prose only**, no rule). No `_queries/`, `_sections/`, `_hooks/`, `_server/`, `_utils/`. The bucket set is closed, but a rule enforcing it would have to name every folder a scope may hold, and a new bucket is an architecture decision (an ADR amendment) rather than a lint report.

## Feature folder

`_features/` exists only **inside a scope**, a domain or a route segment: a feature is a capability slice, never a top-level grouping. A feature folder co-locates the UI for one capability plus its container hooks. Data ops do **not** live here — they live in the scope's `_services/`. Files are named after the operation/component:

```
_features/health/
├── animal-health-form-fields.client.tsx
├── animal-health-infos.client.tsx
└── use-animal-health-form.ts        # container hook (state + mutation + toast)
```

A folder qualifies as a feature if **at least one** is true:

1. It has client UI tied to a capability (`*.client.tsx`).
2. It owns a capability's container hook (`use-*.ts`).
3. It is the UI surface of a service slice in the scope's `_services/`.

A folder that is only a presentational component with no logic → `_components/`. **No feature nested in a feature** — a grown child promotes to a sibling.

**One grouping level, and a single-file feature needs no folder.** Enforced by `local/no-feature-nesting`:

- A file sits at most at `_features/<area>/<capability>/`: two non-underscore folder segments before the file. Several related capabilities may share an area folder (`(authenticated)/_features/sidebar/organization/`, `settings/_features/jira/link-project/`); a third capability folder is a lint error. Flatten it, or promote the inner capability to a sibling feature.
- A feature that is one file sits directly in the features folder, `_features/<name>.client.tsx`. Give it a folder when it has a second file.
- Underscore-prefixed folders are buckets, not capabilities: they are free and do not count toward the depth. A second `_features/` segment anywhere in the path is a nested feature and is reported.

## File naming conventions

| Item             | Pattern                    | Example                                    |
| ---------------- | -------------------------- | ------------------------------------------ |
| Client component | `[name].client.tsx`        | `profile-form.client.tsx`                  |
| Server component | `[name].server.tsx`        | `header.server.tsx`                        |
| Hook             | `use-[name].ts`            | `use-animal-health-form.ts` (no `.client`) |
| Service (read)   | `[read-verb]-[entity].ts`  | `get-animal.ts`, `list-animals.ts`         |
| Service (write)  | `[write-verb]-[entity].ts` | `create-animal.ts`, `update-animal.ts`     |
| Schema           | `[name].schema.ts`         | `animal.schema.ts` (inside `_services/`)   |
| Helper           | `[verb]-[noun].ts`         | `get-animal-age.ts`, `format-date.ts`      |
| tRPC router      | `trpc-router.ts`           | at the scope root                          |

See [naming.md](naming.md) for the full read/write verb vocabulary.

Three rows of that table are enforced: the client component suffix by `local/require-use-client-suffix`, the two service rows by `local/services-verb-prefix` (the verb, and the exported function named after the file), and the schema name inside a `*.schema.ts` by `local/require-schema-conventions`. The server component, hook, helper and router rows are **prose only**: `*.server.tsx` is the default rather than a marker, and a helper's `[verb]-[noun]` draws on the open verb set.

## Disambiguation rules

1. **Domain-bound or domain-agnostic?** Agnostic → root `_components/`/`_hooks/`/`_providers/`/`_constants/`. Bound → continue.
2. **Cross-route or route-bound?** Reusable across routes / operates on a domain entity → `_domains/<x>/`. Route-bound → `[route]/`.
3. **Which bucket?**
   - Does IO (Prisma/Stripe/network), or a Zod schema → `_services/`.
   - Pure function (no IO, no JSX) → `_helpers/`.
   - Standalone shared type → `_types/`.
   - UI tied to a capability or its hook → `_features/`.
   - Pure UI, no logic → `_components/`.
   - tRPC procedures → inline into the scope-root `trpc-router.ts`.
4. **Single- vs cross-consumer?** A data op goes to `_services/` regardless (even single-use). Promote a _feature_ to the domain on its second route consumer.

## Cross-domain import rules

- A domain's `index.ts` is its **public API**. Only paths it exports may be imported by another domain.
- The barrel exports **contracts** (UI components, `*.schema.ts`, domain types, type-only re-exports from `_services/`), **never** service functions or the router. Enforced by the barrel row of `local/no-cross-layer-import`, which judges runtime edges only so a type-only re-export of a service's output type stays free.
- **Other domains** import from `@/app/_domains/<x>` only — never `@/app/_domains/<x>/_services/...`. Enforced by `local/no-cross-domain-deep-import`. The barrel is addressed **by its alias**: a relative specifier landing in another domain is a violation at any depth, the barrel included (`../organization/index` fails), and `export … from` re-exports and dynamic `import()` are checked like static imports.
- **Routes** and **`app/api/`** are the composition layer and may reach into domain internals. `src/server/**` may not: an always-on `no-restricted-imports` block forbids a deep import from there into the app tree, so the server folder reads a domain through its barrel. Its exemptions are named file by file in `packages/eslint-config/next.js`.
- **A barrel exports only what a real cross-domain import asked for.** Live today: `feedback` exports the Feedback `Status` type and enum and the Diagnostic Trail line formatter, `organization` the Organization roles, `subscription` the Plan vocabulary and the plan gate hook. `auth`, `integration`, `project` and `user` are still `export {}`. Add an export when an import needs it, rather than publishing a surface no caller asked for.
- **A barrel may export a client hook and server-read vocabulary side by side.** `subscription/index.ts` exports `usePlanGate` (a `'use client'` hook) next to `PLAN_LIMITS`, which nine `src/server/**` files read, so each of those pulls the hook module into its graph. This is benign and stays: Next replaces a client module with a client reference, and vitest loads the graph without ever executing a hook. If the pull ever becomes expensive, **move the hook out of the domain root; do not split the barrel or reopen the one-public-API rule.**
- **No domain cycles.** Enforced by `src/app/_domains/domain-cycles.test.ts`, not by lint: a cycle is a property of the whole graph, so the check builds the graph from every import form under `_domains/` and fails `pnpm test` naming the domains in the cycle. The soft hierarchy hint stays prose only: low-level domains (`user`, `auth`) should not depend on high-level ones (`subscription`, `feedback`).

## Promotion rule

When a **route feature** acquires a second consumer in a different route, **move** it to `_domains/<x>/_features/`. Don't extract a subset — move the whole feature, let the original become an import, then export from `index.ts` if another domain needs it.

## Recorded placement exceptions

Each of these was argued and settled. They cut against a default stated elsewhere in this file, so they are written down rather than left to be "fixed" by the next reader.

- **Per-provider subfolders are a domain-tier convention, not a route-tier one.** Inside `_domains/integration/`, each bucket is sub-structured by provider (`_services/jira/`, `_helpers/linear/`) per ADR-0014, and a file shared by several providers sits at the bucket root. Inside a **route** scope, the provider is carried in the service **name** instead: `(project)/settings/_services/` holds 58 flat files (`get-project-github-link.ts`, `list-accessible-jira-projects.ts`, `link-slack-channel.ts`). Do not reorganise a route `_services/` into provider subfolders.
- **Two scopes may hold a service of the same name only when the contract is the same.** `get-user.ts` may exist twice and the folder disambiguates, but when the inputs and the returned shape differ the name differs too: the onboarding creator is `create-onboarding-project.ts`, not a second `create-project.ts`, because the sidebar operation of the same entity takes different inputs and returns a different shape.
- **`_components/dashboard/search-params.ts` stays in its sub-library.** The nuqs parsers are the period selector's URL contract; the root tier has no `_helpers/` bucket and inventing one for a single module would give it one inhabitant. Revisit only if a third consumer appears outside the sub-library. Known consequence, accepted and tracked rather than fixed: `admin/(dashboard)/_features/subscriptions-chart/subscriptions-chart.client.tsx` is a client component reaching a `/server` entrypoint through it (`nuqs/server`). No lint rule catches that shape.

## Key principles

1. **Underscore prefixes** are implementation folders and don't create routes. Which underscore folders exist is a closed set, kept **prose only** (see "Route layout").
2. **Two tiers, same buckets** — one mental model at domain or route.
3. **Domain entities drive `_domains/` naming** (match `CONTEXT.md`).
4. **Co-locate UI aggressively; centralize data ops in `_services/`.**
5. **`_helpers/` is pure; `_services/` owns all IO.**
6. **Domain encapsulation via `index.ts`.** No reach-ins across domains.
