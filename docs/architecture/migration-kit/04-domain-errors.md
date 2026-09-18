# Step 4: Domain errors

> End state: expected failures are `DomainError` subclasses thrown by services and mapped exactly once at every transport boundary; unexpected errors are masked and logged; the client displays errors through four fixed channels behind a complete boundary hierarchy; any legacy error vocabulary is gone; the error lint rules are always on.

Authority: `adrs/domain-errors-and-transport-mapping.md` (commit it with this step).

## Prerequisites

- Step 3 done. The vocabulary (`src/server/errors/domain-errors.ts`) and the tRPC mapping middleware already exist and every service throws domain errors, so the work here is the boundaries, the masking, the client, and the cleanup.

## Target state

### `src/server/errors/`

```
src/server/errors/
├── domain-errors.ts      # the vocabulary (from step 3), zero imports
├── http-response.ts      # domainErrorResponse(error): Response | null
├── next-interrupts.ts    # interruptOnDomainError(error): never
└── non-retriable.ts      # [if Inngest] rethrowDomainErrorsAsNonRetriable(error): never
```

```ts
// http-response.ts
const HTTP_STATUS: Record<DomainErrorCode, number> = {
  BAD_REQUEST: 400,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  PRECONDITION_FAILED: 412,
};

export function domainErrorResponse(error: unknown): Response | null {
  if (!(error instanceof DomainError)) return null;
  return Response.json(
    { error: error.message, code: error.code },
    { status: HTTP_STATUS[error.code] },
  );
}
```

```ts
// next-interrupts.ts
export function interruptOnDomainError(error: unknown): never {
  if (error instanceof DomainError) {
    if (error.code === "NOT_FOUND") notFound();
    if (error.code === "FORBIDDEN") forbidden();
  }
  throw error;
}
```

```ts
// non-retriable.ts  [if Inngest]
export function rethrowDomainErrorsAsNonRetriable(error: unknown): never {
  if (error instanceof DomainError) {
    throw new NonRetriableError(error.message, { cause: error });
  }
  throw error;
}
```

### Boundaries

| Boundary                             | Required behaviour                                                                                                                                                                                                             |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| tRPC procedures                      | Mapping middleware on the base procedure (step 3). No procedure contains a try/catch whose purpose is error translation.                                                                                                       |
| tRPC `errorFormatter`                | Replaces the message of any `INTERNAL_SERVER_ERROR` with one generic sentence. Exposes `data.zodError` when the code is `BAD_REQUEST` and the cause is a `ZodError`.                                                           |
| tRPC route handler `onError`         | Logs the original error with its `cause` chain. Masking never blinds debugging.                                                                                                                                                |
| Route handlers (`app/api/**`)        | Call `domainErrorResponse(error)` first; on `null`, keep their own 500 path with logging. Webhook endpoints decide per endpoint whether a domain rejection is a 4xx or a swallowed 2xx, based on the caller's retry semantics. |
| React Server Components              | Prefer `find-` (nullable) plus an explicit `notFound()` in the page. `.catch(interruptOnDomainError)` only for throws from deeper calls.                                                                                       |
| Inngest `[if present]`               | Every function body wraps its service calls so a `DomainError` becomes `NonRetriableError`. Infrastructure errors keep default retries.                                                                                        |
| Server actions `[if present]`        | The action client's `handleServerError` gains a `DomainError` branch before the generic one, returning `{ message, code }`.                                                                                                    |
| Authorization library `[if present]` | Denials throw `ForbiddenError`.                                                                                                                                                                                                |
| `authInterrupts`                     | Enabled in `next.config`, so `forbidden()` and `unauthorized()` work.                                                                                                                                                          |

### Client

- No client module imports `src/server/errors/*`. Client code branches on `error.data.code` (tRPC), never on `instanceof`.
- **Mutations** toast `error.message`.
- **Queries** render the `Errored` branch of `matchQueryStatus` (`src/utils/tanstack-query/match-query-status.ts`) with `error.message`, never a stack.
- **Forms** show Zod field errors inline through the resolver. A `DomainError` from the mutation still toasts.
- **Boundaries**: `src/app/error.tsx`, `src/app/global-error.tsx`, `src/app/not-found.tsx`, `src/app/forbidden.tsx`, `src/app/unauthorized.tsx` exist. All render one shared `ErrorScreen` component from root `_components/`, pass fixed copy, log the raw error in an effect, and never render `error.message` or `digest`. `global-error.tsx` declares its own `<html>` and `<body>` and imports the global stylesheet.

### Legacy vocabularies

Any pre-existing error class hierarchy (`CustomError`, `ValidationError`, `UnauthorizedError`, HTTP-status-shaped errors in `src/lib/errors.ts` or similar) is retired. Its consumers throw `DomainError` subclasses instead. The old module becomes an empty `_deprecated_*` stub if the repo forbids deleting, and a lint rule equivalent to Tobalgo's `no-deprecated-error-imports` bans importing it. If the project has no legacy vocabulary, this section and that rule do not apply.

## What must be gone

| Pattern                      | Check                                                                                                                                                                                         |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bare errors in services      | `grep -rn "throw new Error(" apps/web/src \| grep _services/` returns nothing, except lines carrying an `eslint-disable` with a written justification (infra errors that must surface as 500) |
| Legacy error classes         | `grep -rn "lib/errors\|CustomError\|ValidationError\|UnauthorizedError" apps/web/src` returns nothing                                                                                         |
| Server errors in client code | `pnpm lint:agent-rules` passes with `no-client-import-of-server-errors` at `error`                                                                                                            |
| Raw messages in boundaries   | `grep -n "error.message\|digest" apps/web/src/app/**/error.tsx apps/web/src/app/global-error.tsx` returns only the logging line                                                               |
| Missing boundaries           | `ls apps/web/src/app/{error,global-error,not-found,forbidden,unauthorized}.tsx` lists five files                                                                                              |
| Per-procedure mapping        | `grep -rn "catch" apps/web/src --include="trpc-router.ts"` returns nothing                                                                                                                    |

## Recommended strategy

Boundaries first, masking last. Add the helpers and adopt them at every route handler, RSC, and job in one pass per boundary kind. Then retire the legacy vocabulary and land its ban rule straight at `error`. Only then enable the masking `errorFormatter`, after a sweep confirms no service still sends user copy through a bare `Error`: masking earlier silently hides legitimate messages. Add the boundary files last, since they are independent.

## Definition of done

- The shared definition of done from the kit README.
- `services-no-bare-error` is always on (not agent-gated) at `error`.
- `no-client-import-of-server-errors` is at `error`.
- The masking formatter is active and the tRPC `onError` hook logs.
- All five boundary files exist and render the shared error screen.
- Every "must be gone" check returns nothing.
- The ADR `domain-errors-and-transport-mapping.md` is committed in the project's `docs/adr/`.
