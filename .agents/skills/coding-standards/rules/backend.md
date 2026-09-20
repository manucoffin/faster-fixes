# Backend: services and tRPC layer

The data/IO layer lives in a per-scope `_services/` folder; tRPC is thin transport at the scope root. Authority: `docs/adr/0011-server-file-conventions.md`. Folder placement and the bucket set are in [architecture.md](architecture.md). Schema conventions are in [schemas.md](schemas.md).

## The `_services/` folder

- `_services/` is the **data/IO layer** of a scope (a domain or a route segment): reads, writes, IO-predicates, write-orchestrations, `*.inngest.ts` jobs, and `*.schema.ts`.
- Files are **plain-named after their export** with a load-bearing **verb prefix** — `get-user.ts` exports `getUser`. **No role suffixes** (`*.server.query.ts`, `*.trpc.query.ts` are gone).
- **All data ops go here, even single-use.** A solitary query still lives in `_services/`, not colocated in a feature. Control clutter with route-tree granularity (each segment owns its `_services/` + router) and, secondarily, subfolders inside `_services/` when ~3+ files cluster.

## Verb vocabulary (enforced)

A file is a **read iff it performs no writes**, and a read may use only read verbs. Full vocabulary in [naming.md](naming.md).

- **Reads** (never write) — **CLOSED set, you may not extend it**: `get-` (one / by-id), `list-` (collections, single entrypoint with an options object — no `getAllX`/`getPaginatedX`), `find-` (nullable lookup), `search-` (query), `has-` / `is-` (IO-predicates), `count-`. A **computed read** (derives a result from queries but writes nothing — a feasibility check, slot suggestions, a preview) is still a read: use `get-` and name the **result noun** (`get-session-feasibility`, `get-session-slot-suggestions`), never a process verb (`evaluate-`, `suggest-`, `preview-`, `resolve-`, `compute-`).
- **Writes** — **OPEN set, prefer the most precise accurate verb**. Generic CRUD verbs by default (`create-`, `update-`, `delete-`, `send-`, `upsert-`, `mark-`, `convert-`, `duplicate-`, `validate-`, `export-`, `handle-`); a precise domain verb (`archive-`, `restore-`, `reorder-`, `promote-`, …) is preferred when the operation is a **distinct domain transition** (its own entry point, a distinct authorization/invariant, or a state transition the domain already names). A write verb must **never** collide with a read verb. No synonyms of `update` (`edit-`/`modify-`/`save-`/`change-`). The enforced list is `serviceVerbOptions.writeVerbs` in `packages/eslint-config/next.js`: a verb the tree does not use yet is added there in the same diff as the service that needs it, which is how coining one stays a reviewed decision. Full guidance in [naming.md](naming.md).
- **`handle-`** is the write-orchestration verb for event/webhook handlers (Stripe-event or lifecycle-hook entrypoints driving multi-step state transitions + side effects, e.g. `handle-pro-paid-reward.ts`).

The **folder** sets the layer (`_services/` = IO); the **verb** sets the direction (read vs write).

### Named exceptions to the verb prefix

