# Error display conventions

How errors surface to the user. Implements `docs/adr/0012-domain-errors-and-transport-mapping.md`.

> **What exists today.** Everything below is live since migration step 4, with one exception:
> `@/server/errors/` holds `domain-errors`, `http-response` (`domainErrorResponse`) and
> `non-retriable` (`rethrowDomainErrorsAsNonRetriable`), but no `next-interrupts`. The
> `interruptOnDomainError` helper is deferred until a page actually calls a service that throws;
> until then, use the preferred `find-` plus `notFound()` pattern.

Errors travel from a service throw, through a transport boundary, to one of four client display channels. Services throw `DomainError` subclasses (`NotFoundError`, `ConflictError`, `BadRequestError`, `ForbiddenError`, `PreconditionFailedError`) from `@/server/errors/domain-errors`; each boundary maps the code to its transport. Unexpected (non-`DomainError`) failures are masked as `Something went wrong. Please try again.` and logged server-side with their `cause` chain.

A second-level subclass of one of the five is allowed when a caller has to tell cases apart, and then carries its own fields and its own copy: the three expected Jira failures (`JiraNotConnectedError`, `JiraReauthRequiredError`, `JiraIssueConfigurationError` in `@/app/_domains/integration/_services/jira/jira-errors`) extend `PreconditionFailedError`, so `instanceof` discriminates them while the transported code stays `PRECONDITION_FAILED`. The five _codes_ remain a closed set: a new code amends ADR 0012.

Client code never imports `@/server/errors/*` and never relies on `instanceof DomainError` (it does not survive serialization). Branch on the transported code instead: `error.data.code` (tRPC). Both halves are enforced: `local/no-client-import-of-server-folder` for the import, `local/no-client-domain-error-instanceof` for the always-false branch.

## Choosing among the five codes

**Prose only**, no rule, for this whole section and for "Telling a refusal from an outage" below: which of the five codes fits a failure, and whether a `catch` is reading the provider's status or the fact that something threw, are semantic judgements no linter makes.

- **A rejected input is `BAD_REQUEST`; an unmet state of the world is `PRECONDITION_FAILED`.** A wrong password, a rejected credential and an invalid or missing reset token are rejected inputs, not missing sessions, so they are `BadRequestError`. A well-formed, permitted request that fails because of something outside the caller's input (an unverified email, a disconnected Installation, a link the user must repair) is `PreconditionFailedError`. `ForbiddenError` stays for permission facts; `UNAUTHORIZED` does not exist, because identity is established at the transport edge before a service runs.
- **A message is never a machine sentinel.** When a client must branch on a case, reserve the transported **code** to that case in the service rather than shipping a marker string: `signInUser` throws `PreconditionFailedError("Verify your email address before signing in.")` for the unverified email and nothing else, so `login-form.client.tsx` can branch on `error.data?.code === "PRECONDITION_FAILED"` to keep offering the resend. A sentinel such as `ForbiddenError("EMAIL_NOT_VERIFIED")` fails twice: it leaks a machine token as user copy and it burns a code for nothing.
- **An unreachable branch is dropped, not re-coded under a wrong code.** The "session expired" race (a revocation between the context read and the Better Auth call) gets no new code and no `BadRequestError`. It surfaces as a masked 500 and the next request is refused at the transport edge.
- **Throw your own `DomainError` outside the `try` whose `catch` translates provider messages**, or the catch re-translates it into the wrong copy. The same throw-order discipline preserves branch precedence when several rejections are possible (password before OAuth in `deleteAccount`).
- **Known exception, accepted rather than missed:** `create-invitation.ts`, `accept-invitation.ts` and `reject-invitation.ts` pass Better Auth's own message through as `BadRequestError(error.message)`, so an un-audited upstream string reaches the user. The catch is narrowed to a 4xx `APIError` (from `better-auth/api`): a database failure or a Better Auth 5xx is rethrown untouched and keeps its 500 masking. These sites were inspected and kept; auditing the copy is tracked separately.

## Telling a refusal from an outage

An Integration that fails must not be marked **Reconnect required** for a transient outage (`CONTEXT.md`). Keeping that true is a code discipline, not a property of the error classes:

