# ADR-0020: A Video belongs to a Project, which becomes a client's scope with at most one website

- **Status**: Accepted
- **Date**: 2026-11-04
- **Supersedes**: ADR-0019

## Context

ADR-0019 made a **Video** Organization-owned on the grounds that a Video is not a website, and paid for it with a nullable `projectId` / `videoId` pair under a CHECK constraint on `Feedback` and `Reviewer`, one board per Video, Reviewers scoped per Video, and Trackers and Notification channels excluded from video Feedback. Grilling the dashboard section surfaced the case the product is sold to: an agency runs one Project per client, and that client's website and videos are one body of work reviewed by the same people and worked by the same team. Nothing of ADR-0019 is built yet.

## Decision

- **A Video has a required `projectId`**, `onDelete: Cascade`. An Organization reaches its Videos through its Projects. Deleting a Project deletes its Videos and their stored files.
- **A Project is a client's scope**: at most one website (one Widget install) and any number of Videos. The website stays required at creation in this effort: a video-only client creates the Project with a domain, and an optional domain is a separate effort.
- **`Feedback.projectId` and `Reviewer.projectId` stay required**; both gain a nullable `videoId`. The CHECK constraint of ADR-0019 is not needed. A Reviewer with a `videoId` came through that Video's Share link and their name is unique within the Video; the Project's Reviewers page lists Widget Reviewers only. The flat video Selection columns of ADR-0019 (`startMs`, `endMs`, normalized frame point or area, nullable `pageUrl`) stand.
- **One board per Project.** The Rank column stays (Project, Status) as today; page and video Feedback share the Task board, with the page filter generalized to a source filter (pages, or one Video). The Video page carries the review view only: player, timeline markers and the chronological Feedback list.
- **Project links apply to video Feedback.** A Tracker Issue created from a video Feedback carries the comment, the instant or range, the captured frame as Screenshot and a link to the dashboard Video page at that Feedback; a Notification channel announces it the same way. The Share link never appears in an Issue or a Slack message: it is a secret, and replacing it would break every link written out of the product. This is the one scope widening of the change: a template variant, not a new Integration. _(Amended 2026-11-04 by the Videos section decision: the first version linked to the review page.)_
- **Quotas stay per Organization** (the Subscription's owner): the Video count, the per-file cap and the storage budget are unchanged, and the usage line shown in a Project's Videos list is Organization-wide.
- Moving a Video from one Project to another is out of scope.

## Alternatives considered

1. **Keep the Video Organization-owned (ADR-0019).** Honest about "a Video is not a website", but the agency case has no home, the schema needs its first CHECK constraint, and the board, filters, Reviewers page and Integrations each need a Video-shaped twin.
2. **Optional ownership, Project or Organization.** Serves both cases, but every list and count has to handle both, and a Video "owned by nobody in particular" is the ADR-0019 problem kept alongside the new one.

## Consequences

- ADR-0019 is superseded. Its Selection columns and its "one Feedback entity" principle carry over; its CHECK constraint, per-Video board and per-Video Reviewer scope do not.
- The Videos section lives in the Project group of the sidebar, under the active Project, not at Organization level.
- Tracker and Slack templates need a video variant, and the Issue body must link to the dashboard Video page at the Feedback (`/videos/[videoId]?feedbackId=`).
- "Project without a website" (optional domain, no Widget) is a scoping decision for a later effort; until then the glossary says "at most one website" and the code still requires one.
