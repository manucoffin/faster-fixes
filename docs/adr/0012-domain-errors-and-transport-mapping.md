# Domain errors and transport mapping

Transport-agnostic services raised a question the migration surfaced immediately: what does a service throw? Pre-migration procedures threw `TRPCError({ code: "CONFLICT" })`. Extracting them into services that throw bare `Error` turns every expected business rejection into an `INTERNAL_SERVER_ERROR`: monitoring cannot tell a user error from a crash, clients cannot branch on the code, and the user-facing message survives only because the transport does not yet mask 500 messages, which is exactly the hardening we want to be able to add. The governing idea: **expected failures are domain facts, not transport facts, and there is exactly one vocabulary for them.** A service states what went wrong with a typed error carrying final user copy; each boundary translates that fact exactly once into its own dialect.

## Status in this repo

Accepted, committed 2026-09-18 with the step 3 prerequisites, and implemented in two instalments. Committing it now rather than with step 4 gives the vocabulary a local authority from the commit that introduces it, which is the one every extracted service depends on.

**Live since step 3** (commit `f2c8d60`): `apps/web/src/server/errors/domain-errors.ts`, the five subclasses with zero imports, and the tRPC mapping middleware on the base procedure, which every derived procedure inherits. A service extracted in step 3 throws a `DomainError` subclass and the client sees the same code and the same message as before.

**Added by step 4**, so the decisions below describing them are the target, not the current state:

- **HTTP mapping for route handlers**: `domainErrorResponse(error)` and the 1:1 status map. No route handler maps a `DomainError` today, which is why step 3 lets no function reachable from a route handler, a webhook or an Inngest function start throwing one.
- **Next.js interrupts** (`interruptOnDomainError`) and the complete route boundary hierarchy (`error.tsx`, `global-error.tsx`, `not-found.tsx`, `forbidden.tsx`, `unauthorized.tsx`).
- **Non-retriable Inngest failures**: `rethrowDomainErrorsAsNonRetriable`. No Inngest function uses a non-retriable error today.
- **Server actions**: the action client branch. Inert here, since the repo has no `next-safe-action` client and no `*.server.action.ts` module.
- **Masking and logging**: the `errorFormatter` replaces every `INTERNAL_SERVER_ERROR` message with generic copy and logs the original with its `cause` chain. It ships last, because it hides any meaningful copy still thrown as a 500.
- **`services-no-bare-error` always on**: step 3 raises it to `error` per locked scope through the `migratedScopes` allowlist; step 4 makes it unconditional and sweeps `src/server/**`.
- **Retiring the legacy error classes**: the six existing custom classes (four Jira token and request errors, the mailer `EmailError`, the widget client `ApiError`) are outside step 3 and none of them is detected by the kit's legacy-module grep.

`no-client-import-of-server-errors` is raised from `off` to `error` in step 3, once `src/server/errors/` exists.

## Decisions

### The vocabulary

- **A `DomainError` hierarchy in `src/server/errors/domain-errors.ts`, with zero imports**, so any service can throw it lint-clean. A closed set of subclasses, one per failure kind: `NotFoundError`, `ConflictError`, `BadRequestError`, `ForbiddenError`, `PreconditionFailedError`. The base class carries an abstract `code` typed as the union of those five strings.
- **Codes mirror tRPC's code strings without importing tRPC**, and map 1:1 to HTTP statuses (404, 409, 400, 403, 412), so every boundary mapping is a pass-through.
- **Services throw `DomainError` subclasses for expected failures, never bare `Error`.** The message is final user-facing copy. The class name carries the semantics; no per-case subclasses, no semantic string codes. By construction: a `DomainError` is expected and safe to show; anything else escaping a service is a bug.
- **The set is closed at five.** A sixth kind requires amending this ADR. Pressure to add finer kinds means the information belongs in the message, not the taxonomy.
- **One vocabulary; legacy ones are absorbed.** Any pre-existing error hierarchy is retired and its consumers converted.
- **`UNAUTHORIZED` is deliberately absent.** Identity is established by procedure middlewares or layout interrupts before a service runs. `ForbiddenError` exists for permission facts (authenticated but not permitted, HTTP 403).

### Server boundaries, each mapping exactly once

- **tRPC: one middleware on the base procedure.** If `result.error.cause` is a `DomainError`, rethrow `new TRPCError({ code, message, cause })`. Every derived procedure inherits it. Procedures never try/catch for mapping.
- **Route handlers: a `DomainError` to `Response` helper** using the 1:1 status map, returning `null` for non-domain errors so the caller keeps its own 500 path. Webhooks decide per endpoint whether a domain rejection is a 4xx or a swallowed 2xx.
- **React Server Components: Next.js interrupts.** A helper maps `NotFoundError` to `notFound()` and `ForbiddenError` to `forbidden()`. The preferred pattern stays a nullable `find-` service plus an explicit `notFound()` in the page; the helper is the fallback for throws from deeper calls.
- **Inngest (if present): a `DomainError` is a non-retriable failure.** A business rejection never succeeds on retry. A boundary helper rethrows it as `NonRetriableError`. Infrastructure errors keep default retries.
- **Server actions (if present): the action client's error handler gains a `DomainError` branch** returning `{ message, code }`.
- **Authorization denials (if a policy library exists) are `ForbiddenError`.**

### Unexpected errors: mask and log

- **Unexpected errors are masked at user-facing boundaries.** The tRPC `errorFormatter` replaces any `INTERNAL_SERVER_ERROR` message with generic copy. This is safe only because all legitimate user copy travels as mapped domain codes, so a 500 message is by definition internal and must not leak. Zod field errors stay exposed under `data.zodError` for `BAD_REQUEST`.
- **Masking ships only after every service throws domain errors** and a sweep confirms no bare-`Error` user copy remains. Masking earlier hides legitimate messages.
- **Every masking point logs the original error** with its `cause` chain.

### Client display conventions

- Mutations toast the message. Queries render the `Errored` branch of the query-status matcher. Forms map Zod field errors inline; a domain error from the mutation still toasts. Render crashes and interrupts hit a complete boundary hierarchy (`error.tsx`, `global-error.tsx`, `not-found.tsx`, `forbidden.tsx`, `unauthorized.tsx`) rendering one shared error screen, never `error.message`.
- Client code never imports the server error module and never uses `instanceof`; it branches on the transported code.

### Enforcement and sequencing

- `services-no-bare-error` lands at `warn` with the vocabulary, acting as a guardrail during the migration, and flips to always-on `error` once the tree is clean.
- `no-client-import-of-server-errors` lands straight at `error` while zero violations are possible.
- A ban on importing any retired legacy error module lands in the PR that converts its last consumer.
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
- Any legacy error module is deprecated to a stub and its import banned.
- Three lint rules guard the system.
- Implementation is phased: vocabulary and tRPC mapping first, app-wide consolidation after the services migration.