- **A module that is not an operation keeps its noun name, and says so with a suffix.** `services-verb-prefix` exempts a basename ending in `-client`, `-app`, `-error`, `-errors`, `-crypto`, `-access`, `-cookie` or `-registration` (the `exemptSuffixes` option in `packages/eslint-config/next.js`), so `github-app.ts`, `linear-client.ts`, `jira-client.ts`, `jira-rest-client.ts`, `slack-client.ts`, `token-access.ts`, `webhook-registration.ts`, the named infrastructure error modules (`integration-configuration-error.ts`, `linear-request-error.ts`, `slack-request-error.ts`) and the shared `oauth-state-cookie.ts` are correct as they stand. Do not invent a `get-` name for a client factory, and do not invent a new suffix to dodge the verb list: a module with neither a verb nor an exempt suffix is reported. The provider token cipher is uniformly `token-crypto.ts`.
- **Every other basename opens with a verb from the vocabulary.** The read verbs are the closed ADR-0011 set; the write verbs are the `writeVerbs` option, which is the open set the tree uses today. Coining a precise domain verb for a distinct domain transition is a one-line addition there, reviewed in the diff, and the report names the file to edit. `get-all-…` and `get-paginated-…` are reported by name: one `list-` entrypoint takes an options object.
- **In a non-exempt service file, an exported function is named after the file.** `get-plan.ts` exports `getPlan` and nothing else callable; a second exported function is reported and belongs in its own file or in `_helpers/`. The comparison ignores letter case, so a proper noun keeps its house spelling (`get-github-installation.ts` exports `getGitHubInstallation`).
- **`*.inngest.ts`, `*.schema.ts`, `index.ts`, `_`-prefixed and test files are exempt** from `services-verb-prefix` and `require-service-output-type`; `services-no-bare-error` still applies to all of them. The suffix is load-bearing, not decoration: it is also why `handle-linear-oauth-revoked.inngest.ts` may carry `handle-` without colliding with the verb reserved for the one webhook orchestration per Tracker.

### A live external identifier survives a file move

Renaming or relocating a `*.inngest.ts` service must not change its Inngest function `id`, its trigger `event` or `cron` strings, its concurrency key, retry count or idempotency key. Those strings are the running system's identity: changing one orphans in-flight runs. The same holds for a webhook deduplication key prefix (`webhook:<provider>:…` rows in `rateLimit`, with the SHA-256-of-raw-body fallback when the delivery header is absent), whose prefix resets replay protection across a deploy if edited. It is also why a `handle-` webhook service takes the raw body alongside the parsed payload. The Inngest client id stays in `src/server/inngest/index.ts`. When you move such a file, diff the identifier lines and confirm they are untouched.

## Transport-agnostic services (Option B)

- A `_services/` function **never imports tRPC** (`@/server/trpc`, `@/lib/trpc`). It is callable from a tRPC procedure, an Inngest job, or a server action with no HTTP round-trip.
- The **type source of truth** is the service's return type, exported from the service file as `<Service>Output`: `export type GetUserOutput = Awaited<ReturnType<typeof getUser>>`. The alias is named after the file's own service and built from `typeof` it, so a `ReturnType` of some other function does not stand in for it. Do **not** use `inferProcedureOutput` as the canonical output type: `require-service-output-type` reports it, and `inferRouterOutputs`, in consumer code.
- A service **throws a `DomainError` subclass** for an expected failure, never `TRPCError` and never a bare `Error`. The vocabulary lives in `@/server/errors/domain-errors` (`NotFoundError`, `ConflictError`, `BadRequestError`, `ForbiddenError`, `PreconditionFailedError`) and exists since migration step 3, so an extracted service throws it from day one. The base tRPC procedure maps the code and the message back to a `TRPCError`, so no procedure try/catches for mapping. Authority: `docs/adr/0012-domain-errors-and-transport-mapping.md`; display channels in [errors.md](errors.md).

