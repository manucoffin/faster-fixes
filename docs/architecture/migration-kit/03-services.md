# Step 3: Services

> End state: every scope has the final bucket set. All data and IO operations are verb-prefixed functions in `_services/`, tRPC routers are thin files at the scope root composing hierarchically, schemas live in `_services/` as pure Zod, `_utils/` is gone in favour of `_helpers/` and `_types/`, hooks live in their features. Services never import tRPC and throw `DomainError` subclasses. The rules that guard all this are locked to `error`.

Authority: `adrs/server-file-conventions.md` and the vocabulary part of `adrs/domain-errors-and-transport-mapping.md`. `[Faster Fixes]` Both were committed with this step's prerequisites, as `docs/adr/0011-server-file-conventions.md` and `docs/adr/0012-domain-errors-and-transport-mapping.md`: the second one's **vocabulary and tRPC middleware are a prerequisite of this step**, so its authority has to be local before the first procedure is extracted, and step 4 only adds the remaining boundaries.

## Prerequisites

- Step 2 done: every domain is under `_domains/` with a barrel.
- **The domain-error vocabulary and the tRPC mapping middleware exist before the first procedure is extracted.** Tobalgo learned this the hard way: extracting a procedure that threw `TRPCError({ code: "CONFLICT" })` into a service that throws bare `Error` turns a 409 into a 500 and loses the code irrecoverably. `[Faster Fixes]` Both landed with this step's prerequisites in commit `f2c8d60`, so there is nothing left to copy here:
  1. `apps/web/src/server/errors/domain-errors.ts` holds the vocabulary: a zero-import module exporting `DomainErrorCode`, the abstract `DomainError` and the five subclasses. `[Faster Fixes]` Its source is `docs/architecture/target-architecture.md` (section "Domain errors and transport mapping", subsection "The vocabulary") together with `docs/adr/0012-domain-errors-and-transport-mapping.md`. The kit ships no runtime file for it: the README's "copy verbatim" list covers skills, lint rules and agent instructions, and its pointer for this module refers to the other project's tree, which is not available here.
  2. `apps/web/src/server/trpc/trpc.ts` carries the mapping middleware on the base procedure, which was a pass-through before:

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

  Every derived procedure (protected, admin, plan-aware) inherits the mapping. The existing error formatter needs no change: it only flattens causes that are Zod errors, and the middleware only rewrites causes that are domain errors. `apps/web/src/server/trpc/domain-error-mapping.test.ts` pins all three behaviours. Nothing else from step 4 is needed yet.

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

No `_trpc/`, `_queries/`, `_mutations/`, `_server/`, `_utils/`, `_hooks/`, `_schemas/`, `_lib/` anywhere under `src/app/`. `[Faster Fixes]` No `_constants/` inside a scope either: ADR-0010 rejects a per-domain `_constants/` bucket ("constants are helpers or types"), so a scope's constants fold into `_helpers/` as pure functions. The one at the app root (`src/app/_constants/`) is domain-agnostic and stays.

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
| `<scope>/_constants/*` `[Faster Fixes]`                 | `<scope>/_helpers/*` as pure functions; only the app root keeps a `_constants/`                        |
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

Each row is a command that returns nothing when the step is done. `[Faster Fixes]` The table below replaces the kit's: four of its checks were wrong against this repo, three checks are added, and the rules of the game are written down so the next edit does not break them again.

- A check whose target is a **file name** is a `find`, not a `grep`. The kit's role-suffix check grepped file _contents_ for `"\.(trpc|server)\.(query|mutation)\.ts$"`, which no source line can match, so it passed vacuously while 112 role-suffixed files sat on disk.
- Every check covers `.tsx`. One procedure module is a `.tsx` file (`(authenticated)/_features/feedback/send-feedback.trpc.mutation.tsx`), and tooling keyed on `.ts` alone misses it.
- Commands avoid the shell pipe: `grep` takes repeated `-e` patterns instead of `|` alternation, and `find -exec grep -l {} +` replaces `find ... | xargs grep`. Where a pipe is unavoidable it is written `\|` in the cell, otherwise Prettier reads it as a column separator and shreds the row. That is what happened to the first version of this table: the separator row grew to four columns and the commands came back with `_` where their `*` had been, because the leftover asterisks were reformatted as emphasis.
- These checks clear only after the maintainer has deleted the `_deprecated_<name>.ts` stubs the step leaves behind (the agent never deletes a file). A stub still sitting in a `_utils/` folder keeps the old-bucket check red.
- An agent runs them with `/usr/bin/grep`: the agent shell wraps `grep`, as the migration log records for the warning-count command.

