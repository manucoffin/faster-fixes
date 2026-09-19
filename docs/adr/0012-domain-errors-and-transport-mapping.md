# Domain errors and transport mapping

Transport-agnostic services raised a question the migration surfaced immediately: what does a service throw? Pre-migration procedures threw `TRPCError({ code: "CONFLICT" })`. Extracting them into services that throw bare `Error` turns every expected business rejection into an `INTERNAL_SERVER_ERROR`: monitoring cannot tell a user error from a crash, clients cannot branch on the code, and the user-facing message survives only because the transport does not yet mask 500 messages, which is exactly the hardening we want to be able to add. The governing idea: **expected failures are domain facts, not transport facts, and there is exactly one vocabulary for them.** A service states what went wrong with a typed error carrying final user copy; each boundary translates that fact exactly once into its own dialect.

## Status in this repo

Accepted, committed 2026-09-18 with the step 3 prerequisites, and implemented in two instalments: the vocabulary and the tRPC mapping with step 3, every remaining boundary with step 4. Committing it before step 4 rather than with it gave the vocabulary a local authority from the commit that introduced it, which is the one every extracted service depends on.

**Live since step 3** (commit `f2c8d60`): `apps/web/src/server/errors/domain-errors.ts`, the five subclasses with zero imports, and the tRPC mapping middleware on the base procedure, which every derived procedure inherits. A service extracted in step 3 throws a `DomainError` subclass and the client sees the same code and the same message as before.

**Live since step 4:**

- **HTTP mapping for route handlers**: `src/server/errors/http-response.ts` exports `domainErrorResponse(error)` with the 1:1 status map (400, 403, 404, 409, 412) and `null` for anything else. Its only callers are the two agent API route handlers (`api/v1/agent/feedbacks/route.ts` and `api/v1/agent/feedbacks/[id]/status/route.ts`), which are also the only route handlers reaching a service that can throw.
- **The route boundary hierarchy**: six files, `app/{error,global-error,not-found,forbidden,unauthorized}.tsx` plus `app/(authenticated)/error.tsx`, all rendering `ErrorScreen` (`@/app/_components/error-screen`) with fixed copy from `@/app/_constants/error-screens`. None reads `error.message` or `digest`.
- **Non-retriable Inngest failures**: `src/server/errors/non-retriable.ts` exports `rethrowDomainErrorsAsNonRetriable`, used by the three functions whose bodies can receive a Jira `DomainError` (`create-jira-issue`, `sync-feedback-status-to-jira`, `sync-jira-issue-status`). The other fourteen reach no throwing service and stay unwrapped.
- **Masking and logging**: the `errorFormatter` replaces every `INTERNAL_SERVER_ERROR` message with `Something went wrong. Please try again.` and keeps `data.zodError` for a `BAD_REQUEST` caused by a `ZodError`. The tRPC route handler mounts `logTRPCError` (`@/server/trpc/log-trpc-error`) as its `onError`, which `console.error`s the original with its `cause` chain. No logger and no monitoring provider was introduced. `lib/trpc/handle-trpc-error.ts`, which had no caller, is retired as `_deprecated_handle-trpc-error.ts`.
- **`services-no-bare-error` always on**: at `error` for `**/_services/**` outside the agent gate, so the pre-commit hook rejects a bare `Error` in a service. Its 28 remaining bare `Error` sites in `src/server/**` were infrastructure and had to keep surfacing as a 500. **Amended by step 5:** see amendment 4.
- **The expected Jira errors absorbed into the vocabulary**: `JiraNotConnectedError`, `JiraReauthRequiredError` and `JiraIssueConfigurationError` (`src/app/_domains/integration/_services/jira/jira-errors.ts`) extend `PreconditionFailedError`. `JiraRequestError` and the mailer `EmailError` are infrastructure and stay plain `Error`, and the widget client `ApiError` lives in the published `widget-core` package, outside the app, so no legacy error module exists to deprecate or ban.

**Not built:**

- **Next.js interrupts** (`interruptOnDomainError`): no RSC page calls a service that can throw, so the helper would have no caller. See amendment 2.
- **Server actions**: the action client branch. Inert here, since the repo has no `next-safe-action` client and no `*.server.action.ts` module.

`no-client-import-of-server-errors` was raised from `off` to `error` in step 3, once `src/server/errors/` existed, and reports zero violations.

### Amendments

Step 4 amended three of the decisions below and step 5 a fourth, each recorded inline where it applies:

1. **A second-level subclass is allowed when a caller must tell cases apart**, as long as its code is still one of the five. The set of _codes_ stays closed at five; the set of classes does not. Live in the three Jira classes, which several callers discriminate with `instanceof`.
2. **RSC interrupts are deferred to their first caller.** The helper is described here but deliberately not written: not-found is a nullable `find-` plus an explicit `notFound()` in every page today. It lands with the first service throw that reaches a page.
3. **The agent API keeps its transport codes at its boundary.** `UNAUTHORIZED` (401), `FORBIDDEN` (403, missing scope), `RATE_LIMITED` (429 with its headers), `VALIDATION_ERROR` (422) and `RESOURCE_LIMIT_EXCEEDED` (403 with its counters) carry headers and fields a `DomainError` cannot, and three of them have no domain equivalent. They stay in `route.ts` beside `domainErrorResponse`, which handles the thrown `DomainError`s only.
4. **The server folder never joined the bare-error rule. Its domain-bound files left instead.** Step 5 moved them into the `_services/` bucket of the domain that owns them, where `services-no-bare-error` already applies, so they are covered with no change to the rule. Their bare `Error` sites became named infrastructure classes: one request error per provider for an upstream failure (`LinearRequestError`, `SlackRequestError`, next to the existing `JiraRequestError`) and one configuration error for a missing environment value or an impossible configuration (`IntegrationConfigurationError`). None became a `DomainError`: they stay expected-by-nobody failures that surface as a masked 500 at a transport and keep their default retries in a durable function. What stayed in `src/server/` is wiring and cross-cutting abstraction, out of the rule's reach by design, and its few bare `Error` sites (the Stripe plugin secret check, the Plan enforcement programmer error, the unsupported storage provider) are left as they are. That folder is guarded by an always-on import lock instead, described in the architecture document.

## Decisions

### The vocabulary

- **A `DomainError` hierarchy in `src/server/errors/domain-errors.ts`, with zero imports**, so any service can throw it lint-clean. A closed set of subclasses, one per failure kind: `NotFoundError`, `ConflictError`, `BadRequestError`, `ForbiddenError`, `PreconditionFailedError`. The base class carries an abstract `code` typed as the union of those five strings.
- **Codes mirror tRPC's code strings without importing tRPC**, and map 1:1 to HTTP statuses (404, 409, 400, 403, 412), so every boundary mapping is a pass-through.
- **Services throw `DomainError` subclasses for expected failures, never bare `Error`.** The message is final user-facing copy. The class name carries the semantics; no semantic string codes. **Amended by step 4:** a second-level subclass is allowed when a caller must tell cases apart, and then carries its own fields and its own copy; its code is still one of the five. By construction: a `DomainError` is expected and safe to show; anything else escaping a service is a bug.
- **The set of codes is closed at five.** A sixth code requires amending this ADR. Pressure to add finer kinds means the information belongs in the message, not the taxonomy.
- **One vocabulary; legacy ones are absorbed.** Any pre-existing error hierarchy of _expected_ failures is retired and its consumers converted. **Amended by step 4:** a pre-existing class that represents infrastructure, not an expected business rejection, stays a plain `Error` instead (`JiraRequestError`, the mailer `EmailError`), because it must keep surfacing as a masked 500.
- **`UNAUTHORIZED` is deliberately absent.** Identity is established by procedure middlewares or layout interrupts before a service runs. `ForbiddenError` exists for permission facts (authenticated but not permitted, HTTP 403).

### Server boundaries, each mapping exactly once

- **tRPC: one middleware on the base procedure.** If `result.error.cause` is a `DomainError`, rethrow `new TRPCError({ code, message, cause })`. Every derived procedure inherits it. Procedures never try/catch for mapping.
- **Route handlers: a `DomainError` to `Response` helper** using the 1:1 status map, returning `null` for non-domain errors so the caller keeps its own 500 path. Webhooks decide per endpoint whether a domain rejection is a 4xx or a swallowed 2xx. **Amended by step 4:** a handler's own transport codes stay at the boundary beside the helper. Codes that carry headers or extra body fields, or that have no domain equivalent (rate limiting, a missing scope, a 422 validation failure, a plan limit with its counters), are transport facts and are not pushed into the vocabulary. **Amended by step 5:** that decision is taken once for all Tracker webhooks and written down as the webhook failure policy table in the architecture document, so a new Tracker follows it instead of rediscovering it.
- **React Server Components: Next.js interrupts.** A helper maps `NotFoundError` to `notFound()` and `ForbiddenError` to `forbidden()`. The preferred pattern stays a nullable `find-` service plus an explicit `notFound()` in the page; the helper is the fallback for throws from deeper calls. **Amended by step 4:** the helper is deferred to its first caller rather than written ahead of one, since every page uses the preferred pattern today. `forbidden.tsx` and `unauthorized.tsx` exist regardless, so the interrupts have a destination.
- **Inngest (if present): a `DomainError` is a non-retriable failure.** A business rejection never succeeds on retry. A boundary helper rethrows it as `NonRetriableError`. Infrastructure errors keep default retries.
- **Server actions (if present): the action client's error handler gains a `DomainError` branch** returning `{ message, code }`.
- **Authorization denials (if a policy library exists) are `ForbiddenError`.**

