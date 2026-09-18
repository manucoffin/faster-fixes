# Error display conventions

How errors surface to the user. Implements `docs/architecture/migration-kit/adrs/domain-errors-and-transport-mapping.md`.

> The `@/server/errors/*` modules below land in migration step 4. Until then this file is the
> target convention, not the current state of the repo.

Errors travel from a service throw, through a transport boundary, to one of four client display channels. Services throw `DomainError` subclasses (`NotFoundError`, `ConflictError`, `BadRequestError`, `ForbiddenError`, `PreconditionFailedError`) from `@/server/errors/domain-errors`; each boundary maps the code to its transport. Unexpected (non-`DomainError`) failures are masked as a generic message and logged server-side.

Client code never imports `@/server/errors/*` and never relies on `instanceof DomainError` (it does not survive serialization). Branch on the transported code instead: `error.data.code` (tRPC).

## The four display channels

- **Mutations (tRPC mutation / server action): toast.** Read the message from the failed mutation/action and show it via the Sonner toast. The message is already final copy for `DomainError`s; `INTERNAL_SERVER_ERROR` arrives pre-masked as the generic masked message (step 4 defines the exact copy).
- **Queries (tRPC query): `matchQueryStatus`.** Handle the `Errored` branch declaratively (see [frontend.md](frontend.md)); render `error.message`, never a raw stack.
- **Forms (invalid input): zod field errors.** Validation failures surface as per-field messages from the zod schema, not a toast. tRPC `BAD_REQUEST` with a `ZodError` cause is exposed under `error.data.zodError`.
- **Render crashes and navigation interrupts: route boundaries.** `error.tsx` (render crash), `not-found.tsx` (`notFound()`), `forbidden.tsx` (`forbidden()`), `unauthorized.tsx` (`unauthorized()`). Root `error.tsx` / `global-error.tsx` are the catch-all; per-shell files override copy.

## Boundary conventions

- All `error.tsx` / `global-error.tsx` files render the shared `ErrorScreen` (`@/app/_components/error-screen`), passing shell-specific copy and an optional home link. Do not hand-roll a fourth copy of the layout.
- A boundary must never render `error.message`: Server Component errors carry a masked digest, and an unexpected message may leak internals. Log the raw error in `useEffect`; show fixed copy to the user.
- `global-error.tsx` must declare its own `<html>`/`<body>` and import global styles; it has no metadata export (use a plain `<title>`).
- RSC preferred pattern for "missing" stays `find-` (nullable) + explicit `notFound()` in the page. The `interruptOnDomainError` catch-handler (`@/server/errors/next-interrupts`) is only for throws from deeper service calls.

## Anti-patterns

- Never show a raw `error.message`, stack, or `digest` to the user.
- Never `instanceof DomainError` in client code, or import server error modules into a `.client.tsx` / `"use client"` module.
- Never toast a validation error that belongs inline on a form field.
- Never add a per-shell `error.tsx` that duplicates `ErrorScreen`'s markup.
