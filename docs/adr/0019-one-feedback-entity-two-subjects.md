# ADR-0019: One Feedback entity for two subjects, a Project page or a Video, told apart by a nullable pair under a CHECK constraint

- **Status**: Accepted
- **Date**: 2026-11-04

## Context

Video review adds a second thing a Feedback can be about. A **Video** is owned by the Organization, not by a Project: it is not a website, so it has no Widget, no allowed origins, no Project link. Yet the glossary says a video Feedback _is_ a Feedback: same Status, same Rank, same assignee, same Archive and Restore, same Agent API and MCP tools. Today `Feedback.projectId` and `Reviewer.projectId` are required, every Issue link hangs off a Project link, and the free plan's Feedback cap counts through `project.organizationId`.

## Decision

- **One `Feedback` model, two subjects.** `projectId` becomes nullable and `videoId` is added, nullable, `onDelete: Cascade` like the Project. A Postgres `CHECK` constraint, written in the migration's SQL like the ADR-0017 trigger, requires exactly one of the two to be non-null. A `///` comment on the model points to it, since Prisma does not model CHECK constraints.
- **`Reviewer` takes the same shape**: nullable `projectId`, nullable `videoId`, the same CHECK. A Reviewer belongs to exactly one Project or one Video.
- **The Selection follows the subject, in flat columns.** A page Selection keeps `clickX`, `clickY`, `selector`; a video Selection adds `startMs`, `endMs` (null for an instant), `frameX`, `frameY` (normalized 0..1) and `frameWidth`, `frameHeight` (null for a point). `pageUrl` becomes nullable. The environment fields stay optional and are captured for both subjects.
- **Every per-subject scope generalizes from "Project" to "subject".** The Rank column is (subject, Status), so a Video has its own board. The free plan's Feedback cap counts both subjects of the Organization.

## Alternatives considered

1. **A separate `VideoFeedback` model.** Keeps the existing model untouched, but duplicates Status, Rank, assignee, Issue links and every service and tool that reads them, and contradicts the glossary's "a video Feedback is a Feedback".
2. **A dedicated subject table** (`kind`, `projectId?`, `videoId?`) joined by each Feedback. Models the exclusive-or in the schema, but adds a join to every inbox, export and MCP query for one bit of information, and the exclusive-or still needs a CHECK on that table.
3. **A hidden Project per Video.** No schema change, but a Video would acquire a Widget, allowed origins and Project links it cannot use, and every Project list and count would have to filter them out forever.
4. **A JSON `selection` column** for the video Selection or for both subjects. Avoids nullable columns, but loses Prisma typing and filtering by time range, and breaks the symmetry with the page Selection's existing flat columns.

## Consequences

- The schema gains its first CHECK constraint. Anyone adding a third subject must extend the constraint in a migration, not only the Prisma model.
- Every service that filters Feedback or Reviewers by `projectId`, and every count through `project.organizationId`, must be revisited: the exhaustive list is part of the Video review spec.
- Trackers and Notification channels stay bound to Projects. A video Feedback has no Issue link in this effort; a future per-Video link would plug into the Issue link side without touching `Feedback`.
- A Reviewer on a Video is told apart by name only, given or generated, so nothing proves who wrote a Feedback and no per-Reviewer action (edit, delete) can be offered on that surface without a stronger identity. Amended by the Share link lifecycle decision (issue #303): the browser that claims a name generates a secret stored hashed in `Reviewer.token`, which is that stronger identity.
