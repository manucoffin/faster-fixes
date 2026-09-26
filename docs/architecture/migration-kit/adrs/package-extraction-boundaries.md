# Package extraction boundaries: reuse-driven, layered, lazy

A monorepo invites moving code out of the app into workspace packages "because it is clean". That instinct produces packages with one consumer, capability-named packages that fragment a domain, and dependency cycles between packages. This ADR sets the rule for when code earns a package, how packages may depend on each other, and how published npm packages fit.

## Decisions

- **A package exists to reuse code across consumers, not because it is generic.** Domain coupling inside a package is expected and fine in a single-product monorepo. The gate is "consumed by two or more apps, or by an external consumer", not "is this generic". This is the package-layer analogue of the lazy bucket rule: create the package when a real second consumer appears, not speculatively.
- **Published npm packages satisfy the gate by definition.** An external consumer is a consumer. Their internal structure follows their own conventions; the app bucket architecture applies to `apps/` only. They obey the layering below like any other package.
- **Packages form a layered, acyclic dependency graph. No cycles.**
  - Layer 0, foundations: the database client, the domain-agnostic UI primitives, pure resolution cores. They depend on no internal package (a foundation may depend on the database client, never on a domain package).
  - Layer 1, domain packages: `@repo/<domain>`. May depend on layer 0.
  - Layer 2, apps. May depend on anything.
  - A package never imports an app.
- **The UI package is domain-agnostic primitives only**, the package analogue of the root `_components/` rule. A component encoding product or domain meaning lives with its feature, and graduates into `@repo/<domain>/ui` when two apps render it.
- **A domain package is named after the domain, not the capability.** `@repo/<domain>` with subpaths (`/search`, `/ui`), never `@repo/<domain>-search`. It grows lazily with other cross-app logic of that domain.
- **Server and client on separate subpath entry points** within a domain package, so a server consumer never pulls React.
- **Codes and identifiers are the contract between packages.** A domain package takes plain ids and codes as inputs rather than another package's types, so two layer-1 packages need not depend on each other.
- **Share query result types, not presentation DTOs.** Each consumer maps the package's inferred result type to its own presentation.
- **Small overlaps are accepted over premature packages.** A three-line predicate duplicated between the app and a package is cheaper than a package for one function.

## Considered Options

- **A capability-named package (`@repo/search`).** Rejected: overpromises and fragments the domain across sibling packages.
- **Extract everything that has no second consumer but looks reusable.** Rejected: lazy creation says wait.
- **A package must be domain-agnostic.** Rejected: too strict for a single-product monorepo; it would block extracting the most-shared, most-domain-specific code.
- **A package mirroring a whole domain folder (UI plus auth-bound queries plus resolution).** Rejected: drags app-only pieces into a package consumed by a surface that needs only part of it.
- **Interdependent domain packages.** Rejected: codes-as-contract keeps them at the same layer with no cycle risk.
- **Extract the UI package up front.** Rejected until a second surface actually reuses primitives.

## Consequences

- The package graph is written here and kept current (fill in the actual layers of this repo when adopting):
  - Layer 0: `@repo/db`, `@repo/ui`, ...
  - Layer 1: ...
  - Layer 2: `apps/web`, ...
  - Published: ...
- Both a domain package and the app's domain folder may exist for the same domain: the package holds cross-consumer server logic, the folder keeps app-only pieces. Accepted as the cost of reuse.
- A future lint or Turborepo boundaries rule can enforce the layering. Until then this document is the rule.
- Candidates for extraction (root `_components/`, `_hooks/`, a domain's read side) stay in the app until a second consumer exists, and their domain-agnostic or transport-agnostic rules are what keep them extractable.
