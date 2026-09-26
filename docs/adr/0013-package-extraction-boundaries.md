# Package extraction boundaries: reuse-driven, layered, lazy

A monorepo invites moving code out of the app into workspace packages "because it is clean". That instinct produces packages with one consumer, capability-named packages that fragment a domain, and dependency cycles between packages. This ADR sets the rule for when code earns a package, how packages may depend on each other, and how published npm packages fit. The governing idea: **a package exists to serve a second consumer, not to look tidy.**

## Status in this repo

Accepted, committed 2026-09-19 with step 5b of the architecture migration. **Nothing was extracted**, and no package or manifest changed: the gate is a second consumer and there is none. The repo holds one app (`apps/web`) and seven packages, four of them internal tooling or data foundations and three published to npm. The graph below was read off the package manifests and the actual imports on the day it was written, and it is the state of the repo, not a target.

One naming note: the workspace alias of the database package here is `@workspace/db`, the internal packages use the `@workspace/*` scope, and the published ones use `@fasterfixes/*`.

## Decisions

- **A package exists to reuse code across consumers, not because it is generic.** Domain coupling inside a package is expected and fine in a single-product monorepo. The gate is "consumed by two or more apps, or by an external consumer", not "is this generic". This is the package-layer analogue of the lazy bucket rule of [ADR-0010](./0010-app-folder-architecture.md): create the package when a real second consumer appears, not speculatively.
- **Create lazily.** Until the second consumer exists the code stays in the app's domain folder, even when it looks package-shaped. Code that looks extractable and stays in the app is the expected steady state, not a debt.
- **Published npm packages satisfy the gate by definition.** An external consumer is a consumer. Their internal structure follows their own conventions; the bucket architecture of ADR-0010 and [ADR-0011](./0011-server-file-conventions.md) applies to `apps/` only. They obey the layering below like any other package.
- **Packages form a layered, acyclic dependency graph. No cycles, no upward import.**
  - Layer 0, foundations: the database client, pure resolution cores, and any published package that imports no other internal package.
  - Layer 1: packages that may depend on layer 0.
  - Layer 2: apps, which may depend on anything.
  - **A package never imports an app.** This is the one direction that is checked mechanically.
- **The UI package is domain-agnostic primitives only**, the package analogue of the root `_components/` rule. A component encoding product or domain meaning lives with its feature and graduates into a domain package only when two apps render it.
- **A domain package is named after the domain, not the capability**, with subpaths (`/search`, `/ui`) rather than sibling packages (`@workspace/<domain>-search`).
- **Server and client on separate subpath entry points** within a domain package, so a server consumer never pulls React.
- **Codes and identifiers are the contract between packages.** A package takes plain ids and codes as inputs rather than another package's types, so two packages at the same layer need not depend on each other.
- **Share query result types, not presentation DTOs.** Each consumer maps the package's inferred result type to its own presentation.
- **Small overlaps are accepted over premature packages.** A three-line predicate duplicated between the app and a package is cheaper than a package for one function.

## Considered Options

- **A capability-named package (`@workspace/search`).** Rejected: overpromises and fragments a domain across sibling packages.
- **Extract everything that has no second consumer but looks reusable.** Rejected: lazy creation says wait, and this step is the proof that waiting costs nothing.
- **A package must be domain-agnostic.** Rejected: too strict for a single-product monorepo; it would block extracting the most-shared, most-domain-specific code first.
- **A package mirroring a whole domain folder** (UI plus auth-bound queries plus resolution). Rejected: drags app-only pieces into a package consumed by a surface that needs only part of it.
- **Interdependent packages at the same layer.** Rejected: codes-as-contract keeps them independent with no cycle risk.
- **Turborepo boundaries or a cross-package lint rule to enforce the layering.** Rejected for now: seven packages and one app fit in one table, and the only direction worth machine-checking is "a package imports the app", which one grep covers. This document is the rule.

## Consequences

### The graph, as committed

