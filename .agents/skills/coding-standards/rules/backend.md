# Backend: services and tRPC layer

The data/IO layer lives in a per-scope `_services/` folder; tRPC is thin transport at the scope root. Authority: `docs/adr/0011-server-file-conventions.md`. Folder placement and the bucket set are in [architecture.md](architecture.md). Schema conventions are in [schemas.md](schemas.md).

## The `_services/` folder

- `_services/` is the **data/IO layer** of a scope (a domain or a route segment): reads, writes, IO-predicates, write-orchestrations, `*.inngest.ts` jobs, and `*.schema.ts`. An `*.inngest.ts` file may sit nowhere else, and `createFunction` may be called nowhere else: enforced by `local/require-inngest-function-placement`.
- Files are **plain-named after their export** with a load-bearing **verb prefix** — `get-user.ts` exports `getUser`. **No role suffixes** (`*.server.query.ts`, `*.trpc.query.ts` are gone). The verb is enforced by `local/services-verb-prefix`, the export name by `local/services-filename-matches-export`; the absence of role suffixes is **prose only**.
- **All data ops go here, even single-use** (**prose only**, no rule). A solitary query still lives in `_services/`, not colocated in a feature. Control clutter with route-tree granularity (each segment owns its `_services/` + router) and, secondarily, subfolders inside `_services/` when ~3+ files cluster. The database import half is enforced: outside `_services/` and `src/server/`, a runtime `@workspace/db` import is a row of `local/no-cross-layer-import`.

## Verb vocabulary (enforced)

A file is a **read iff it performs no writes**, and a read may use only read verbs. Full vocabulary in [naming.md](naming.md). Two rules split the job: `local/services-verb-prefix` checks that the name carries a verb from the vocabulary, and `local/services-read-never-writes` checks that a read-verb name is true, by reporting a Prisma write method called on a database client from a `get-`, `list-`, `find-`, `search-`, `has-`, `is-` or `count-` file.

- **Reads** (never write) — **CLOSED set, you may not extend it**: `get-` (one / by-id), `list-` (collections, single entrypoint with an options object — no `getAllX`/`getPaginatedX`), `find-` (nullable lookup), `search-` (query), `has-` / `is-` (IO-predicates), `count-`. A **computed read** (derives a result from queries but writes nothing — a feasibility check, slot suggestions, a preview) is still a read: use `get-` and name the **result noun** (`get-session-feasibility`, `get-session-slot-suggestions`), never a process verb (`evaluate-`, `suggest-`, `preview-`, `resolve-`, `compute-`).
- **Writes** — **OPEN set, prefer the most precise accurate verb**. Generic CRUD verbs by default (`create-`, `update-`, `delete-`, `send-`, `upsert-`, `handle-`); a precise domain verb (`restore-`, `revoke-`, `upgrade-`, `unlink-`, …) is preferred when the operation is a **distinct domain transition** (its own entry point, a distinct authorization/invariant, or a state transition the domain already names). A write verb must **never** collide with a read verb. No synonyms of `update` (`edit-`/`modify-`/`save-`/`change-`). The enforced list is `serviceVerbOptions.writeVerbs` in `packages/eslint-config/next.js`: a verb the tree does not use yet is added there in the same diff as the service that needs it, which is how coining one stays a reviewed decision. Full guidance in [naming.md](naming.md).
- **`handle-`** is the write-orchestration verb for event/webhook handlers (one webhook entrypoint per Tracker driving replay protection, state transitions and event emission, e.g. `integration/_services/linear/handle-linear-webhook.ts`).

The **folder** sets the layer (`_services/` = IO); the **verb** sets the direction (read vs write).

### Named exceptions to the verb prefix

