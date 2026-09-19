# Faster Fixes

A widget that lets a website's end-users report bugs and feedback in-page; reports flow into a project inbox, can be mirrored to external trackers (GitHub Issues, Linear, Jira), and announced to notification channels (Slack).

## Language

### Reporting

**Feedback**:
A bug report or comment submitted via the widget on a customer's site. The atomic unit of the inbox.
_Avoid_: Issue (reserved for tracker-side artifacts), Ticket, Bug report.

**Reviewer**:
The end-user of the customer's site who submitted a Feedback through the widget.
_Avoid_: Reporter, Submitter, User.

**Project**:
A Faster Fixes container scoped to one website (one widget install). Holds Feedback, settings, and at most one tracker link per integration.
_Avoid_: Site, App, Workspace.

### Identity & access

**Project public ID**:
The public, unguessable identifier for a Project (`proj_` + 96-bit random), embedded in the widget so submissions route to the right Project inbox. Public by design — it carries no secret and is safe to ship in client code.
_Avoid_: API key (the widget surface has no secret key), Client secret.

**Allowed origins**:
The web origins a Project's widget may call the API from: the Project's registered **domain** plus any **subdomain** of it, and localhost for local development. Matched against the browser-set `Origin` — the real security boundary for widget requests. Deliberately **not** a free-form domain allowlist: a Project is one website and `projects` is the billed unit, so letting one Project span unrelated domains would bypass per-website pricing.

**Reviewer token**:
The per-Reviewer secret that authorizes reading and submitting Feedback. Created in the dashboard, delivered to a Reviewer via URL param or localStorage. This — not the Project public ID — is the gate on Feedback access.

**Agent token**:
The organization-scoped secret (`ff_agent_`) for the agent/MCP API. The only genuine secret credential in the system; stored hashed and revocable.

### Account & billing

**User**:
A person with a Faster Fixes account who signs in to the dashboard. Distinct from a **Reviewer**, who has no account.
_Avoid_: Account (a credential record of the sign-in subsystem), Customer.

**Auth**:
The sign-in subsystem: credentials, sessions, email verification, password reset, impersonation. Owns no business entity; it establishes which **User** is acting.
_Avoid_: Login, Identity.

**Organization**:
The tenant. Owns Projects, Installations, Agent tokens and the Subscription. Every User acts within one active Organization.
_Avoid_: Team, Workspace, Company.

**Member**:
A User's belonging to an Organization, carrying a **Role**. One per (User × Organization).

**Role**:
A Member's permission level: `owner`, `admin`, `member`. Write "member role" in full when the role is meant; bare "Member" is the entity.

**Invitation**:
A pending offer for an email address to become a Member of an Organization, with a Role. Accepted or rejected by the recipient.

**Subscription**:
An Organization's billing relationship, mirrored from Stripe. At most one active per Organization. Belongs to the Organization, never to a User.

**Plan**:
The tier a Subscription grants (`free`, `pro`, `agency`), defining limits (projects, members) and feature access. An Organization without an active Subscription is on the free Plan; a self-hosted instance always resolves to the top Plan.

### Feedback lifecycle

**Status**:
The state of a Feedback. Canonical values: `new`, `in_progress`, `resolved`, `archived`.

**Status actor**:
Who or what drove a Status change: a **User**, a Tracker sync, or the **Agent** (an Agent-token caller). Travels on the status-change event so a **Notification channel** can distinguish an agent-resolved Feedback from a human-resolved one.