| Layer    | Package                      | Alias                          | Published   | Internal runtime dependencies                                               | Internal consumers                                     |
| -------- | ---------------------------- | ------------------------------ | ----------- | --------------------------------------------------------------------------- | ------------------------------------------------------ |
| 0        | `packages/typescript-config` | `@workspace/typescript-config` | no          | none                                                                        | every package and the app, as a dev dependency         |
| 0        | `packages/eslint-config`     | `@workspace/eslint-config`     | no          | none                                                                        | every package and the app, as a dev dependency         |
| 0        | `packages/database`          | `@workspace/db`                | no          | none (Prisma client plus the pg and Neon adapters)                          | the app only                                           |
| 0        | `packages/widget-core`       | `@fasterfixes/core`            | yes, 0.0.7  | none                                                                        | `@fasterfixes/react` (10 files) and the app (12 files) |
| 1        | `packages/ui`                | `@workspace/ui`                | no          | none                                                                        | the app only (261 files)                               |
| 1        | `packages/widget-react`      | `@fasterfixes/react`           | yes, 0.0.11 | `@fasterfixes/core`                                                         | the app (2 files)                                      |
| 2        | `apps/web`                   | `web`                          | no          | `@workspace/db`, `@workspace/ui`, `@fasterfixes/core`, `@fasterfixes/react` | none                                                   |
| detached | `packages/mcp`               | `@fasterfixes/mcp`             | yes, 0.0.5  | none                                                                        | none inside the repo                                   |

Reading of the table:

- **No cycle and no upward import.** The only internal runtime edges are `@fasterfixes/react` to `@fasterfixes/core` (layer 1 to layer 0) and the four edges out of the app (layer 2 to layers 0 and 1).
- **No package imports the app.** The check, `grep -rn "apps/web\|@/app/" packages/*/src`, returns nothing. Outside `src/`, the ESLint config package names `apps/web` paths in its rule tests as fixture filenames and as the working directory of its config test; those are strings passed to the linter, not imports, and the dependency direction is unaffected.
- **The two config packages carry no runtime code.** They are listed at layer 0 for completeness; being a dev dependency of every package, they are excluded from the cycle question.
- **The UI package sits at layer 1 although it imports no internal package.** It is the app's presentation primitives, consumed by an app and never by another package, and it is source-exported: its `exports` map points at `./src/**` and the app lists it in `transpilePackages`, so it ships no build output of its own.
- **The MCP package is detached on purpose.** It talks to the agent API over HTTP and imports no internal package, so it sits outside the layer graph rather than at layer 0.
- **The app touches the published React widget through exactly two import sites, one per declared export subpath**: the root layout (`src/app/layout.tsx`) through the stable entry `@fasterfixes/react`, and the marketing demo (`src/app/(public)/(home)/_features/widget-demo/demo-feedback-provider.client.tsx`) through `@fasterfixes/react/internal`, which is the arrangement [ADR-0001](./0001-marketing-demo-uses-internal-widget-core.md) decided. Every other mention of the package name in the app is marketing copy or a documentation snippet.

### Two soft leaks, one since closed on the app side

- **The database package has no `exports` field**, so any path inside it is importable. Nine app files use that: seven deep-import the generated Prisma client (`@workspace/db/generated/prisma/client`) for its enums and row types, and two import the client instance through `@workspace/db/index` instead of the package root, which 150 other files use. The leak is inert as long as the app is the only consumer, and closing it means declaring an `exports` map with a types subpath and rewriting those nine imports. **Amended 2026-09-20**: the package now carries a `types.ts` entry point re-exporting the generated client, the nine imports were rewritten to `@workspace/db` and `@workspace/db/types`, and the layer import table (`local/no-cross-layer-import`) reports any other path inside the package. The `exports` field is still undeclared, so the resolver would still accept a deep path from a future second consumer: lint holds the boundary for the app, which is the only consumer the gate of this ADR admits.
- **The MCP package hand-maintains a duplicate of the agent API contract** (`src/api-types.ts` and `src/schemas.ts`) rather than importing a shared one. It is the deliberate decoupling that lets a published server stay compatible with a deployed API it does not ship with, and its cost is drift: a field added to the agent API is invisible to the MCP package until someone copies it. Accepted with that cost, not fixed.

