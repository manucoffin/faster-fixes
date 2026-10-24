# ADR-0017: A Feedback's Rank lives in its own table and a database trigger clears it on every Status change

- **Status**: Accepted
- **Date**: 2026-10-24

## Context

The inbox board gains a **Rank**: a Feedback's place within its Status column, shared by the team. A Feedback without a Rank sits above ranked ones, newest first. Two rules come with it:

- Reordering is not an edit of the Feedback. `Feedback.updatedAt` is `@updatedAt`, and the board's "updated" sort, the Archive's default sort, the properties rail and the Agent API's `updatedAt` all read it, so a Rank write must never bump it.
- A Status change clears the Rank, whatever drove it. A Feedback that leaves a column and comes back (a reopened GitHub Issue, a restore from Archived) lands on top, not at a Rank set weeks earlier.

Six code paths write `Feedback.status`, and they share no service: dashboard single and bulk (`updateMany`), the Agent API, and the GitHub, Linear and Jira sync functions. Service tests run against a fake `db`, never a real database.

## Decision

- **The Rank is a separate table**, `feedback_rank`: one row per ranked Feedback, `onDelete: Cascade`, holding a fractional-index key. A Rank write never touches the `feedback` row, so `updatedAt` stays correct by construction.
- **A Postgres trigger clears it.** `AFTER UPDATE OF status ON feedback`, when `OLD.status IS DISTINCT FROM NEW.status`, it deletes the Feedback's `feedback_rank` row. It lives in the migration that creates the table. A `///` comment on the Prisma `Feedback` model points to it, because nothing in the Prisma schema reveals it.
- The board's `move` mutation changes Status first, through the existing `updateFeedbackStatus` service, then writes the new Rank. The trigger fires in between, so the order is required.

## Alternatives considered

1. **Clear the Rank in each of the six writers.** Explicit and covered by the fake-`db` tests, but every future writer of `status` must remember it, and forgetting fails silently: the card keeps a key from another column and lands at an arbitrary place.
2. **A Prisma client extension** intercepting `feedback.update` and `updateMany` when `data.status` is set. Stays in TypeScript, but misses nested writes and raw SQL, changes the type of `prisma` everywhere, and is no more covered by the fake-`db` tests than a trigger.
3. **Store the Status alongside the Rank and ignore a mismatching Rank at read time.** No write path changes, but a Feedback that returns to a column it already held (A to B to A) gets its stale Rank back, which breaks the second rule.
4. **A `rank` column on `feedback`.** Simpler reads, but every Rank write would bump `updatedAt` unless each one passes the old value back explicitly, a workaround that fails silently when forgotten.

## Consequences

- This is the first trigger in the repo. Removing or rewriting it is a migration, and anyone touching Status writes must know it exists: the Prisma comment and this ADR are the pointers.
- The suite does not test the trigger. It is checked by hand after `migrate:dev` (change a ranked Feedback's Status in SQL, confirm the `feedback_rank` row is gone).
- Raw SQL and future writers of `status` get the rule for free.