| Pattern                                 | Check, returns nothing                                                                                                                                                   |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Role suffixes                           | `find apps/web/src/app -type f \( -name "*.trpc.query.ts*" -o -name "*.trpc.mutation.ts*" -o -name "*.server.query.ts*" -o -name "*.server.mutation.ts*" \)`             |
| Old buckets                             | `find apps/web/src/app -type d \( -name _trpc -o -name _queries -o -name _mutations -o -name _server -o -name _utils -o -name _hooks -o -name _schemas -o -name _lib \)` |
| `_constants/` inside a scope            | `find apps/web/src/app -mindepth 2 -type d -name "_constants"`                                                                                                           |
| `*.types.ts` files                      | `find apps/web/src/app -type f -name "*.types.ts"`                                                                                                                       |
| Routers inside a bucket or a feature    | `find apps/web/src/app -type f -name "trpc-router.ts" \( -regex ".*/_[^/]*/trpc-router\.ts" -o -path "*/_features/*" \)`                                                 |
| tRPC imported by a service              | `find apps/web/src/app -type f -path "*/_services/*" -exec grep -l -e "server/trpc" -e "lib/trpc" -e "@trpc/server" {} +`                                                |
| `TRPCError` in a service                | `find apps/web/src/app -type f -path "*/_services/*" -exec grep -l "TRPCError" {} +`                                                                                     |
| `'use server'` in a service or a router | `find apps/web/src/app -type f \( -name "trpc-router.ts" -o -path "*/_services/*" \) -exec grep -l "use server" {} +`                                                    |
| Prisma queried outside a service        | `find apps/web/src/app -path "*/_services/*" -prune -o -type f -name "*.ts*" -not -name "route.ts" -exec grep -l "prisma\." {} +`                                        |
| Procedure output as the type source     | `grep -rl --include="*.ts" --include="*.tsx" -e inferProcedureOutput -e inferRouterOutputs apps/web/src \| grep -v "src/lib/trpc/"`                                      |

Four of them need a word of explanation.

**Routers inside a bucket or a feature.** The kit's `find apps/web/src/app -path "*/_*/trpc-router.ts"` is wrong here, because `*` in `find -path` crosses `/`: it matches `_domains/<domain>/trpc-router.ts`, which is exactly where a domain-root router is supposed to live. `-regex ".*/_[^/]*/trpc-router\.ts"` constrains the underscore folder to be the router's **immediate** parent, so `_domains/auth/_services/trpc-router.ts` is flagged and `_domains/auth/trpc-router.ts` is not. The `-path "*/_features/*"` clause catches the other illegitimate home, a router inside a feature, whose parent folder carries no underscore.

**`'use server'` in a service or a router.** No migrated file keeps the directive: an exported service function under `'use server'` is a client-callable server action with no auth procedure in front of it. Today 81 files carry it, all of them role-suffixed procedure modules, so this check is vacuous until the first extraction and meaningful from then on. The ESLint exemption that turns `require-server-action-suffix` off for `*.trpc.query.*` and `*.trpc.mutation.*` comes out at the final lock.

**Prisma queried outside a service.** `route.ts` is excluded on purpose. Twelve route handlers under `src/app/api/**` (five OAuth install and callback routes, three tracker webhooks, the upload endpoint and the three public widget endpoints) query Prisma inline, and no step 3 ticket touches them: the step promises that pages, layouts and server components stop querying Prisma, and that the agent API's buckets are renamed. Their inline Prisma is recorded in the migration log as debt for steps 4 and 5 rather than hidden by a check that silently passes.