- **A module that is not an operation keeps its noun name, and says so with a suffix.** `services-verb-prefix` exempts a basename ending in `-client`, `-app`, `-error`, `-errors`, `-crypto`, `-access`, `-cookie` or `-registration` (the `exemptSuffixes` option in `packages/eslint-config/next.js`), so `github-app.ts`, `linear-client.ts`, `jira-client.ts`, `jira-rest-client.ts`, `slack-client.ts`, `token-access.ts`, `webhook-registration.ts`, the named infrastructure error modules (`integration-configuration-error.ts`, `linear-request-error.ts`, `slack-request-error.ts`) and the shared `oauth-state-cookie.ts` are correct as they stand. Do not invent a `get-` name for a client factory, and do not invent a new suffix to dodge the verb list: a module with neither a verb nor an exempt suffix is reported. The provider token cipher is uniformly `token-crypto.ts`.
- **Every other basename opens with a verb from the vocabulary.** The read verbs are the closed ADR-0011 set; the write verbs are the `writeVerbs` option, which is the open set the tree uses today. Coining a precise domain verb for a distinct domain transition is a one-line addition there, reviewed in the diff, and the report names the file to edit. `get-all-…` and `get-paginated-…` are reported by name: one `list-` entrypoint takes an options object.
- **The export half is `local/services-filename-matches-export`**: a non-exempt service file exports the value it is named after and no other function, and its report says how to fix it.
- **`*.inngest.ts`, `*.schema.ts`, `index.ts`, `_`-prefixed and test files are exempt** from `services-verb-prefix`, `services-filename-matches-export` and `require-service-output-type`; `services-no-bare-error` still applies to all of them. The suffix is load-bearing, not decoration: it is also why `handle-linear-oauth-revoked.inngest.ts` may carry `handle-` without colliding with the verb reserved for the one webhook orchestration per Tracker.

### A live external identifier survives a file move

Renaming or relocating a `*.inngest.ts` service must not change its Inngest function `id`, its trigger `event` or `cron` strings, its concurrency key, retry count or idempotency key. Those strings are the running system's identity: changing one orphans in-flight runs. The same holds for a webhook deduplication key prefix (`webhook:<provider>:…` rows in `rateLimit`, with the SHA-256-of-raw-body fallback when the delivery header is absent), whose prefix resets replay protection across a deploy if edited. It is also why the Linear and Jira `handle-` webhook services take the raw body alongside the parsed payload (GitHub always sends a delivery id). The Inngest client id stays in `src/server/inngest/index.ts`. When you move such a file, diff the identifier lines and confirm they are untouched.

## Transport-agnostic services (Option B)

- A `_services/` function **never imports tRPC** (`@/server/trpc`, `@/lib/trpc`, `@trpc/*`, type-only imports included), enforced by `local/services-no-trpc-import`, and never imports `next/server`, `next/headers` or `next/navigation` at runtime, enforced by the service row of `local/no-cross-layer-import`. It is callable from a tRPC procedure, an Inngest job, or a server action with no HTTP round-trip.
- The **type source of truth** is the service's return type, exported from the service file as `<Service>Output`: `export type GetUserOutput = Awaited<ReturnType<typeof getUser>>`. The alias is named after the file's own service and built from `typeof` it, so a `ReturnType` of some other function does not stand in for it. Do **not** use `inferProcedureOutput` as the canonical output type: `require-service-output-type` reports it, and `inferRouterOutputs`, in consumer code.
- A service **throws a `DomainError` subclass** for an expected failure, never `TRPCError` and never a bare `Error`. The vocabulary lives in `@/server/errors/domain-errors` (`NotFoundError`, `ConflictError`, `BadRequestError`, `ForbiddenError`, `PreconditionFailedError`) and exists since migration step 3, so an extracted service throws it from day one. The base tRPC procedure maps the code and the message back to a `TRPCError`, so no procedure try/catches for mapping. Authority: `docs/adr/0012-domain-errors-and-transport-mapping.md`; display channels in [errors.md](errors.md).