### Unexpected errors: mask and log

- **Unexpected errors are masked at user-facing boundaries.** The tRPC `errorFormatter` replaces any `INTERNAL_SERVER_ERROR` message with generic copy. This is safe only because all legitimate user copy travels as mapped domain codes, so a 500 message is by definition internal and must not leak. Zod field errors stay exposed under `data.zodError` for `BAD_REQUEST`.
- **Masking ships only after every service throws domain errors** and a sweep confirms no bare-`Error` user copy remains. Masking earlier hides legitimate messages.
- **Every masking point logs the original error** with its `cause` chain.

### Client display conventions

- Mutations toast the message. Queries render the `Errored` branch of the query-status matcher. Forms map Zod field errors inline; a domain error from the mutation still toasts. Render crashes and interrupts hit a complete boundary hierarchy (`error.tsx`, `global-error.tsx`, `not-found.tsx`, `forbidden.tsx`, `unauthorized.tsx`, plus one `error.tsx` per shell that must survive a crash) rendering one shared error screen, never `error.message`.
- Client code never imports the server error module and never uses `instanceof`; it branches on the transported code.

### Enforcement and sequencing

- `services-no-bare-error` lands at `warn` with the vocabulary, acting as a guardrail during the migration, and flips to always-on `error` once the tree is clean. It is always on for `**/_services/**` since step 4. Step 5 brought the relocated server files under it by moving them into `_services/` buckets rather than by widening the rule's scope.
- `no-client-import-of-server-errors` lands straight at `error` while zero violations are possible.
- A ban on importing any retired legacy error module lands in the PR that converts its last consumer. Inert here: no module was retired, so step 4 added no ban rule.
- Not lint-enforced (heuristic): Inngest helper adoption, RSC catch-handler usage, copy quality.
- **The vocabulary and the tRPC middleware land before the first procedure is extracted into a service.** Otherwise each extraction destroys the codes irrecoverably. All other boundaries, masking, and the boundary hierarchy land after the extraction completes.

## Considered Options

- **Per-boundary vocabularies (status quo).** Rejected: partial systems coexisting, denials falling through every net, and a new convention (bare `Error`) about to be minted.
- **Bare `Error` from services.** Rejected: collapses every expected rejection to a 500 and blocks masking forever.
- **`TRPCError` from services.** Rejected: violates transport agnosticism; meaningless in a job or an RSC.
- **Result types (`{ ok, error }` unions or a Result library).** Rejected: the signature change is viral, and the surrounding ecosystem (tRPC, React Query, Inngest, Next interrupts) is exception-based, so the Result is converted back to a throw at every boundary anyway.
- **Per-procedure try/catch mapping.** Rejected: fat procedures, N copies of the mapping.
- **Semantic string codes plus a code-to-transport table.** Rejected: no consumer needs fine-grained codes; the table is one more thing to forget.
- **One `DomainError` class with a `code` constructor parameter.** Rejected on ergonomics: `new ConflictError(msg)` reads better, enables `instanceof` per kind, and makes the closed set visible.

## Consequences

- New `src/server/errors/` module: the vocabulary plus boundary helpers.
- The tRPC init gains the mapping middleware immediately and the masking plus logging after the migration.
- Any legacy error module is deprecated to a stub and its import banned. None was, here: the three expected Jira classes were re-parented in place and the two infrastructure ones kept.
- Two lint rules guard the system: `services-no-bare-error` and `no-client-import-of-server-errors`. The legacy-import ban has nothing to ban.
- Implementation is phased: vocabulary and tRPC mapping first, app-wide consolidation after the services migration.