**Procedure output as the type source.** `src/lib/trpc/` is the legitimate home of `inferRouterOutputs`: the client type helpers are built from the app router there. Everything else switches to the service's exported `<Service>Output`.

## Recommended strategy

Migrate one scope at a time, smallest first, and lock as you go. For each scope: create `_services/` with the extracted functions, write the thin router, retire the old files, rewrite the client call paths, run the checks, then add the scope to `migratedScopes` so this step's rules go from `warn` to `error` for that path alone. One commit per scope, one log entry per scope.

`[Faster Fixes]` Two things the kit leaves abstract are concrete here.

**Retiring a file.** The repo forbids the agent from deleting files. A file whose logic survives is moved with `git mv` to its service name, so the history follows it. A file that dissolves (an old router, a wrapper helper) becomes a `_deprecated_<name>.ts` stub holding a one-line comment and no role suffix, listed in the log. The maintainer deletes the stubs in one pass before the final lock, which is when the "must be gone" checks are required to clear.

**The lock.** `migratedScopes` lives in `packages/eslint-config/next.js` and is an array of glob fragments relative to `src/app`, spelled the way the folder is spelled on disk: `"(public)"`, `"(authenticated)/account"`, `"admin/users"`, `"_domains/auth"`. Each entry is expanded by `migratedScopeConfigs(scope, severity)` into two config blocks, appended last so they override the `warn` ramp above them:

| Block                                           | Rules raised to `error`                                                                                                                    |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `**/src/app/<scope>/**/_services/**/*.{ts,tsx}` | `services-verb-prefix`, `services-no-trpc-import`, `require-trpc-output-type`, `services-no-bare-error`                                    |
| `**/src/app/<scope>/**/*.{ts,tsx}`              | `no-client-import-of-services`, `no-feature-nesting`, `require-schema-conventions`, `schema-must-be-pure-zod`, `require-use-client-suffix` |

The locked severity sits behind the same `ESLINT_AGENT_RULES` gate as the rest, so a lock never affects `pnpm lint`; only `pnpm lint:agent-rules` enforces it, where a locked scope reports errors and everything else keeps burning down as warnings. `no-default-export` is not in the list (it is scoped to `_domains/**` and was locked there in step 2; a route scope has to default-export its `page.tsx`), and neither is `no-raw-tailwind-colors`, whose 88 warnings are outside this step's definition of done. `packages/eslint-config/next-config.test.js` pins the expansion and the globs. When every scope is listed, the final lock deletes the array, `migratedScopeConfigs`, `lockedSeverity` and `lockedScopeConfigs`, and sets `servicesRulesSeverity` to `"error"` unconditionally. `[Faster Fixes]` That happened in issue #82: the mechanism described in this paragraph no longer exists in the config, and the step's rules now read a single `migratedSeverity` constant on their own globs. The paragraph is kept as the record of how the step was run.

## Definition of done

- The shared definition of done from the kit README.
- These rules are at `error` (agent-gated) with no allowlist left: `services-verb-prefix`, `services-no-trpc-import`, `require-trpc-output-type`, `no-client-import-of-services`, `no-feature-nesting`, `schema-must-be-pure-zod`, `require-schema-conventions`, `no-default-export`, `require-use-client-suffix`.
- `services-no-bare-error` is at `error` (agent-gated for now; step 4 makes it always on).
- Every "must be gone" check returns nothing, run after the maintainer has deleted the `_deprecated_` stubs.
- `[Faster Fixes]` `migratedScopes` and its helpers are deleted, and the ESLint exemption that turns `require-server-action-suffix` off for `*.trpc.query.*` and `*.trpc.mutation.*` is removed.
- The ADR `server-file-conventions.md` is committed in the project's `docs/adr/`.
- The migration log lists every scope with its commit, `[Faster Fixes]` plus its renamed procedure keys, its reclassified errors, its deprecated stubs and its manual smoke checklist.