- **Do work that can fail for _our_ reasons before the `try` whose `catch` decides "the provider refused".** Decrypting a stored refresh token happens first, so a key or payload problem never flips an Installation to **Reconnect required**.
- **The catch discriminates on the provider's status**, not on the fact that something threw: a 4xx carrying `invalid_grant` or `unauthorized_client` is a refusal; anything else is rethrown untouched, writes nothing and emits nothing. A bare `catch {}` silently violates the invariant.
- **The upstream request error stays a plain `Error`** (`JiraRequestError`, `LinearRequestError`, `SlackRequestError`), so an outage keeps its retries.
- **Ordering:** a provider error may only be made non-retriable once refusal and outage are distinguishable. Wrapping first turns a brief provider outage into a permanently failed run and a lost Feedback mirror.
- **Classification coupled to message text is a trap.** `_helpers/slack/match-unhealthy-error.ts` substring-matches `error.message` against `channel_not_found`, `not_in_channel`, `is_archived`, `invalid_auth`, `account_inactive` and `token_revoked`. Rewording a `SlackRequestError` message in `slack-client.ts` turns a permanently broken link into an endless retry, or the reverse. Change the two together.

## The four display channels

Of the four, only the `Errored` branch of a query carries a rule, and only for one shape: `query.data ?? []` is reported by `local/no-restricted-patterns` (see [frontend.md](frontend.md)). The rest is **prose only**.

- **Mutations (tRPC mutation / server action): toast.** Read the message from the failed mutation/action and show it via the Sonner toast. The message is already final copy for `DomainError`s, and an `INTERNAL_SERVER_ERROR` arrives pre-masked, so toasting `error.message` never leaks an internal message.
- **Queries (tRPC query): `matchQueryStatus`.** Handle the `Errored` branch declaratively (see [frontend.md](frontend.md)); render `error.message`, never a raw stack.
- **Forms (invalid input): zod field errors.** Validation failures surface as per-field messages from the zod schema, not a toast. tRPC `BAD_REQUEST` with a `ZodError` cause is exposed under `error.data.zodError`.
- **Render crashes and navigation interrupts: route boundaries.** `error.tsx` (render crash), `not-found.tsx` (`notFound()`), `forbidden.tsx` (`forbidden()`), `unauthorized.tsx` (`unauthorized()`). Root `error.tsx` / `global-error.tsx` are the catch-all; a per-shell `error.tsx` exists to render the same screen inside its layout, not to change the copy. An error boundary receives `error` and `retry`.

## Boundary conventions

**Prose only**, no rule, for this whole section and for "Logging" below. The boundary files are the Next.js special files, exempt from the suffix and default export rules by definition, and what they render is a judgement about output.

