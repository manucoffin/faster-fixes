# Error display conventions

How errors surface to the user. Implements `docs/adr/0012-domain-errors-and-transport-mapping.md`.

> **What exists today.** Everything below is live since migration step 4, with one exception:
> `@/server/errors/` holds `domain-errors`, `http-response` (`domainErrorResponse`) and
> `non-retriable` (`rethrowDomainErrorsAsNonRetriable`), but no `next-interrupts`. The
> `interruptOnDomainError` helper is deferred until a page actually calls a service that throws;
> until then, use the preferred `find-` plus `notFound()` pattern.

Errors travel from a service throw, through a transport boundary, to one of four client display channels. Services throw `DomainError` subclasses (`NotFoundError`, `ConflictError`, `BadRequestError`, `ForbiddenError`, `PreconditionFailedError`) from `@/server/errors/domain-errors`; each boundary maps the code to its transport. Unexpected (non-`DomainError`) failures are masked as `Something went wrong. Please try again.` and logged server-side with their `cause` chain.

A second-level subclass of one of the five is allowed when a caller has to tell cases apart, and then carries its own fields and its own copy: the three expected Jira failures (`JiraNotConnectedError`, `JiraReauthRequiredError`, `JiraIssueConfigurationError` in `@/server/jira/errors`) extend `PreconditionFailedError`, so `instanceof` discriminates them while the transported code stays `PRECONDITION_FAILED`. The five _codes_ remain a closed set: a new code amends ADR 0012.

Client code never imports `@/server/errors/*` and never relies on `instanceof DomainError` (it does not survive serialization). Branch on the transported code instead: `error.data.code` (tRPC).

## The four display channels

- **Mutations (tRPC mutation / server action): toast.** Read the message from the failed mutation/action and show it via the Sonner toast. The message is already final copy for `DomainError`s, and an `INTERNAL_SERVER_ERROR` arrives pre-masked, so toasting `error.message` never leaks an internal message.
- **Queries (tRPC query): `matchQueryStatus`.** Handle the `Errored` branch declaratively (see [frontend.md](frontend.md)); render `error.message`, never a raw stack.
- **Forms (invalid input): zod field errors.** Validation failures surface as per-field messages from the zod schema, not a toast. tRPC `BAD_REQUEST` with a `ZodError` cause is exposed under `error.data.zodError`.
- **Render crashes and navigation interrupts: route boundaries.** `error.tsx` (render crash), `not-found.tsx` (`notFound()`), `forbidden.tsx` (`forbidden()`), `unauthorized.tsx` (`unauthorized()`). Root `error.tsx` / `global-error.tsx` are the catch-all; a per-shell `error.tsx` exists to render the same screen inside its layout, not to change the copy. An error boundary receives `error` and `retry`.

## Boundary conventions

- Every boundary file renders the shared `ErrorScreen` (`@/app/_components/error-screen`) with copy from `@/app/_constants/error-screens` and its actions as children (a retry button, a link out). Do not hand-roll the layout and do not inline the copy: six files use it today (`app/{error,global-error,not-found,forbidden,unauthorized}.tsx` and `app/(authenticated)/error.tsx`, which keeps the sidebar and the header on a dashboard render error).
- A boundary must never render `error.message`: Server Component errors carry a masked digest, and an unexpected message may leak internals. Log the raw error in `useEffect`; show fixed copy to the user.
- `global-error.tsx` must declare its own `<html>`/`<body>` and import global styles; it has no metadata export (use a plain `<title>`).
- RSC preferred pattern for "missing" stays `find-` (nullable) + explicit `notFound()` in the page. An `interruptOnDomainError` catch-handler, mapping `NotFoundError` to `notFound()` and `ForbiddenError` to `forbidden()`, is the fallback for throws from deeper service calls: write it in `@/server/errors/next-interrupts` with its first caller.
- Route handlers map a thrown `DomainError` with `domainErrorResponse` (`@/server/errors/http-response`) and rethrow when it returns `null`, so a bug keeps its 500. The handler's own transport codes stay at the boundary: a 422 validation failure, a 429 with its headers, a missing scope or a plan limit with its counters is a transport fact, not a domain error.

## Anti-patterns

- Never show a raw `error.message`, stack, or `digest` to the user.
- Never `instanceof DomainError` in client code, or import server error modules into a `.client.tsx` / `"use client"` module.
- Never toast a validation error that belongs inline on a form field.
- Never add a per-shell `error.tsx` that duplicates `ErrorScreen`'s markup.
