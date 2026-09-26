# Step 5: Packages

> End state: the rule for when code leaves `apps/` for a workspace package is written down and applied. Packages form a layered, acyclic graph. Published npm packages count as having an external consumer and keep their own internal conventions. For a single-app monorepo with independent published packages, this step changes no code.

Authority: `adrs/package-extraction-boundaries.md` (commit it with this step).

## Prerequisites

- Steps 2 to 4 done. The bucket architecture inside `apps/web` is stable, so the question "should this leave the app?" can be answered on real reuse rather than on guesses.

## Target state

### The rule

- **A package exists to reuse code across consumers.** The gate is a second consumer: another app in `apps/`, or an external consumer (a published npm package by definition has one). "It is generic" or "it would be cleaner" is not a gate.
- **Create lazily.** When the second consumer appears, not before. Until then the code lives in the app's domain folder, even if it looks package-shaped.
- **Layered, acyclic**:
  - Layer 0, foundations: `@repo/db`, `@repo/ui`, and any pure resolution core. They depend on no internal package (a foundation may depend on `@repo/db`, never on a domain package).
  - Layer 1, domain packages: named after the domain (`@repo/<domain>`), never after a capability (`@repo/<domain>-search`). May depend on layer 0.
  - Layer 2, apps. May depend on anything.
  - **Published npm packages** sit at layer 0 or 1 depending on what they import. They never import from an app, and they never import a layer above their own.
- **`@repo/ui` is domain-agnostic primitives only.** A component encoding product or domain meaning stays with its feature, or graduates into `@repo/<domain>/ui` when two apps render it.
- **Server and client on separate subpaths** inside a domain package (`@repo/<domain>/search` for pure server logic, `@repo/<domain>/ui` for React), so a server consumer never pulls React.
- **Share query result types, not presentation DTOs.** Each consumer maps the package's inferred result type to its own presentation.
- **Codes and ids are the contract between packages**, not each other's types, so two layer-1 packages need not depend on each other.

### Published packages

- Their internal structure is out of scope of the bucket architecture, which applies to `apps/` only. They keep the conventions that make them good npm citizens.
- The one obligation they have toward the app architecture is the dependency direction: an app may import them; they never import the app or a domain package above them.
- If a published package and `apps/web` start sharing domain logic, the shared part becomes a layer-1 `@repo/<domain>` package that both consume. The published package does not absorb app-only code.

### Candidates and non-candidates

Write, in the migration log, one line per folder that was considered:

- Root `app/_components/`, `_hooks/`, `_providers/`: candidates for `@repo/ui` and a React-utilities package **only when a second app exists**. Otherwise they stay, and their domain-agnostic rule is what keeps them extractable.
- A domain's `_services/` read side: candidate for `@repo/<domain>/search` when a second app queries it.
- Anything with a single consumer: not a candidate.

## What must be gone

| Pattern                                                                      | Check                                                               |
| ---------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| A package with one internal consumer and no external one, created for purity | listed and either justified or folded back into the app, in the log |
| A package importing an app                                                   | `grep -rn "apps/web\|@/app/" packages/*/src` returns nothing        |
| A foundation importing a domain package                                      | reviewed by hand against the layer table                            |

## Recommended strategy

Read every `packages/*/package.json` and each package's imports, draw the layer graph, and confirm it is acyclic and top-down. Record the graph in the ADR's Consequences section as committed. Extract nothing unless a second consumer exists today. If the project uses Turborepo boundaries or an equivalent, encode the layer rule there; otherwise the ADR is the rule.

## Definition of done

- The shared definition of done from the kit README (no code changed in the common case, so this is a re-run).
- The ADR `package-extraction-boundaries.md` is committed in the project's `docs/adr/` with the actual package graph written into it.
- The migration log has the candidate list with a decision per line.
- The temporary migration log folder is deleted, and the architecture doc plus the ADRs are the only record.
