# CRUD naming conventions

Consistent verb/resource/file naming for functions, methods, and files across the codebase, in any language.

> For `apps/web/src/app/**` the read/write verb vocabulary is governed by the server-file-conventions ADR ([backend.md](backend.md)). The verbs below are aligned with it; where they differ, the backend rule wins inside `_services/`.

## Read verbs (never write)

- `get...` for a single item (one / by-id).
- `list...` for collections (single entrypoint with an options object).
- `find...` for a nullable lookup.
- `search...` for a query.
- `has...` / `is...` for predicates (IO-predicate in `_services/`, pure predicate in `_helpers/`).
- `count...` for counting operations.
- **Computed reads use `get...` + the result noun.** A function that derives a result from queries but writes nothing (feasibility, suggestions, a preview, a resolved default) is still a read: name the **result**, not the process — `getSessionFeasibility` not `evaluateSessionFeasibility`, `getSessionSlotSuggestions` not `suggestSessionSlots`. Process verbs (`evaluate...`, `suggest...`, `preview...`, `resolve...`, `compute...`) are never read verbs.
- Reserve `fetch...` for external APIs only.
- Reserve `load...` for file/data loading.

## Write verbs

The write set is **open**: prefer the **most precise accurate verb**. Unlike the read verbs above (a closed set you may not extend), writes are not enumerable, but they follow strict rules.

- **Default to a generic CRUD verb** when the operation is a plain field write (`create...`, `update...`, `delete...`, `upsert...`, `send...`, …).
- **Prefer a precise domain verb** (e.g. `archive...`, `publish...`, `book...`) when the operation is a **distinct domain transition** — it has its own call site/entry point, a distinct authorization or invariant, or it is a state transition the domain language already names. Example: `archiveSpecialization`, not `updateSpecialization`, for the dedicated "Archive" action. Coin the verb from the ubiquitous language; you don't register it anywhere.
- **A write verb must never collide with a read verb** (a mutation never starts with `get`/`list`/etc.), so the verb still tells you read-vs-write at a glance.
- **No synonyms of `update`**: `modify...`, `edit...`, `save...`, `change...` are banned. If it is a plain field write, it is `update...`. Check the established verbs before coining a new one. Inside `apps/web` `_services/`, the established set is `serviceVerbOptions.writeVerbs` in `packages/eslint-config/next.js` and `services-verb-prefix` reports a verb that is not on it, so a coined verb is added there in the same diff.
- `handle...` is reserved for event/webhook write-orchestrations (multi-step state transitions + side effects, e.g. `handleProPaidReward`).

A function is a read **iff** it performs no writes.

## Resource naming

- `singular+ById` for single items: `getUserById` (or `getUser`).
- `plural` for collections: `listUsers`.
- Match function names to file names.

## Collection operations

- One list entrypoint per shape.
- Consolidate filtering/pagination/sorting in an `opts` object — no separate `getAllUsers`, `getPaginatedUsers`, etc.

```ts
interface ListOptions {
  filter?: {...}
  sort?: { field: keyof T; dir: 'asc' | 'desc' }
  page?: { skip: number; take: number }
}

listUsers(opts?: ListOptions)
```

## File naming

- kebab-case file names.
- Match the CRUD verb in the file name: `get-user.ts` / `get-user-by-id.ts`, `list-users.ts`.
- Prefix external operations with `fetch-`.
- In `apps/web` `_services/`, files are plain-named with the verb prefix and **no role suffix** (no `*.server.query.ts` / `*.trpc.*`).
