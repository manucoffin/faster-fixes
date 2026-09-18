# Architecture: app folder structure

Where code goes in `apps/web/src/app/`. Authority: `docs/adr/0010-app-folder-architecture.md` and `docs/architecture/migration-kit/adrs/server-file-conventions.md`. The data/IO layer itself is specified in [backend.md](backend.md).

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

**Anything at root `_*` is domain-agnostic.** It must not carry domain knowledge — those folders are slated for extraction into shared packages. Domain-bound code lives under `_domains/` or inside a route.

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
- `_helpers/` is **pure** (no IO, no JSX, no React state). `_services/` is the only place IO lives outside a feature.
- `trpc-router.ts` sits at the scope **root**, never inside `_services/` (services must not import tRPC).

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

**No other `_*` folders at the route level.** No `_queries/`, `_sections/`, `_hooks/`, `_server/`, `_utils/`.

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
- The barrel exports **contracts** (UI components, `*.schema.ts`, domain types, type-only re-exports from `_services/`), **never** service functions or the router.
- **Other domains** import from `@/app/_domains/<x>` only — never `@/app/_domains/<x>/_services/...`.
- **Routes** and **`app/api/`** are the composition layer and may reach into domain internals. `src/server/**` reaches in too today; those imports are inverted and step 3 resolves them by moving the code into its domain.
- **Every domain barrel is empty today** (`export {}`): no domain imports another yet. Add an export when a real cross-domain import needs it, rather than publishing a surface no caller asked for.
- **No domain cycles.** Soft hierarchy hint (not lint-enforced): low-level domains (`user`, `auth`) should not depend on high-level ones (`subscription`, `feedback`).

## Promotion rule

When a **route feature** acquires a second consumer in a different route, **move** it to `_domains/<x>/_features/`. Don't extract a subset — move the whole feature, let the original become an import, then export from `index.ts` if another domain needs it.

## Key principles

1. **Underscore prefixes** are implementation folders and don't create routes.
2. **Two tiers, same buckets** — one mental model at domain or route.
3. **Domain entities drive `_domains/` naming** (match `CONTEXT.md`).
4. **Co-locate UI aggressively; centralize data ops in `_services/`.**
5. **`_helpers/` is pure; `_services/` owns all IO.**
6. **Domain encapsulation via `index.ts`.** No reach-ins across domains.
