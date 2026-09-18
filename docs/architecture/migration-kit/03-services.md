# Step 3: Services

> End state: every scope has the final bucket set. All data and IO operations are verb-prefixed functions in `_services/`, tRPC routers are thin files at the scope root composing hierarchically, schemas live in `_services/` as pure Zod, `_utils/` is gone in favour of `_helpers/` and `_types/`, hooks live in their features. Services never import tRPC and throw `DomainError` subclasses. The rules that guard all this are locked to `error`.

Authority: `adrs/server-file-conventions.md` and the vocabulary part of `adrs/domain-errors-and-transport-mapping.md`. `[Faster Fixes]` Both were committed with this step's prerequisites, as `docs/adr/0011-server-file-conventions.md` and `docs/adr/0012-domain-errors-and-transport-mapping.md`: the second one's **vocabulary and tRPC middleware are a prerequisite of this step**, so its authority has to be local before the first procedure is extracted, and step 4 only adds the remaining boundaries.

## Prerequisites

- Step 2 done: every domain is under `_domains/` with a barrel.
- **The domain-error vocabulary and the tRPC mapping middleware exist before the first procedure is extracted.** Tobalgo learned this the hard way: extracting a procedure that threw `TRPCError({ code: "CONFLICT" })` into a service that throws bare `Error` turns a 409 into a 500 and loses the code irrecoverably. So, first:
  1. Create `src/server/errors/domain-errors.ts` (copy it verbatim from the kit README's runtime files list). Zero imports. Five subclasses.
  2. Add the mapping middleware to the base procedure in `src/server/trpc/trpc.ts`:

  ```ts
  const domainErrorMiddleware = t.middleware(async (opts) => {
    const result = await opts.next();
    if (!result.ok && result.error.cause instanceof DomainError) {
      throw new TRPCError({
        code: result.error.cause.code,
        message: result.error.cause.message,
        cause: result.error.cause,
      });
    }
    return result;
  });

  export const publicProcedure = t.procedure.use(domainErrorMiddleware);
  export const protectedProcedure = publicProcedure.use(/* auth check */);
  ```

  Every derived procedure inherits the mapping. Nothing else from step 4 is needed yet.

## Target state

### Bucket set, every scope

```
<scope>/
├── trpc-router.ts   # optional: only if the scope has procedures
├── _services/       # lazy
├── _helpers/        # lazy
├── _types/          # lazy
├── _features/
├── _components/
└── index.ts         # domains only
```

No `_trpc/`, `_queries/`, `_mutations/`, `_server/`, `_utils/`, `_hooks/`, `_schemas/`, `_lib/` anywhere under `src/app/`.

### Where the old files go

| Old (feature-folder era)                                | New                                                                                                    |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `<feature>/get-users.trpc.query.ts` (procedure + logic) | Logic to `<scope>/_services/list-users.ts`; the thin procedure inlined in `<scope>/trpc-router.ts`     |
| `<feature>/delete-user.trpc.mutation.ts`                | Logic to `<scope>/_services/delete-user.ts`; procedure inlined in the router                           |
| `<feature>/get-users.server.query.ts` (RSC data access) | `<scope>/_services/list-users.ts` (often the same function the procedure now calls)                    |
| `<feature>/delete-user.server.mutation.ts`              | `<scope>/_services/delete-user.ts`                                                                     |
| `<feature>/delete-user.server.action.ts` `[if present]` | Stays `*.server.action.ts`, but its body calls a service and contains no logic                         |
| `<feature>/delete-user.schema.ts`                       | `<scope>/_services/delete-user.schema.ts`                                                              |
| `<feature>/user.types.ts`                               | A service-derived type stays in the service file; a hand-written shared type goes to `<scope>/_types/` |
| `<scope>/_trpc/router.ts`                               | `<scope>/trpc-router.ts`                                                                               |
| `<scope>/_queries/*`                                    | `<scope>/_services/*` with verb-prefixed names                                                         |
| `<scope>/_utils/*` (pure functions)                     | `<scope>/_helpers/*`                                                                                   |
| `<scope>/_utils/*` (IO, schemas)                        | `<scope>/_services/*`                                                                                  |
| `<scope>/_utils/*` (types)                              | `<scope>/_types/*`                                                                                     |
| `<scope>/_utils/use-*.ts`, `<scope>/_hooks/use-*.ts`    | The owning `_features/<x>/use-*.ts`                                                                    |
| `*.inngest.ts` `[if present]`                           | `<scope>/_services/*.inngest.ts`                                                                       |

### Services

- File `= <verb>-<entity>.ts`, exporting one function of the same name in camelCase. `list-users.ts` exports `listUsers`.
- Read verbs (closed): `get-`, `list-`, `find-`, `search-`, `has-`, `is-`, `count-`. Computed reads: `get-` + result noun.
- Write verbs (open): the most precise accurate verb. Never `edit-`, `modify-`, `save-`, `change-`. `handle-` for event and webhook orchestrations.
- A read never writes. A file that both reads and writes is a write.
- A service imports Prisma (or the SDK it needs) directly, or receives it as a trailing parameter with a default when its logic deserves a test.
- A service **never** imports `@/server/trpc` or `@/lib/trpc`. It never throws `TRPCError`. Expected failures throw a `DomainError` subclass, with the same code the old `TRPCError` carried:

  | Old `TRPCError` code                       | New throw                                                                  |
  | ------------------------------------------ | -------------------------------------------------------------------------- |
  | `NOT_FOUND`                                | `new NotFoundError(message)`                                               |
  | `CONFLICT`                                 | `new ConflictError(message)`                                               |
  | `BAD_REQUEST`                              | `new BadRequestError(message)`                                             |
  | `FORBIDDEN`                                | `new ForbiddenError(message)`                                              |
  | `PRECONDITION_FAILED`                      | `new PreconditionFailedError(message)`                                     |
  | `UNAUTHORIZED`                             | Stays in the procedure. Identity is a transport concern.                   |
  | `TOO_MANY_REQUESTS`, other transport codes | Stays in the procedure as a transport-policy guard, fed by a read service. |

- Each read exports its return type: `export type ListUsers = Awaited<ReturnType<typeof listUsers>>`. Consumers that used `inferProcedureOutput` switch to this type.
- One `list-` entrypoint per shape with an options object. No `getAllUsers` next to `getPaginatedUsers`.

### Schemas

- `*.schema.ts` in `_services/`. Pure Zod: no `@/server/`, no Prisma client, no sibling non-schema import. Generated Prisma enums via `z.enum(PrismaEnum)`.
- `XSchema` in PascalCase, `XInput = z.infer`, `XValues = z.input` only when they diverge. The prefix mirrors the service verb: `create-user.ts`, `createUser`, `CreateUserSchema`, `CreateUserInput`.

### Helpers and types

- `_helpers/` holds functions only, pure. Formatters, labels, calculators, slug generators, parsers, pure predicates, cache-tag shapes.
- `_types/` holds types only. No function in a `_types/` file.
- A predicate that needs to query is a service (`has-`, `is-` in `_services/`), a predicate over loaded data is a helper.

### Routers

- `trpc-router.ts` at the scope root. Procedures inlined: auth procedure, `.input(XSchema)`, one service call. Authorization asserts and rate limits stay in the procedure.
- Route-group routers mount their child segment routers; the app router mounts domain routers and route-group routers side by side. The old god-router that imported every operation is dissolved.
- Client-side call paths change accordingly (`trpc.users.list` might become `trpc.admin.users.list`). Update them in the same commit as the router move.

### Client boundary

- A `'use client'` module is `*.client.tsx` (except `use-*.ts` and Next special files).
- A client module imports from `_services/` only `*.schema.ts` or types. Any runtime import of a service from client code is replaced by a tRPC hook or moved into a server component.
- Container hooks (`use-*.ts`) live in their feature.

## What must be gone

| Pattern                         | Check                                                                                                                                                                                    |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Role suffixes                   | `grep -rEl "\.(trpc                                                                                                                                                                      | server)\.(query | mutation)\.ts$" apps/web/src`via`find apps/web/src -name "_.trpc._.ts" -o -name "_.server.query.ts" -o -name "_.server.mutation.ts"` returns nothing |
| Old buckets                     | `find apps/web/src/app -type d \( -name _trpc -o -name _queries -o -name _mutations -o -name _server -o -name _utils -o -name _hooks -o -name _schemas -o -name _lib \)` returns nothing |
| `*.types.ts` in features        | `find apps/web/src/app -name "*.types.ts"` returns nothing                                                                                                                               |
| tRPC in services                | `grep -rn "server/trpc\|lib/trpc\|@trpc/server" apps/web/src --include="*.ts" -l \| grep _services/` returns nothing                                                                     |
| `TRPCError` in services         | `grep -rn "TRPCError" apps/web/src \| grep _services/` returns nothing                                                                                                                   |
| Procedure output as type source | `grep -rn "inferProcedureOutput\|inferRouterOutputs" apps/web/src` returns nothing outside `src/lib/trpc/`                                                                               |
| Routers inside buckets          | `find apps/web/src/app -path "*/_*/trpc-router.ts"` returns nothing                                                                                                                      |

## Recommended strategy

Migrate one scope at a time, smallest first, and lock as you go. For each scope: create `_services/` with the extracted functions, write the thin router, delete the old files (retire with `_deprecated_*` stubs if the repo forbids deleting), rewrite the client call paths, run the checks, then add the scope to the ESLint `migratedScopes` allowlist that turns the step's rules from `warn` to `error` for that path. One commit per scope, one log line per scope. When every scope is in the allowlist, delete the allowlist and set `servicesRulesSeverity` to `"error"` unconditionally.

## Definition of done

- The shared definition of done from the kit README.
- These rules are at `error` (agent-gated) with no allowlist left: `services-verb-prefix`, `services-no-trpc-import`, `require-trpc-output-type`, `no-client-import-of-services`, `no-feature-nesting`, `schema-must-be-pure-zod`, `require-schema-conventions`, `no-default-export`, `require-use-client-suffix`.
- `services-no-bare-error` is at `error` (agent-gated for now; step 4 makes it always on).
- Every "must be gone" check returns nothing.
- The ADR `server-file-conventions.md` is committed in the project's `docs/adr/`.
- The migration log lists every scope with its commit.