```ts
// _domains/animal/_services/get-animal.ts
import { prisma } from "@workspace/db";

import { NotFoundError } from "@/server/errors/domain-errors";

export async function getAnimal(id: string, db: typeof prisma = prisma) {
  const animal = await db.animal.findUnique({ where: { id } });
  if (!animal) throw new NotFoundError("Animal not found.");
  return animal;
}

export type GetAnimalOutput = Awaited<ReturnType<typeof getAnimal>>;
```

- **An Inngest function wraps the calls that can throw a `DomainError`.** A business rejection (a disconnected Installation, a link the user must repair) never succeeds on retry, so a function body calling code able to throw one routes the failure through `rethrowDomainErrorsAsNonRetriable` (`@/server/errors/non-retriable`), which rethrows it as Inngest's `NonRetriableError` with the original as `cause`. Infrastructure failures pass through untouched and keep their retries. Only wrap where a `DomainError` can actually arrive: wrapping a function that reaches no throwing service is dead code posing as a guarantee.

```ts
// app/_domains/integration/_services/jira/create-jira-issue.inngest.ts
const accessToken = await getValidJiraAccessToken(
  installation.organizationId,
).catch(rethrowDomainErrorsAsNonRetriable);
```

- **Inject the Prisma client, the `DomainError` branches, the service-calls-service shape and everything below are prose only**, no rule: each is a judgement about what a function does rather than about a name or an import.
- **Identity and transport policy stay in the procedure**: `UNAUTHORIZED`, rate limiting (`TOO_MANY_REQUESTS`) and plan-limit denials have no domain-error equivalent. An authorization check that needs a loaded resource (membership, ownership) belongs in the service that loads it, as a `ForbiddenError`.
- **A service takes plain named values, never the transport's context** (**prose only** for the `ctx` parameter). The router resolves what the service needs and passes it by name (`headers: await headers()`, `userId`, an entity id). A service never reads the tRPC `ctx` and never calls `next/headers` itself: the second half is the service row of `local/no-cross-layer-import`, the first has no rule. "Transport-agnostic" is wider than "does not import tRPC": taking `ctx` as a parameter satisfies every lint rule here and still binds the service to one transport.
- **A service reads the fact it decides on rather than receiving it from its caller.** `stopImpersonate` calls `auth.api.getSession` itself instead of taking `impersonatedBy` from the procedure, so the rule it enforces holds for any future transport. The cost is one extra read on a rare action, which is the right trade.
- **A service may call another service.** A multi-step preamble shared by several services becomes its own read service rather than being inlined N times: `get-jira-access.ts`, `get-linear-access.ts` and `get-monthly-churn-rate.ts` are each consumed by another service. The caller forwards its injected client so one test covers both.
- **A service returns what the boundary needs to report.** `update-feedback-status` returns `previousStatus` beside the stored row so the route can name the transition without a second read.
- **Inject the Prisma client only where there is a branch worth pinning.** A service holding an authorization check or a `DomainError` branch takes a trailing `db: typeof prisma = prisma` and is tested with a fake; a pass-through read imports `prisma` directly. A service that delegates its check to another service forwards the client so one test covers both. 83 services carry the parameter today; the criterion, not the count, is the rule.
- **The same operation may exist twice when the authorization differs.** `inbox/_services/update-feedback-status.ts` and `api/v1/agent/feedbacks/[id]/status/_services/update-feedback-status.ts` are kept apart on purpose: one authorizes a Member of the Organization, the other a Project owned by the token's Organization, and they record a different Status actor. Merging them needs a "caller scope" concept; until that exists, a DRY merge would silently widen authorization across transports. They also diverge on a no-op status set: the dashboard service emits `feedback/status-changed` anyway, the agent service skips the fan-out (ADR-0007). That asymmetry is intended, because an agent re-sets what it just read while a human toggling a Status does not.
- **The one sanctioned exception to transport agnosticism** is `api/v1/agent/_services/require-agent-auth.ts`, which returns `AuthenticatedAgentToken | NextResponse`. Its 401, 403 and 429 carry headers and body fields no `DomainError` can express, and it does IO, so it lives in `_services/` and is a transport guard by design. It is not a precedent for handlers posing as services: no other service may return a `Response`.

