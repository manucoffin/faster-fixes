# App folder architecture: domains, buckets, public APIs

The `src/app/` tree was organised around a root `_features/` folder whose direct children were really domain groupings and whose grandchildren were the actual features. Two implicit tiers, one name. We rename the root folder to `_domains/`, formalise one bucket set inside each domain and mirror it at the route level, and require cross-domain access to go through a per-domain `index.ts` public API. Every file gets an unambiguous home, and the "domains should not import each other's internals" intuition becomes a lint rule.

## Decisions

- **Root `_features/` becomes `_domains/`.** Its direct children are domain folders named after canonical terms of the project glossary. "Feature" now means a capability slice inside a scope.
- **Domains live inside the App Router tree**, at `src/app/_domains/`, not in a sibling `src/domains/`. One tree, one mental model: routes compose domains, and the same buckets serve both.
- **One bucket set at both tiers** (domain and route segment):
  - `_features/`: capability slices (client or server UI tied to one capability, plus its container hooks). Never nested.
  - `_components/`: pure UI bound to this scope, no schema, no server.
  - `_services/`: the data/IO layer, verb-prefixed, transport-agnostic, lazy.
  - `_helpers/`: pure behavioral functions only, lazy.
  - `_types/`: standalone shared isomorphic types, lazy.
  - `trpc-router.ts`: thin tRPC transport at the scope root. Not a bucket; one per scope; optional.
- **`_components/` is flat.** One file per component. Never a folder named after a single component. Variants, skeletons, and compound pieces are siblings. The only subfolders are sub-libraries grouping many distinct components, themselves flat.
- **Routes mirror domains exactly.** No other `_*` folders at the route level.
- **Domain versus route:** if it operates on a domain entity and could plausibly be reused on another page touching that entity, it goes to `_domains/<x>/`. Otherwise (composition, layout, page-specific orchestration) it goes to the route.
- **Promotion rule:** when a route feature gains a second consumer in a different route, move the whole feature to `_domains/<x>/_features/`. Do not extract a shared subset.
- **Cross-domain access goes through `index.ts`.** Every domain exposes a public surface via its barrel. Other domains may only import that path. Routes and `app/api/` are the composition layer and may reach into internals. Enforced by ESLint.
- **The barrel exports capabilities, not server implementations.** UI components, Zod schemas, domain types, parsers, pure helpers, and type-only re-exports from `_services/` belong in it. Service functions and routers do not. When another domain seems to need a server implementation: wrap the data in a server component and expose that; or move the operation to the domain that owns it; or lift the abstraction to `src/server/` or a package. A second "server barrel" is rejected: it codifies the leak.
- **No cross-domain cycles.** Soft hierarchy hint: low-level domains should not depend on high-level ones. The cycle ban is hard; the hierarchy is a review signal.
- **Root `_components/`, `_hooks/`, `_providers/`, `_constants/` are domain-agnostic** because they are candidates for extraction into shared packages. Anything carrying domain knowledge cannot live there.
- **Root `src/server/` is cross-cutting infrastructure only.** Domain-specific server code lives in the relevant scope's `_services/`.

## Considered Options

- **Keep one undifferentiated `_features/` folder.** Rejected: the tree already had two tiers, and pretending otherwise left "is this a domain or a feature?" unanswerable for every new folder.
- **A `src/domains/` tree beside `src/app/`.** Rejected: doubles the top-level surface and forces the same ambiguity for every folder.
- **Strict no-cross-domain imports.** Rejected: real dependencies exist and event-based decoupling is heavy ceremony at this scale.
- **Barrel enforcement by convention only.** Rejected: the convention already existed and was already broken. Lint makes the public surface a forcing function for naming reuse points.
- **Rename route-level `_features/` to `_sections/`.** Rejected: only some route features are layout sections; mirroring the domain buckets keeps one model.
- **More buckets (`_hooks/`, `_constants/` per domain).** Rejected: sprawl for marginal clarity. Hooks live in their feature; constants are helpers or types.
- **Eagerly create every bucket in every domain.** Rejected: most domains need only some. Buckets are created when real code of that kind exists.

## Consequences

- One mechanical migration: `_features/` to `_domains/`, with every import path rewritten.
- A new ESLint rule restricts cross-domain imports to the barrel. Existing reach-ins become lint errors and need a one-off pass: export the contract, or refactor.
- Route folders carrying `_queries/` or other non-bucket siblings become non-compliant. Their contents fold into the bucket that owns them.
- Some old feature leaves are pure presentational components. They move to `_components/`.
- One-time flatten pass on `_components/` wrapper folders.
- The inside of `_services/` (naming, verb vocabulary, transport agnosticism) is specified by the server file conventions ADR, which amends the bucket set described here.