- Every boundary file renders the shared `ErrorScreen` (`@/app/_components/error-screen`) with copy from `@/app/_constants/error-screens` and its actions as children (a retry button, a link out). Do not hand-roll the layout and do not inline the copy: six files use it today (`app/{error,global-error,not-found,forbidden,unauthorized}.tsx` and `app/(authenticated)/error.tsx`, which keeps the sidebar and the header on a dashboard render error).
- A boundary must never render `error.message`: Server Component errors carry a masked digest, and an unexpected message may leak internals. Log the raw error in `useEffect`; show fixed copy to the user. `digest` is not declared in the boundary props type at all (`{ error: Error; retry: () => void }`), so it is unrenderable by construction rather than by discipline.
- **Call `retry()`, not `reset()`.** Next passes `error`, `reset` and `retry`; `retry()` re-fetches and re-renders the boundary's children, where `reset()` only clears the error state.
- **Only the root `error.tsx` carries the `<main>` landmark**, because an error boundary replaces every nested layout below it. `not-found.tsx`, `forbidden.tsx` and `unauthorized.tsx` must **not**: they render inside the nearest layout, and `admin` and `(authenticated)` already own a `<main>`. A second one would nest.
- **Actions per screen:** `error.tsx` gets `Try again`; `unauthorized.tsx` gets a `Sign in` link (`Button asChild` plus `next/link` to `loginUrl` from `_constants/routes.ts`); not-found and forbidden are copy-only rather than inventing a "Return home" link. No support address is rendered while `SUPPORT_EMAIL` is still a placeholder.
- `global-error.tsx` must declare its own `<html>`/`<body>` and import global styles; it has no metadata export (use a plain `<title>`). It must also declare the two `next/font` families with the `--font-sans` and `--font-mono` variables and the same `next-themes` `ThemeProvider` as the root layout: `globals.css` drives dark mode off the `.dark` class (`@custom-variant dark`), not `prefers-color-scheme`, so without them the screen renders unstyled, and a hand-rolled theme script would be a second implementation. Verifying it needs a browser: the global boundary is a Client Component, so a root-layout failure serves Next's minimal `__next_error__` 500 document and the screen only paints after hydration. `curl` shows the framework shell; check that the response ships the boundary chunk, then look at it in a browser.
- RSC preferred pattern for "missing" stays `find-` (nullable) + explicit `notFound()` in the page. An `interruptOnDomainError` catch-handler, mapping `NotFoundError` to `notFound()` and `ForbiddenError` to `forbidden()`, is the fallback for throws from deeper service calls: write it in `@/server/errors/next-interrupts` with its first caller.
- Route handlers map a thrown `DomainError` with `domainErrorResponse` (`@/server/errors/http-response`) and rethrow when it returns `null`, so a bug keeps its 500. The handler's own transport codes stay at the boundary: a 422 validation failure, a 429 with its headers, a missing scope or a plan limit with its counters is a transport fact, not a domain error.
- **Where a published response differs from what the shared helper would produce, the published response wins and the helper supplies the status only.** An API with clients that cannot be updated writes one scope-local mapper, not one per route: `api/v1/feedback/_helpers/widget-error-response.ts` reuses `domainErrorResponse`'s status map but answers `{ error }` with no `code`, because that is the body widgets already installed on customer sites parse. Same rule for a Tracker webhook: the body a registered webhook already receives is the contract, so Linear and Jira echo the ignore reason and GitHub answers an ignored delivery exactly like an accepted one.

## Logging

- **One `console.error` per failure**, from the exported named function `logTRPCError` (`@/server/trpc/log-trpc-error`) mounted as the tRPC route handler's `onError`. It is a named export rather than an inline arrow so the logged shape is testable through the function tRPC actually calls.
- **Shape:** the prefix `tRPC <type> <path> failed with <code>` (`<unknown path>` when tRPC has none), then the `TRPCError`, then every link of the `cause` chain as a separate argument. **The walk stops on an already-seen cause**, so a self-referencing chain cannot hang a request.
- **Every failure is logged, expected codes included.** Filtering by code was considered and rejected: volume is low, and the expected failure a user reports is the one worth finding. If noise becomes real, the filter belongs in the logging provider.
- `console.error` only. No logger, no monitoring SDK and no `instrumentation.ts`: choosing a provider is a deliberate open decision, not an oversight.

## What masking does not touch

The `errorFormatter` replaces the **message** of an `INTERNAL_SERVER_ERROR` and nothing else. The code, the HTTP status, `data.zodError` and every non-500 message survive. `shape.data.stack` is left alone because tRPC only adds it when `config.isDev`, so it is not a leak to close. Provider wording that used to reach users (`Slack conversations.list failed: invalid_auth`, the Linear pickers) is now the generic sentence **by intent**: those strings name an API method, and the operator reads the original in the server log.

## Anti-patterns

- Never show a raw `error.message`, stack, or `digest` to the user. **Prose only**, no rule.
- Never `instanceof DomainError` in client code (`local/no-client-domain-error-instanceof`), or import server error modules into a `.client.tsx` / `"use client"` module (`local/no-client-import-of-server-folder`). Both are boundary rules and neither can be switched off by a disable comment.
- Never throw a bare `Error` or a `TRPCError` from a service: `local/services-no-bare-error` reports the first, and the `TRPCError` row of `local/no-cross-layer-import` confines `@trpc/server` to a router and `src/server/trpc/`.
- Never toast a validation error that belongs inline on a form field. **Prose only**, no rule.
- Never add a per-shell `error.tsx` that duplicates `ErrorScreen`'s markup. **Prose only**, no rule.