## tRPC router

One convention of this section is enforced: a `trpc-router.ts` imports no Prisma (a row of `local/no-cross-layer-import`). Thinness, composition shape and the procedure key are **prose only**, no rule.

- `trpc-router.ts` is **thin transport at the scope root** (sibling of `_services/`; for a route, colocated with `page.tsx`).
- Procedures are **inlined** in the router when thin: auth procedure + zod `.input()` + one service call. A fat procedure wrapper is a smell → push logic into the service.
- Routers **compose hierarchically** following the route tree: a parent router mounts child routers. No god-router importing dozens of operations — distribute across sub-segment routers.
- **A child segment may own `_services/` and no router of its own**, with its procedures inlined in the nearest ancestor router. Readability of one API surface is the criterion, not the file count: the account scope keeps its ten operations in one file, and the Project scope keeps 44 across three segments in `(project)/trpc-router.ts` for the same reason. Six segments have a `_services/` bucket and no `trpc-router.ts` today. Introduce a segment router when the parent stops being readable in one pass, not because a segment exists. The "one router per scope" rule above still holds: what varies is which scope is the router's.
- **The undo half of a plan-gated capability is never plan-gated.** `linkRepo`, `linkTeam` and `linkProject` sit behind `enforceFeature`; `unlinkRepo`, `unlinkTeam` and `unlinkProject` are plain `protectedProcedure`, so a downgraded Organization can always disconnect what it connected while paying. Gating the undo strands a User in a state they cannot leave without paying. Same rule for any future disconnect, revoke or delete behind a feature gate.
- **The procedure key drops the entity its router already carries.** `createOrganization` mounted on the organization router is `organization.create`, not `organization.createOrganization`. Two exceptions: when the service names something other than the router's entity, the key is the full service name (`public.getGithubStars`, `billing.subscription.getStatus`, `feedback.listDistinctPageUrls`); and a plural operation colliding with its singular sibling takes a `Many` suffix rather than re-adding the entity (`feedback.deleteMany`, `feedback.updateManyStatus`).

```ts
// _domains/animal/trpc-router.ts
import { protectedProcedure, router } from "@/server/trpc/trpc";
import { AnimalIdSchema } from "./_services/animal.schema";
import { getAnimal } from "./_services/get-animal";

export const animalRouter = router({
  get: protectedProcedure
    .input(AnimalIdSchema)
    .query(({ input }) => getAnimal(input.id)),
});
```

## Helpers vs services vs types

The import half of helper purity is enforced by the helper row of `local/no-cross-layer-import`: no `@workspace/db`, no `@prisma/client`, no `next`, no `react`. Which side of the IO line a given function falls on is **prose only**.

- **`_helpers/`** = pure **behavioral** functions only (no IO): formatters, label maps, calculators, slug generators, nuqs `search-params` parsers, and **pure predicates** that operate on already-loaded inputs.
- **Nondeterministic is not the same as IO.** `crypto.randomBytes` is a local call, so a generator built on it is a helper: `project/_helpers/generate-api-key.ts` and `generate-public-id.ts` are helpers, not services.
- **Predicates split by IO, not verb:** `isSubscriptionActive(sub)` (pure) → `_helpers/`; `hasActiveSubscription(userId)` (queries to answer) → `_services/`. A pure predicate must never fetch its own data; if it needs to, it has become an IO-predicate and moves to `_services/`.
- **`_types/`** = standalone, hand-written, isomorphic shared types. A type derived from a service stays **in** that service file.

## External libraries

**Prose only**, no rule: the swap test below is the whole of the judgement.