```ts
// _domains/animal/_services/get-animal.ts
import { prisma } from "@workspace/db";

import { NotFoundError } from "@/server/errors/domain-errors";

export async function getAnimal(id: string) {
  const animal = await prisma.animal.findUnique({ where: { id } });
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

- **Identity and transport policy stay in the procedure**: `UNAUTHORIZED`, rate limiting (`TOO_MANY_REQUESTS`) and plan-limit denials have no domain-error equivalent. An authorization check that needs a loaded resource (membership, ownership) belongs in the service that loads it, as a `ForbiddenError`.
- **A service takes plain named values, never the transport's context.** The router resolves what the service needs and passes it by name (`headers: await headers()`, `userId`, an entity id). A service never reads the tRPC `ctx` and never calls `next/headers` itself. "Transport-agnostic" is wider than "does not import tRPC": taking `ctx` as a parameter would satisfy the lint rule and still bind the service to one transport.
- **A service reads the fact it decides on rather than receiving it from its caller.** `stopImpersonate` calls `auth.api.getSession` itself instead of taking `impersonatedBy` from the procedure, so the rule it enforces holds for any future transport. The cost is one extra read on a rare action, which is the right trade.
- **A service may call another service.** A multi-step preamble shared by several services becomes its own read service rather than being inlined N times: `get-jira-access.ts`, `get-linear-access.ts` and `get-monthly-churn-rate.ts` are each consumed by another service. The caller forwards its injected client so one test covers both.
- **A service returns what the boundary needs to report.** `update-feedback-status` returns `previousStatus` beside the stored row so the route can name the transition without a second read.
- **Inject the Prisma client only where there is a branch worth pinning.** A service holding an authorization check or a `DomainError` branch takes a trailing `db: typeof prisma = prisma` and is tested with a fake; a pass-through read imports `prisma` directly. A service that delegates its check to another service forwards the client so one test covers both. 83 services carry the parameter today; the criterion, not the count, is the rule.
- **The same operation may exist twice when the authorization differs.** `inbox/_services/update-feedback-status.ts` and `api/v1/agent/feedbacks/[id]/status/_services/update-feedback-status.ts` are kept apart on purpose: one authorizes a Member of the Organization, the other a Project owned by the token's Organization, and they record a different Status actor. Merging them needs a "caller scope" concept; until that exists, a DRY merge would silently widen authorization across transports. They also diverge on a no-op status set: the dashboard service emits `feedback/status-changed` anyway, the agent service skips the fan-out (ADR-0007). That asymmetry is intended, because an agent re-sets what it just read while a human toggling a Status does not.
- **The one sanctioned exception to transport agnosticism** is `api/v1/agent/_services/require-agent-auth.ts`, which returns `AuthenticatedAgentToken | NextResponse`. Its 401, 403 and 429 carry headers and body fields no `DomainError` can express, and it does IO, so it lives in `_services/` and is a transport guard by design. It is not a precedent for handlers posing as services: no other service may return a `Response`.

## tRPC router

- `trpc-router.ts` is **thin transport at the scope root** (sibling of `_services/`; for a route, colocated with `page.tsx`).
- Procedures are **inlined** in the router when thin: auth procedure + zod `.input()` + one service call. A fat procedure wrapper is a smell → push logic into the service.
- Routers **compose hierarchically** following the route tree: a parent router mounts child routers. No god-router importing dozens of operations — distribute across sub-segment routers.
- **A child segment may own `_services/` and no router of its own**, with its procedures inlined in the nearest ancestor router. Readability of one API surface is the criterion, not the file count: the account scope keeps its ten operations in one file, and the Project scope keeps 44 across three segments in `(project)/trpc-router.ts` for the same reason. Six segments have a `_services/` bucket and no `trpc-router.ts` today. Introduce a segment router when the parent stops being readable in one pass, not because a segment exists. The "one router per scope" rule above still holds: what varies is which scope is the router's.
- **The undo half of a plan-gated capability is never plan-gated.** `linkRepo`, `linkTeam` and `linkProject` sit behind `enforceFeature`; `unlinkRepo`, `unlinkTeam` and `unlinkProject` are plain `protectedProcedure`, so a downgraded Organization can always disconnect what it connected while paying. Gating the undo strands a User in a state they cannot leave without paying. Same rule for any future disconnect, revoke or delete behind a feature gate.
- **The procedure key drops the entity its router already carries.** `createOrganization` mounted on the organization router is `organization.create`, not `organization.createOrganization`. Two exceptions: when the service names something other than the router's entity, the key is the full service name (`public.getGithubStars`, `billing.subscription.getStatus`, `feedback.listDistinctPageUrls`); and a plural operation colliding with its singular sibling takes a `Many` suffix rather than re-adding the entity (`feedback.deleteMany`, `feedback.updateManyStatus`).

```ts
// _domains/animal/trpc-router.ts
import { router } from "@/server/trpc/trpc";
import { getAnimal } from "./_services/get-animal";
import { animalIdSchema } from "./_services/animal.schema";

