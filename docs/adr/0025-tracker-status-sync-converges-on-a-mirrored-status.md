# Tracker Status sync converges on a Mirrored Status, not a time window

Each Tracker stopped its own echoes with a time window: an Issue link stamped
`lastSyncSource` and `lastSyncAt`, and the other direction ignored changes for
30 seconds (60 for Linear). The window is wrong both ways: a genuine edit inside
it is dropped, a late delivery after it is applied. Combined with an inbound
mapping that compared only against the current Status, it let any comment on a
Jira issue move a `new` Feedback to `in_progress` and an Archived one to
`resolved`, then fan out to the other Trackers.

We replace the window with one **Status convergence** module, at the root of the
`integration` domain's `_services/`, that every Status writer and every Tracker
adapter goes through. Each Issue link records its **Mirrored Status**: the Status
it last converged on, beside the Issue state the link already stores. The rules:

- Every change of Status goes through one interface that writes, records and
  emits `feedback/status-changed`, for a User, the Agent and a Tracker alike. The
  ADR-0007 asymmetry is applied there from the Status actor: a `user` change
  emits even when nothing changed, `agent` and `tracker` changes do not.
- Inbound, the adapter re-reads the Issue from the Tracker; the payload is never
  trusted. The Feedback changes only when the link is not pending, the Issue's
  state differs from the one recorded at convergence, and that state does not
  mirror the current Status. A state may mirror several Statuses.
- Outbound, the adapter pushes the Feedback's Status at run time, not the one on
  the event, so out-of-order events cannot apply a stale Status. "Nothing to
  write" records the convergence; "cannot write" (a Jira workflow with no path)
  leaves the link pending, so the Tracker cannot revert the Feedback.
- A confirmed missing Issue, in either direction, detaches the Issue link and
  leaves the Feedback alone, for every Tracker.
- Creating an Issue records the state it got and records the Mirrored Status
  only if that state mirrors the Feedback's Status; otherwise the link starts
  pending and one outbound convergence runs at once. Existing links are
  backfilled the same way: mirrored where the stored state matches, pending
  where it does not.

The origin skip on outbound stays. `lastSyncSource` and `lastSyncAt` are dropped.
Each adapter supplies only the mapping in both directions, the re-read and the
write. Jira stays two-state (Done or not Done); a finer mapping is a later change
inside its adapter.

## Considered options

- **Keep the window, one constant for every Tracker.** Rejected: it centralises a
  heuristic that is wrong in both directions instead of removing it.
- **Exact round-trip mappings** (three Jira categories, inverse functions per
  Tracker). Rejected as the fix: Resolved and Archived both map to Done in Jira
  and to `closed` in GitHub, so equivalence is needed anyway.
- **Feedback domain owns the module.** Rejected: the inbound Tracker functions
  live in `integration`, and ADR-0010 lets a barrel export no service. The
  `integration` domain already wrote `feedback.status` directly.
- **An event hop** ("Tracker observed this state", handled in `feedback`).
  Rejected: ADR-0010 already rejected event-based decoupling as ceremony at this
  scale.

## Consequences

- GitHub and Linear inbound gain one API read per relevant webhook.
- A Status change made in the Tracker while an outbound push is pending is
  overwritten by the Feedback. That is the intended reading of "the Feedback is
  the source of truth".
- A Project with no Tracker still changes Status through the `integration`
  domain's module.