Placement follows the **domain decision, not the dependency**. Thin domain-agnostic SDK adapters → root `@/server/<lib>/` (e.g. `@/server/stripe/`). Domain logic that _happens_ to call the SDK stays in the domain's `_services/`. Test: _"If I swapped the provider, does this file's reason for existing change?"_ Yes → domain service. No → `@/server/<lib>/`. `@/server/` takes the adapter only under its own two conditions (wiring, or a cross-cutting abstraction two domains or transports need): every Tracker and Notification channel client failed that test and lives in `@/app/_domains/integration/_services/<provider>/`.

## Client/server boundary

- A `'use server'` directive belongs **only** in a `*.server.action.ts` file, at module level or inside a function: a module-level one turns every export into a public endpoint, and a function-level one (an inline server action) mints the same endpoint under no name a reader can search for. A server component needs no directive, and an infrastructure helper must be called through a service that checks who is asking.
- A client file (`'use client'` / `*.client.tsx`) must **not** import from a `_services/` path — **except** `*.schema.ts` and **type-only imports** (`import type { … }`): TS erases those at compile time, so they cannot leak server code into the bundle, and the service return type is the type source of truth. For runtime values, use a tRPC hook or a server component instead.
- A client file must **not** import a **runtime value** from `@/server/**` either: the folder holds wiring and server-only cross-cutting abstractions, so the import leaks them into the bundle, and `instanceof DomainError` would not survive serialization anyway (branch on `error.data.code`). Type-only imports are free. A value a client legitimately needs does not belong in the server folder: it moves to `@/utils/` or `@/lib/`, as the public asset URL builder did (`@/utils/url/resolve-s3-url`). Any exception would be a named pattern in `clientServerImportOptions` in `packages/eslint-config/next.js` (empty today), not a disable comment.
- Container hooks (`use-*.ts`) own form state + mutation + optimistic update + toast + invalidation, returning `{ form, onSubmit, isPending }`. They live in their owning scope's `_features/` slice, next to the UI they drive. Extract a hook only on real logic or reuse; a trivial single `useQuery` stays inline.

## Enforced by ESLint

Every rule below is `error` in plain `pnpm lint`, with no environment gate and no per-scope
allowlist (ADR-0015), so the pre-commit hook and CI run exactly this set. Sources are in
`packages/eslint-config/local-rules/`, wiring and options in `packages/eslint-config/base.js` (the
generic rules every workspace runs) and `packages/eslint-config/next.js` (the web app).
A convention of this file that is not listed here is marked **prose only** where it is stated.

Inside `_services/`:

- `services-verb-prefix`: the verb list, the banned `update` synonyms, the process verbs, `get-all-`/`get-paginated-` and the exempt module suffixes.
- `services-filename-matches-export`: the file exports the value it is named after and no other function; same exemptions as the verb rule.
- `services-read-never-writes`: a `get-`, `list-`, `find-`, `search-`, `has-`, `is-` or `count-` file may not call a Prisma write method on a database client.
- `services-no-trpc-import`: no `@/server/trpc`, `@/lib/trpc` or `@trpc/*` from a service, type-only imports included.
- `services-no-bare-error`: throw a `DomainError` subclass, not `new Error(...)`. Applies to `*.inngest.ts`, `*.schema.ts` and `index.ts` too, which the two verb rules exempt.

Across the app source:

- `require-service-output-type`: a read service exports `<Service>Output` built from `typeof` its own service, and no consumer infers the same type with `inferProcedureOutput` or `inferRouterOutputs`.
- `require-inngest-function-placement`: `createFunction` is called in an `*.inngest.ts(x)` file, and such a file lives in a `_services/` folder. The Inngest client in `src/server/inngest/` is wiring and is untouched.
- `no-cross-layer-import`, the layer import table (`layerImportRows` in `next.js`). Nine rows: a domain barrel exports no service or router at runtime; a `trpc-router.ts` imports no Prisma; a helper imports neither the database, nor `next`, nor `react`; a service does not reach for `next/server`, `next/headers` or `next/navigation`; root `_components/`, `_providers/` and `_constants/` import no domain; `src/lib/` and `src/utils/` do not import the app tree; `@trpc/server` is confined to a router and `src/server/trpc/`; runtime database imports are confined to `_services/` and `src/server/`; the database package is reached through `@workspace/db`, `@workspace/db/types` and `@workspace/db/generated/prisma/enums`. `require-agent-auth.ts` is the one named service exemption.
- `no-cross-domain-deep-import`: another domain is reached through its barrel, by alias, in every import form.
- `no-restricted-imports` on `src/server/**`: the server folder does not reach into the app tree by deep path. Its exemptions are named file by file in `next.js`.
- `no-default-export`, `no-restricted-patterns` (`enum`, `as unknown as`, `query.data ?? []`), `no-em-dash-in-copy`, `kebab-case-path` and the installed plugin rules of `base.js` (the type-aware set, `consistent-type-definitions`, `consistent-type-imports`, `no-nested-ternary`, `no-else-return`, `max-depth`, `only-throw-error`) apply to services like every other module. See [typescript.md](typescript.md), [code-shape.md](code-shape.md) and [naming.md](naming.md).

At the client/server boundary:

- `no-client-import-of-services`: exempts `*.schema.ts` and type-only imports.
- `no-client-import-of-server-folder`: no runtime import of `@/server/**` from a client module; type imports and the allowlist (`clientServerImportOptions`, empty today) excepted.
- `no-client-domain-error-instanceof`: `instanceof DomainError` in a client module is a branch that is always false.
- `require-use-client-suffix`: exempts `use-*`, `*.context.tsx` and the Next.js special files.
- `require-server-action-suffix`: a `'use server'` directive at module or function level belongs only in a `*.server.action.ts`.

On the folders and the schemas:

- `no-feature-nesting`: one grouping level under a features folder, and no features folder inside one.
- `app-file-placement`: every folder of an `src/app/` path is a bucket, a domain or a segment its tier allows. See [architecture.md](architecture.md).
- `types-folder-type-only`: a `_types/` file holds types only; a runtime value is a helper.
- `test-file-placement`: a test sits beside its subject, in `_helpers/`, `_services/` or a `route.test.ts`; no `*.spec.ts(x)`, no `__tests__/`. See [testing.md](testing.md).
- `schema-must-be-pure-zod` and `require-schema-conventions` on `**/*.schema.ts`. See [schemas.md](schemas.md).
- `no-raw-tailwind-colors` on class strings, and `no-relative-test-mock` on `*.test.ts(x)`. See [frontend.md](frontend.md) and [testing.md](testing.md).
- `require-named-props-type` on component props, `no-query-status-branch` on query status, `no-form-state-prop` and `no-form-mutation-in-effect` on react-hook-form, and `error-boundary-renders-error-screen` on `error.tsx` / `global-error.tsx`. See [frontend.md](frontend.md), [code-shape.md](code-shape.md) and [errors.md](errors.md).
- The `eslint-plugin-react-hooks` v7 preset (`recommended-latest`) on every React module: the rules of hooks, `exhaustive-deps` and the React Compiler rules (`set-state-in-effect`, `refs`, `purity`, `immutability`, `static-components`, `incompatible-library`, ...). Each rule's message says what to do instead.

The five boundary rules (`no-client-import-of-server-folder`, `no-client-import-of-services`,
`no-cross-domain-deep-import`, `no-cross-layer-import`, `require-server-action-suffix`) and the
`src/server/**` `no-restricted-imports` lock cannot be switched off by a disable comment: an
exception to one of them is a named entry in `next.js`. Every other rule is disableable with a
written reason, which `eslint-comments/require-description` makes mandatory.

Two conventions of the tree are held by a test rather than by lint, because each is a property of
the whole tree that ESLint cannot see one file at a time: `src/app/_domains/domain-cycles.test.ts`
(no domain import cycle) and `src/mdx-no-em-dash.test.ts` (no em dash in the MDX content).
