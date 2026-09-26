# Step 2: Domain folders

> End state: all domain-bound code lives under `src/app/_domains/<domain>/`, each domain has a public barrel, other domains import only through it, `_components/` folders are flat, and root `_*` folders are domain-agnostic. The inside of each domain (its `_trpc/`, `_queries/`, `*.trpc.query.ts` files) is **not** touched in this step.

Authority: `adrs/app-folder-architecture.md` (commit it into the project's ADR folder as part of this step).

## Prerequisites

- Step 1 done.
- The project glossary (its `CONTEXT.md` or ubiquitous-language doc) lists every domain entity. **Domain folder names come from the glossary**, not from the existing feature folder names or from routes. If a feature folder has no glossary term, either the glossary is missing a term (add it) or the folder is not a domain (it is a route feature, or a domain-agnostic component).

## Target state

### Root layout

```
src/app/
├── layout.tsx
├── _components/   # domain-agnostic UI primitives only
├── _hooks/        # domain-agnostic hooks only
├── _providers/    # domain-agnostic providers only
├── _constants/    # domain-agnostic constants only
├── _domains/      # ALL domain-bound code
│   ├── <domain-a>/
│   ├── <domain-b>/
│   └── ...
├── (public)/      # route groups: the composition layer
├── (authenticated)/
├── admin/
└── api/
```

- There is no `src/app/_features/` at the root anymore. The word "feature" now means a capability slice inside a scope.
- There is no `src/domains/`, `src/features/`, or `src/modules/` outside `app/`. Domains live inside the App Router tree.
- Every folder directly under `_domains/` is named after one glossary term, singular, kebab-case (`listing`, `professional`, `conversation`).

### Domain shape after this step

```
_domains/<domain>/
├── index.ts          # NEW: public barrel
├── _components/      # flattened if it existed (see below)
└── <whatever the old feature folder contained, unchanged>
```

The inner structure (old `_trpc/`, `_queries/`, `_utils/`, `*.trpc.query.ts`, `*.schema.ts`) is moved as-is. Step 3 reshapes it. Do not rename inner files in this step.

### The barrel

Each domain has an `index.ts`. In this step it exports what other domains **currently** import from this domain, nothing more. This is a discovery exercise: fixing every `no-cross-domain-deep-import` error by adding an export is the mechanical way to find the surface.

Rules for what goes in the barrel:

- Exported: UI components, Zod schemas, domain types, parsers, pure helpers, type-only re-exports of server modules.
- Never exported: query or mutation functions, tRPC routers or procedures, server-only modules.
- If fixing a deep import would require exporting a server implementation, the import is a design problem, not a barrel problem. Resolve it with one of: wrap the data in a server component and export the component; move the operation to the domain that actually owns it; lift the abstraction to `src/server/` or a package. Record the choice in the migration log.

### Cross-domain imports

- A file under `_domains/<a>/` imports from `_domains/<b>/` only as `@/app/_domains/<b>`.
- Files under routes and `app/api/` may still import domain internals. They are the composition layer.
- No cycles between domains. When a cycle appears while fixing imports, the lower-level domain is the one that stops importing the higher-level one.

### Flat `_components/`

Inside every scope (domain or route), `_components/` contains files, not one folder per component:

```
# before                                   # after
_components/                               _components/
├── user-card/                             ├── user-card.client.tsx
│   ├── user-card.client.tsx               ├── user-card-skeleton.tsx
│   └── user-card-skeleton.tsx             └── user-avatar.tsx
└── user-avatar/
    └── user-avatar.tsx
```

The only subfolders allowed are sub-libraries: coherent categories grouping many distinct components (`_components/icons/`, `_components/sections/`). Those are flat inside.

### Root `_*` folders

Anything under root `_components/`, `_hooks/`, `_providers/`, `_constants/` that carries domain knowledge (formats a domain entity, imports Prisma enums for a domain, encodes product rules) moves to the owning domain's matching bucket. What remains is extractable into a UI or React-utilities package without dragging the domain along.

## What must be gone

| Pattern                       | Check                                                                                          |
| ----------------------------- | ---------------------------------------------------------------------------------------------- |
| Root `src/app/_features/`     | `test ! -d apps/web/src/app/_features`                                                         |
| Imports of the old root       | `grep -rn "app/_features/" apps/web/src` returns nothing                                       |
| Per-component wrapper folders | `find apps/web/src/app -path "*/_components/*/*" -name "*.tsx"` returns only sub-library files |
| Deep cross-domain imports     | `pnpm lint` passes with `local/no-cross-domain-deep-import` at `error`                         |
| Domain knowledge at root `_*` | reviewed by hand; the heuristic is "does this file import a domain type or enum?"              |

## Recommended strategy

Do it as one mechanical move per domain: `git mv` the folder, rewrite the import paths with a codemod or a global replace, add the barrel, run lint, fix deep imports by exporting contracts. Commit per domain. Flatten `_components/` in a separate commit per scope, since it rewrites imports across the repo. Keep step 3 out of it: if an inner file looks wrong, write it in the migration log and move on.

## Definition of done

- The shared definition of done from the kit README.
- `local/no-cross-domain-deep-import` is at `error`, always on, and passes.
- Every folder under `_domains/` matches a glossary term, and the glossary has been updated for any term that was missing.
- Every domain has an `index.ts` that exports no service function and no router.
- The ADR `app-folder-architecture.md` is committed in the project's `docs/adr/` with its own number.
- `pnpm lint:agent-rules` warning count for `no-default-export` and `require-use-client-suffix` is recorded (they now apply to `_domains/**`); fixing them is allowed but not required here.
