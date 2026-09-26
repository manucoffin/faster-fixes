# CRUD naming conventions

Consistent verb/resource/file naming for functions, methods, and files across the codebase, in any language.

> For `apps/web/src/app/**` the read/write verb vocabulary is governed by ADR-0011 (`docs/adr/0011-server-file-conventions.md`) and [backend.md](backend.md). The verbs below are aligned with it; where they differ, the backend rule wins inside `_services/`.

## Read verbs (never write)

Inside `apps/web/src/app/**/_services/`, enforced by `local/services-verb-prefix` (the basename carries a verb from the closed read list or the open write list) and `local/services-read-never-writes` (a read-verb file may call no Prisma write method). Elsewhere in the repo the vocabulary below is **prose only**.

- `get...` for a single item (one / by-id).
- `list...` for collections (single entrypoint with an options object).
- `find...` for a nullable lookup.
- `search...` for a query.
- `has...` / `is...` for predicates (IO-predicate in `_services/`, pure predicate in `_helpers/`).
- `count...` for counting operations.
- `get-all-...` and `get-paginated-...` are reported by name: one `list-` entrypoint takes an options object.
- **Computed reads use `get...` + the result noun.** A function that derives a result from queries but writes nothing (feasibility, suggestions, a preview, a resolved default) is still a read: name the **result**, not the process — `getSessionFeasibility` not `evaluateSessionFeasibility`, `getSessionSlotSuggestions` not `suggestSessionSlots`. Process verbs (`evaluate...`, `suggest...`, `preview...`, `resolve...`, `compute...`) are never read verbs.
- Reserve `fetch...` for external APIs only. **Prose only**: `fetch-` is not on the service verb lists, so inside `_services/` it is reported as an unknown verb.
- Reserve `load...` for file/data loading. **Prose only**, same caveat.

## Write verbs

The write set is **open but listed**: prefer the **most precise accurate verb**. Unlike the read verbs above (a closed set you may not extend), a new write verb is a one-line, reviewed addition to `serviceVerbOptions.writeVerbs`, and it follows strict rules.

- **Default to a generic CRUD verb** when the operation is a plain field write (`create...`, `update...`, `delete...`, `upsert...`, `send...`, …).
- **Prefer a precise domain verb** (e.g. `restore...`, `revoke...`, `upgrade...`) when the operation is a **distinct domain transition** — it has its own call site/entry point, a distinct authorization or invariant, or it is a state transition the domain language already names. Example: `revokeReviewer`, not `updateReviewer`, for the dedicated "Revoke" action. Coin the verb from the ubiquitous language and add it to `serviceVerbOptions.writeVerbs` in the same diff (see below).
- **A write verb must never collide with a read verb** (a mutation never starts with `get`/`list`/etc.), so the verb still tells you read-vs-write at a glance.
- **No synonyms of `update`**: `modify...`, `edit...`, `save...`, `change...` are banned. If it is a plain field write, it is `update...`. Check the established verbs before coining a new one. Inside `apps/web` `_services/`, the established set is `serviceVerbOptions.writeVerbs` in `packages/eslint-config/next.js` and `services-verb-prefix` reports a verb that is not on it, so a coined verb is added there in the same diff.
- `handle...` is reserved for event/webhook write-orchestrations (multi-step state transitions + side effects, e.g. `handleGitHubWebhook`).

A function is a read **iff** it performs no writes.

## Resource naming

- `singular+ById` for single items: `getUserById` (or `getUser`). **Prose only**, no rule.
- `plural` for collections: `listUsers`. **Prose only**, no rule.
- Match function names to file names. Enforced inside `_services/` by `local/services-filename-matches-export`, which compares the exported function's name against the camelCase of the basename, ignoring letter case so a proper noun keeps its house spelling. **Prose only** everywhere else.

## Collection operations

- One list entrypoint per shape. The `get-all-`/`get-paginated-` half is enforced by `local/services-verb-prefix`; the shape of the options object is **prose only**.
- Consolidate filtering/pagination/sorting in an `opts` object — no separate `getAllUsers`, `getPaginatedUsers`, etc.

```ts
type ListOptions = {
  filter?: {...}
  sort?: { field: keyof T; dir: 'asc' | 'desc' }
  page?: { skip: number; take: number }
}

listUsers(opts?: ListOptions)
```

## File naming

**Prose only** apart from the verb prefix, which `local/services-verb-prefix` holds inside `_services/`, and the casing.

- kebab-case file and folder names, dot-separated parts (`foo.client.tsx`). Enforced by `local/kebab-case-path` on every linted file; `_` buckets and Next.js route segments (`[id]`, `(group)`, `@slot`) keep their spelling.
- Match the CRUD verb in the file name: `get-user.ts` / `get-user-by-id.ts`, `list-users.ts`.
- Outside `_services/`, prefix external operations with `fetch-`. Inside `_services/`, an external read uses a read verb (`get-github-stars.ts`).
- In `apps/web` `_services/`, files are plain-named with the verb prefix and **no role suffix** (no `*.server.query.ts` / `*.trpc.*`).
