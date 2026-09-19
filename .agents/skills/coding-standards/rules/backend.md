# Backend: services and tRPC layer

The data/IO layer lives in a per-scope `_services/` folder; tRPC is thin transport at the scope root. Authority: `docs/adr/0011-server-file-conventions.md`. Folder placement and the bucket set are in [architecture.md](architecture.md). Schema conventions are in [schemas.md](schemas.md).

## The `_services/` folder

- `_services/` is the **data/IO layer** of a scope (a domain or a route segment): reads, writes, IO-predicates, write-orchestrations, `*.inngest.ts` jobs, and `*.schema.ts`.
- Files are **plain-named after their export** with a load-bearing **verb prefix** — `get-user.ts` exports `getUser`. **No role suffixes** (`*.server.query.ts`, `*.trpc.query.ts` are gone).
- **All data ops go here, even single-use.** A solitary query still lives in `_services/`, not colocated in a feature. Control clutter with route-tree granularity (each segment owns its `_services/` + router) and, secondarily, subfolders inside `_services/` when ~3+ files cluster.

## Verb vocabulary (enforced)

A file is a **read iff it performs no writes**, and a read may use only read verbs. Full vocabulary in [naming.md](naming.md).

- **Reads** (never write) — **CLOSED set, you may not extend it**: `get-` (one / by-id), `list-` (collections, single entrypoint with an options object — no `getAllX`/`getPaginatedX`), `find-` (nullable lookup), `search-` (query), `has-` / `is-` (IO-predicates), `count-`. A **computed read** (derives a result from queries but writes nothing — a feasibility check, slot suggestions, a preview) is still a read: use `get-` and name the **result noun** (`get-session-feasibility`, `get-session-slot-suggestions`), never a process verb (`evaluate-`, `suggest-`, `preview-`, `resolve-`, `compute-`).
- **Writes** — **OPEN set, prefer the most precise accurate verb**. Generic CRUD verbs by default (`create-`, `update-`, `delete-`, `send-`, `upsert-`, `mark-`, `convert-`, `duplicate-`, `validate-`, `export-`, `handle-`); a precise domain verb (`archive-`, `restore-`, `reorder-`, `promote-`, …) is preferred when the operation is a **distinct domain transition** (its own entry point, a distinct authorization/invariant, or a state transition the domain already names). A write verb must **never** collide with a read verb. No synonyms of `update` (`edit-`/`modify-`/`save-`/`change-`). Full guidance in [naming.md](naming.md).
- **`handle-`** is the write-orchestration verb for event/webhook handlers (Stripe-event or lifecycle-hook entrypoints driving multi-step state transitions + side effects, e.g. `handle-pro-paid-reward.ts`).

The **folder** sets the layer (`_services/` = IO); the **verb** sets the direction (read vs write).

## Transport-agnostic services (Option B)

- A `_services/` function **never imports tRPC** (`@/server/trpc`, `@/lib/trpc`). It is callable from a tRPC procedure, an Inngest job, or a server action with no HTTP round-trip.
- The **type source of truth** is the service's return type, exported from the service file as `<Service>Output`: `export type GetUserOutput = Awaited<ReturnType<typeof getUser>>`. Do **not** use `inferProcedureOutput` as the canonical output type.
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

- **Identity and transport policy stay in the procedure**: `UNAUTHORIZED`, rate limiting (`TOO_MANY_REQUESTS`) and plan-limit denials have no domain-error equivalent. An authorization check that needs a loaded resource (membership, ownership) belongs in the service that loads it, as a `ForbiddenError`.

## tRPC router

- `trpc-router.ts` is **thin transport at the scope root** (sibling of `_services/`; for a route, colocated with `page.tsx`).
- Procedures are **inlined** in the router when thin: auth procedure + zod `.input()` + one service call. A fat procedure wrapper is a smell → push logic into the service.
- Routers **compose hierarchically** following the route tree: a parent router mounts child routers. No god-router importing dozens of operations — distribute across sub-segment routers.

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
- **Predicates split by IO, not verb:** `isSubscriptionActive(sub)` (pure) → `_helpers/`; `hasActiveSubscription(userId)` (queries to answer) → `_services/`. A pure predicate must never fetch its own data; if it needs to, it has become an IO-predicate and moves to `_services/`.
- **`_types/`** = standalone, hand-written, isomorphic shared types. A type derived from a service stays **in** that service file.

## External libraries

Placement follows the **domain decision, not the dependency**. Thin domain-agnostic SDK adapters → root `@/server/<lib>/` (e.g. `@/server/stripe/`). Domain logic that _happens_ to call the SDK stays in the domain's `_services/`. Test: _"If I swapped the provider, does this file's reason for existing change?"_ Yes → domain service. No → `@/server/<lib>/`.

## Client/server boundary

- A module-level `'use server'` directive belongs **only** in a `*.server.action.ts` file: it turns every export into a public endpoint. A server component needs no directive, and an infrastructure helper must be called through a service that checks who is asking.
- A client file (`'use client'` / `*.client.tsx`) must **not** import from a `_services/` path — **except** `*.schema.ts` and **type-only imports** (`import type { … }`): TS erases those at compile time, so they cannot leak server code into the bundle, and the service return type is the type source of truth. For runtime values, use a tRPC hook or a server component instead.
- Container hooks (`use-*.ts`) own form state + mutation + optimistic update + toast + invalidation, returning `{ form, onSubmit, isPending }`. They live in their owning scope's `_features/` slice, next to the UI they drive. Extract a hook only on real logic or reuse; a trivial single `useQuery` stays inline.

## Enforced by ESLint

`no-client-import-of-services` (exempts `*.schema.ts` and type-only imports), `services-no-trpc-import`,
`schema-must-be-pure-zod`, `no-feature-nesting`, `services-verb-prefix`,
`require-trpc-output-type` (inverted: service return-type export),
`services-no-bare-error` (throw a `DomainError` subclass, not `new Error(...)`; always on since step 4, not agent-gated),
`require-use-client-suffix` (exempts `use-*`),
`require-server-action-suffix` (always on, not agent-gated). See `packages/eslint-config/local-rules/`.