export const animalRouter = router({
  get: professionalProcedure
    .input(animalIdSchema)
    .query(({ input }) => getAnimal(input.id)),
});
```

## Helpers vs services vs types

- **`_helpers/`** = pure **behavioral** functions only (no IO): formatters, label maps, calculators, slug generators, nuqs `search-params` parsers, and **pure predicates** that operate on already-loaded inputs.
- **Nondeterministic is not the same as IO.** `crypto.randomBytes` is a local call, so a generator built on it is a helper: `project/_helpers/generate-api-key.ts` and `generate-public-id.ts` are helpers, not services.
- **Predicates split by IO, not verb:** `isSubscriptionActive(sub)` (pure) → `_helpers/`; `hasActiveSubscription(userId)` (queries to answer) → `_services/`. A pure predicate must never fetch its own data; if it needs to, it has become an IO-predicate and moves to `_services/`.
- **`_types/`** = standalone, hand-written, isomorphic shared types. A type derived from a service stays **in** that service file.

## External libraries

Placement follows the **domain decision, not the dependency**. Thin domain-agnostic SDK adapters → root `@/server/<lib>/` (e.g. `@/server/stripe/`). Domain logic that _happens_ to call the SDK stays in the domain's `_services/`. Test: _"If I swapped the provider, does this file's reason for existing change?"_ Yes → domain service. No → `@/server/<lib>/`. `@/server/` takes the adapter only under its own two conditions (wiring, or a cross-cutting abstraction two domains or transports need): every Tracker and Notification channel client failed that test and lives in `@/app/_domains/integration/_services/<provider>/`.

## Client/server boundary

- A `'use server'` directive belongs **only** in a `*.server.action.ts` file, at module level or inside a function: a module-level one turns every export into a public endpoint, and a function-level one (an inline server action) mints the same endpoint under no name a reader can search for. A server component needs no directive, and an infrastructure helper must be called through a service that checks who is asking.
- A client file (`'use client'` / `*.client.tsx`) must **not** import from a `_services/` path — **except** `*.schema.ts` and **type-only imports** (`import type { … }`): TS erases those at compile time, so they cannot leak server code into the bundle, and the service return type is the type source of truth. For runtime values, use a tRPC hook or a server component instead.
- A client file must **not** import a **runtime value** from `@/server/**` either: the folder holds wiring and server-only cross-cutting abstractions, so the import leaks them into the bundle, and `instanceof DomainError` would not survive serialization anyway (branch on `error.data.code`). Type-only imports are free. A value a client legitimately needs does not belong in the server folder: it moves to `@/utils/` or `@/lib/`, as the public asset URL builder did (`@/utils/url/resolve-s3-url`). Any remaining exception is a named pattern in `packages/eslint-config/next.js`, not a disable comment.
- Container hooks (`use-*.ts`) own form state + mutation + optimistic update + toast + invalidation, returning `{ form, onSubmit, isPending }`. They live in their owning scope's `_features/` slice, next to the UI they drive. Extract a hook only on real logic or reuse; a trivial single `useQuery` stays inline.

## Enforced by ESLint

`no-client-import-of-services` (exempts `*.schema.ts` and type-only imports),
`no-client-import-of-server-folder` (no runtime import of `@/server/**` from a client module; type imports and the named allowlist excepted), `services-no-trpc-import`,
`schema-must-be-pure-zod`, `no-feature-nesting`,
`services-verb-prefix` (the verb list, the banned `update` synonyms, the process verbs, `get-all-`/`get-paginated-`, the exempt module suffixes, and the exported function's name),
`require-service-output-type` (a read service exports `<Service>Output` built from `typeof` its own service; `inferProcedureOutput` and `inferRouterOutputs` are reported wherever a consumer uses them),
`services-no-bare-error` (throw a `DomainError` subclass, not `new Error(...)`; always on since step 4, not agent-gated),
`require-use-client-suffix` (exempts `use-*`),
`require-server-action-suffix` (a `'use server'` directive at module or function level). See `packages/eslint-config/local-rules/`.