### Which response fields the published clients actually read

Audited when the two public APIs moved behind services, and worth keeping because it is the difference between a breaking change and a free one. On an error body, `@fasterfixes/mcp` reads `error` only; `@fasterfixes/core` reads `error` and `details`. **No published client reads `code`**, which is why the widget API's own mapper may answer `{ error }` without one ([ADR-0012](./0012-domain-errors-and-transport-mapping.md), amendment 5) while the agent API keeps sending it. Changing or removing `error` or `details` is a breaking change for a shipped npm client that a customer cannot be made to upgrade; adding a field, or changing `code`, is not. Re-audit this list before changing an error body, because it dates from the day it was written.

### Candidates considered, all declined

| Candidate                                                                                                                                          | Decision                                                                                                                              |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| The root domain-agnostic components and providers (`src/app/_components/`, 10 entries; `src/app/_providers/`, 1 entry; there is no root `_hooks/`) | Declined: no second app. Their domain-agnostic rule is what keeps them extractable the day one exists.                                |
| A domain's read side (for example the `feedback` or `project` services)                                                                            | Declined: no second app queries it. The transport-agnostic service rule of ADR-0011 is what keeps it extractable.                     |
| A shared contract package between the MCP package and the app                                                                                      | Declined: the duplication is the decoupling, as recorded above. Extracting it would couple a published server's release to the app's. |

### What this ADR costs

- Both a package and an app domain folder may exist for the same domain the day one is extracted: the package holds cross-consumer logic, the folder keeps app-only pieces. Accepted as the price of reuse.
- The graph above dates from the day it was written. A new package, a new app or a new internal edge amends this ADR; nothing else records the layering.
- The question "should this leave the app?" is closed until a second consumer exists. Reopening it without one is a change to this ADR, not a judgement call in a review.

## Amendment 2026-09-26: a third published widget package and a three-deep chain

[ADR-0016](./0016-one-vanilla-widget-framework-embeds-are-wrappers.md) adds `packages/widget` (`@fasterfixes/widget`), the vanilla DOM implementation of the Widget, and turns `@fasterfixes/react` into a wrapper around it. The gate of this ADR is met the same way it is for the other published packages: external consumers. The graph changes as follows.

| Layer | Package                 | Alias                 | Published | Internal runtime dependencies | Internal consumers                                  |
| ----- | ----------------------- | --------------------- | --------- | ----------------------------- | --------------------------------------------------- |
| 0     | `packages/widget-core`  | `@fasterfixes/core`   | yes       | none                          | `@fasterfixes/widget`, the app                      |
| 1     | `packages/widget`       | `@fasterfixes/widget` | yes       | `@fasterfixes/core`           | `@fasterfixes/react`, the marketing demo in the app |
| 2     | `packages/widget-react` | `@fasterfixes/react`  | yes       | `@fasterfixes/widget`         | the app (root layout)                               |
| top   | `apps/web`              | `web`                 | no        | anything                      | none                                                |

Reading of the change:

- **Layers are numbered by depth, not fixed at three.** A package's layer is one more than the deepest internal package it imports; apps sit on top and may depend on anything. The two rules that matter are unchanged: no cycle, and no package imports an app. The published widget chain (core, widget, framework embeds) is the first three-deep chain in the repo, and future framework packages (`@fasterfixes/vue`, and so on) join `@fasterfixes/react` at layer 2.
- **`@fasterfixes/react` stops importing `@fasterfixes/core` directly.** Everything it needs comes through `@fasterfixes/widget`. The app keeps importing core for utilities and types.
- **The app's second import site of the React package moves.** The marketing demo ([ADR-0001](./0001-marketing-demo-uses-internal-widget-core.md)) consumes `@fasterfixes/widget/internal` instead of `@fasterfixes/react/internal`, which is removed at the React 1.0.0 release.
- **The "which response fields the published clients read" audit gains a rule.** ADR-0016 makes the widget HTTP API additive only, so the audit above is no longer only a checklist before an error-body change: removing or renaming any field of a widget API response is out of bounds while a shipped client may read it.