**Archived**:
A Feedback the team has decided not to act on (won't fix, duplicate, out of scope). Stored in the database as `status = "closed"` for legacy reasons; the literal will be renamed in a future migration. UI label is **Archived** everywhere (status dropdown, kanban action, archive view).
_Avoid_: Closed, Dismissed, Rejected.

### Integrations

**Tracker**:
An external issue-tracking system Faster Fixes can mirror Feedback into. Currently GitHub Issues, Linear and Jira.
_Avoid_: Integration target, Sink.

**Notification channel**:
A category of external connection where Faster Fixes _announces_ Feedback one-way, holding no mirror and creating no Issue. First instance: Slack. Distinct from a **Tracker** (two-way, mirrors Feedback as an Issue and converges its state). Not to be confused with a Slack _channel_ (the specific room a Project posts into).
_Avoid_: Webhook (implementation detail), Sink.

**Installation**:
The org-level connection to an external system — a **Tracker** (`GitHubInstallation`, `LinearInstallation`, `JiraInstallation`) or a **Notification channel** (`SlackInstallation`). One per (Organization × external system).

**Reconnect required**:
The state of an **Installation** whose authorization the external system has explicitly refused or revoked. Only a User re-authorizing the connection clears it. A transient failure of the external system never puts an Installation in this state.
_Avoid_: Disconnected (an Organization with no Installation at all), Broken, Expired.

**Jira site**:
The Jira Cloud instance an Organization connects to (e.g. `acme.atlassian.net`), identified by an Atlassian `cloudId`. The org-level scope of a Jira Installation — the analog of a Linear workspace or a GitHub account. One per Organization.
_Avoid_: Jira instance, Jira workspace.

**Jira project**:
A project inside a Jira site (e.g. `PAY`). The per-Project tracker scope a Faster Fixes Project links to — the analog of a GitHub repo or a Linear team. Always written "Jira project" in full; bare "project" means a Faster Fixes Project.

**Project link**:
The project-level binding from a Faster Fixes Project to an external scope — a Tracker scope (a GitHub repo, a Linear team) or a Notification channel destination (a Slack channel). One per (Project × external system).

**Issue link**:
The per-Feedback record connecting a single Feedback to its mirrored issue in a Tracker. A Feedback can have at most one issue link per Tracker, but may have one for each Tracker simultaneously.

### Diagnostics

**Diagnostic Trail**:
The console and network history captured leading up to a Feedback submission, attached to that Feedback to aid reproduction.
_Avoid_: Session, Logs, Recording (the Trail is a bounded snapshot, not a continuous session recording).

**Console Entry**:
One captured `console.*` call: level (`log`/`info`/`warn`/`error`/`debug`), message, timestamp. All levels captured.

**Network Entry**:
One captured `fetch`/`XHR` call: method, URL, status, duration, timestamp. Metadata only — request/response bodies are not captured in v1.

**Ring Buffer**:
The fixed-size in-memory store the Widget fills from page load; oldest entries drop when full. A Diagnostic Trail is a snapshot of this buffer at submission time.

## Relationships

- An **Organization** has many **Members**, owns many **Projects**, and has zero or one active **Subscription**
- A **User** may be a **Member** of several **Organizations**, with one **Role** in each
- A **Feedback** has zero or one **Diagnostic Trail**
- A **Diagnostic Trail** contains many **Console Entries** and many **Network Entries**
- The **Widget** maintains one **Ring Buffer** per page session; submitting Feedback snapshots it into a **Diagnostic Trail**
- A **Project** has zero or one **Project link** per **Tracker** (GitHub, Linear, Jira)
- A **Feedback** has zero or one **Issue link** per **Tracker**
- A **Reviewer** submits **Feedback** through the widget; Reviewers are not authenticated app users
- An **Installation** is owned by an Organization and shared across all Projects in that Organization
- The same **Feedback** may exist as a GitHub Issue and a Linear Issue at the same time; both are mirrors of the Feedback, not peers of each other
- A **Notification channel** (Slack) receives one-way announcements of a Feedback; unlike a **Tracker** it holds no mirror, has no **Issue link**, and never feeds state back to the Feedback

## Example dialogue

> **Dev:** "When a Reviewer submits a Feedback, do we create the GitHub Issue immediately?"
> **Domain expert:** "Only if the Project has an active GitHub Project link with auto-create enabled. Same for Linear, independently — a Project can mirror to neither, one, or both Trackers."
>
> **Dev:** "What if the team marks the Feedback as Archived?"
> **Domain expert:** "On the GitHub side it closes the Issue with `state_reason = not_planned`. On Linear it moves to a `canceled`-type state. The Feedback is the source of truth — Trackers are mirrors and must converge to it."

## Flagged ambiguities

- **"Closed" vs "Archived"** — historically used interchangeably. Resolved: the canonical user-facing term is **Archived**. The DB literal `"closed"` is retained for now to avoid a migration; rename is deferred.
- **"Issue"** — refers exclusively to a tracker-side artifact (GitHub Issue, Linear Issue). Internal app records are **Feedback**, never "issues".
- **"logs"** — used loosely for the captured browser data. Resolved: the canonical term is **Diagnostic Trail** (console + network), distinct from server-side logs.
- **"API key"** — the widget historically embedded an `apiKey` stored like a secret (SHA-256 hash, last-4 shown, "regenerate" flow). Resolved: the widget surface has **no secret**. It embeds the public **Project public ID**, secured by the **allowed origins** (domain + subdomains) + **Reviewer token**. Genuine secrets exist only on the agent surface (**Agent token**). The widget `apiKey` is being removed.
