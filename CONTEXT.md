# Faster Fixes

A widget that lets a website's end-users report bugs and feedback in-page, and a review page that lets a customer's clients annotate an uploaded video; reports flow into a project inbox, can be mirrored to external trackers (GitHub Issues, Linear, Jira, Trello), and announced to notification channels (Slack).

## Language

### Reporting

**Feedback**:
A bug report or comment a **Reviewer** submits, through the **Widget** on a customer's site or on a **Video** through its **Share link**. The atomic unit of the inbox.
_Avoid_: Issue (reserved for tracker-side artifacts), Ticket, Bug report, Annotation (the act of giving Feedback on a Video, never the Feedback itself).

**Reviewer**:
A person who submits Feedback without a Faster Fixes account: the end-user of the customer's site, through the Widget, or the holder of a Video's **Share link**. Known by a name; on a Video the name is given by the person or generated for them, unique per Video and held by the browser that first claimed it: the same name is the same Reviewer.
_Avoid_: Reporter, Submitter, User, Guest.

**Project**:
A Faster Fixes container for one client's scope: at most one website (one widget install) and any number of **Videos**. Holds Feedback, settings, and at most one **Project link** per **Integration**.
_Avoid_: Site, App, Workspace.

**Widget**:
The in-page reporting UI a Reviewer uses to submit and browse Feedback on a customer's site. One Widget per Project, whatever the **Embed** it was installed through.
_Avoid_: Plugin, SDK, Snippet (the install code of an Embed, not the Widget itself).

**Embed**:
A way of installing the **Widget** on a site: the **script embed** (a script tag, no build step) or a **framework embed** (a package for one rendering runtime: React, Vue, Angular, Svelte). A framework embed exists per runtime, never per meta-framework: a Nuxt site installs the Vue embed, an Analog site installs the Angular embed, a SvelteKit site installs the Svelte embed, a Next.js or Remix site installs the React embed. Every Embed exposes the same customization and behaviour; an Embed changes how the Widget is installed, never what it does.
_Avoid_: Integration (reserved for external systems), Adapter, Wrapper (implementation vocabulary).

### Capture

**Selection**:
What a Feedback is about, unless it is about a **narrated Recording**: that Feedback has no Selection. On a page it takes one of two forms, chosen by the Reviewer's gesture in annotation mode: an **element Selection**, the element they clicked together with the click point inside it, or an **area Selection**, a rectangle of the viewport they dragged. An area Selection is about the rectangle, not about any element: the smallest element containing the whole rectangle is kept as its **container**, which locates the area on the page and is never presented as the thing selected. On a **Video**: the instant or time range the Reviewer marked, with an optional point or area on the frame.
_Avoid_: Target, Highlighted element, Annotation (the mode, not its result), Timecode (the instant alone, not the Selection), Marker, Region, Zone, Box.

**Pin**:
The marker the Widget shows on the live page at the location of an existing Feedback. Lives on the page, never on a Screenshot. The Pin of an area Selection sits at the area's top-left corner and follows the area's container; the area itself shows only while the Pin is hovered or open. A Feedback with a narrated Recording has no Selection and so no Pin: the Widget shows it only in its list of Feedback, on the page where it was started.
_Avoid_: Marker, Dot, Annotation.

**Screenshot**:
The capture of the Reviewer's viewport taken at the moment of Selection, or at the moment the Reviewer stops a narrated Recording, and attached to the Feedback. Best-effort: a Feedback may have none, and a late capture may be of lower fidelity.
_Avoid_: Capture (the act of taking it), Image, Attachment.

**Recording**:
A demonstration over time of what happened on the page, attached to a Feedback. In both its forms it is a reconstruction of the page, not a film of the screen: it shows nothing outside the page. It takes one of two forms, told apart by whether the Reviewer made it on purpose. The **automatic Recording** is the replay of the moments leading up to the Feedback, the page's content as it changed and the Reviewer's interactions with it, taken with no step for the Reviewer. It carries no voice. It ends at the Selection and never shows the Widget's own interface. It never holds what the Reviewer typed, nor what the customer's site marked as sensitive. Fixed when the Feedback is created: never added or changed afterwards, though the team can remove it and keep the Feedback. Best-effort: a Feedback may have none. The **narrated Recording** is the one a Reviewer makes on purpose: they start it, show the problem while speaking, and stop it. It always carries their voice: without the microphone there is no narrated Recording. It hides what the automatic Recording hides, what the Reviewer typed and what the customer's site marked as sensitive, but nothing the Reviewer says: the voice is kept as spoken. It is what its Feedback is about, not a complement to a Selection: that Feedback has no Selection, and its written note is optional. It belongs to the page where it was started; the pages crossed while recording, with or without a full page load, are steps of the Recording, and a full page load leaves a short gap in it. Starting a narrated Recording replaces the automatic one, so a Feedback never carries both. Like the automatic form it is fixed when the Feedback is created, never added to an existing Feedback, replaced or trimmed, and the team can remove it and keep the Feedback. Neither form is ever a Video.
_Avoid_: Video (a file uploaded for review), Video feedback (a Feedback with a narrated Recording), Filmed Recording (nothing is filmed), Screen recording, Session replay (a Recording exists only attached to a Feedback), Replay.

**Selection frame**:
The outline of the Selection drawn in the inbox over the Screenshot, and over the last instant of the Recording: the element and its click point for an element Selection, the rectangle alone for an area Selection. Derived from the Selection's geometry at capture time, never baked into the Screenshot; the viewer can hide it.
_Avoid_: Highlight, Overlay, Annotation.

### Video review

**Video**:
A video file a User uploads into a Project so Reviewers can give Feedback on it. Belongs to the Project like the website does: the Project's Trackers and Notification channels apply to its Feedback, and the Project's board holds it. Its annotations are open or closed by a User; closed keeps the Video and its Feedback viewable through the Share link but accepts no new or changed Feedback. Deleted by a User, at once and for good: its Feedback and Reviewers go with it, its Share link stops working, and Issues already mirrored to a Tracker stay as they are.
_Avoid_: Media, Clip, Asset (the stored file, not the reviewable thing), Video project, Version (a revised cut is a new Video).

**Share link**:
The unguessable URL that grants whoever holds it access to review a Video. One per Video at a time; issuing a new one revokes the previous.
_Avoid_: Review link, Public link, Invite, Reviewer token (the per-Reviewer secret of the Widget surface).

**Poster**:
The still frame of a **Video** shown in the Videos list and in the player before playback. Taken from the file once, at upload; a Video may have none.
_Avoid_: Thumbnail, Cover, Preview.

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
The tenant. Owns Projects (and through them Videos), Installations, Agent tokens and the Subscription. Every User acts within one active Organization.
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
The tier a Subscription grants (`free`, `pro`, `agency`), defining limits (projects, members, Videos) and feature access. An Organization without an active Subscription is on the free Plan; a self-hosted instance always resolves to the top Plan. Video limits (one Video on the free Plan, a storage budget and a maximum file size on every Plan) apply only on the cloud instance: a self-hosted instance has none. The same holds for narrated Recording limits: a maximum duration on every Plan, a total of five on the free Plan, each also counted as a Feedback, and on the paid Plans a number per month, counted over the Subscription's billing period and never given back when one is removed. Transcription comes with every narrated Recording on every Plan. An Organization above a limit keeps what it has and cannot add more.

**Paying organization**:
An Organization whose Subscription is `active` or `past_due` in Stripe. Trialing, unpaid, paused and incomplete Subscriptions do not count. The unit for MRR, conversion and churn.
_Avoid_: Customer, Subscriber, Paying user (billing belongs to the Organization, never to a User).

**Engaged organization**:
An Organization that received at least one Feedback in the last 30 days, meaning its Widget is installed and used by Reviewers. The unit for usage and adoption metrics.
_Avoid_: Active organization (reserved for the Organization selected in a User's session), Active user.

### Testimonials

**Testimonial**:
A quote a **User** gives about Faster Fixes on behalf of the **Organization** they belong to at that moment: a star rating, a text, and the identity it is signed with (name, title, organization, website, photo). The identity is a snapshot taken at submission, never a live reference to the User or Organization, so a published quote stays as the person validated it. Never published without review.
_Avoid_: Review (a Reviewer is the widget's end-user), Feedback (reserved for the widget's reports), Quote.

**Testimonial request**:
The one-time invitation sent to a User to give a **Testimonial**, as a short email sequence. At most one per User, ever, and at most one per Organization. Ends when the User submits a Testimonial, declines, or the sequence runs out.
_Avoid_: Campaign, Drip, Survey.

### Feedback lifecycle

**Status**:
The state of a Feedback. Canonical values: `new`, `in_progress`, `resolved`, `archived`.

**Status actor**:
Who or what drove a Status change: a **User**, a Tracker sync, or the **Agent** (an Agent-token caller). Travels on the status-change event so a **Notification channel** can distinguish an agent-resolved Feedback from a human-resolved one.

**Rank**:
A Feedback's place within its Status column of its Project's board, set by a User to say what the team handles first. Shared by every Member. A Feedback without a Rank sits above ranked ones, newest first, and a Status change clears it.
_Avoid_: Priority (reserved for Tracker-side priority levels), Position, Order.

**Archived**:
A Feedback the team has decided not to act on (won't fix, duplicate, out of scope). Stored in the database as `status = "closed"` for legacy reasons; the literal will be renamed in a future migration. UI label is **Archived** everywhere (status dropdown, kanban action, archive view).
_Avoid_: Closed, Dismissed, Rejected.

**Restore**:
Taking an **Archived** Feedback back into the inbox for triage. A restored Feedback is always `new`, whatever its Status was before it was archived: Restore means "look at this again", not "undo the archiving". It is a Status change like any other, so Trackers converge to it (the mirrored Issue reopens) and the Rank is cleared. Only an Archived Feedback can be restored; a Feedback another actor has already moved out of Archived is left untouched.
_Avoid_: Unarchive, Reopen (reserved for the Tracker-side action on an Issue), Undo.

### Integrations

**Integration**:
An external system Faster Fixes connects to through an **Installation**. Comes in two categories: a **Tracker** (two-way mirror) or a **Notification channel** (one-way announce). Currently GitHub Issues, Linear, Jira, Trello and Slack.
_Avoid_: Connector, Plugin, External system.

**Tracker**:
A category of **Integration**: an external issue-tracking system Faster Fixes can mirror Feedback into, converging its state with the Feedback's. Currently GitHub Issues, Linear, Jira and Trello. The category is defined by the mirroring behaviour, not by the product type.
_Avoid_: Integration target, Sink.

**Notification channel**:
A category of **Integration** where Faster Fixes _announces_ Feedback one-way, holding no mirror and creating no Issue. First instance: Slack. Distinct from a **Tracker** (two-way, mirrors Feedback as an Issue and converges its state). Not to be confused with a Slack _channel_ (the specific room a Project posts into).
_Avoid_: Webhook (implementation detail), Sink.

**Installation**:
The org-level connection to an **Integration** — a **Tracker** (`GitHubInstallation`, `LinearInstallation`, `JiraInstallation`, `TrelloInstallation`) or a **Notification channel** (`SlackInstallation`). One per (Organization × Integration).

**Reconnect required**:
The state of an **Installation** whose authorization the **Integration** has explicitly refused or revoked. Only a User re-authorizing the connection clears it. A transient failure of the Integration never puts an Installation in this state.
_Avoid_: Disconnected (an Organization with no Installation at all), Broken, Expired.

**Jira site**:
The Jira Cloud instance an Organization connects to (e.g. `acme.atlassian.net`), identified by an Atlassian `cloudId`. The org-level scope of a Jira Installation — the analog of a Linear workspace or a GitHub account. One per Organization.
_Avoid_: Jira instance, Jira workspace.

**Jira project**:
A project inside a Jira site (e.g. `PAY`). The per-Project tracker scope a Faster Fixes Project links to — the analog of a GitHub repo or a Linear team. Always written "Jira project" in full; bare "project" means a Faster Fixes Project.

**Trello board**:
A board a Trello member can reach. The per-Project tracker scope a Faster Fixes Project links to, the analog of a GitHub repo, a Linear team or a Jira project. A Trello Installation is one Trello member's authorization and has no org-level scope of its own: there is no Trello analog of a **Jira site**. Always written "Trello board" in full; bare "board" means a Faster Fixes Project's board.
_Avoid_: Trello workspace (not a scope Faster Fixes links to).

**Trello card**:
The **Issue** a Feedback is mirrored as in Trello. The domain keeps saying Issue and **Issue link**; "card" is the Trello-facing word, used in UI copy on Trello screens.

**Project link**:
The project-level binding from a Faster Fixes Project to an external scope — a Tracker scope (a GitHub repo, a Linear team) or a Notification channel destination (a Slack channel). One per (Project × Integration).

**Issue link**:
The per-Feedback record connecting a single Feedback to its mirrored issue in a Tracker. A Feedback can have at most one issue link per Tracker, but may have one for each Tracker simultaneously.

**Mirrored Status**:
The Status an **Issue link** last converged on, together with the Issue's state at that moment. An Issue link whose Mirrored Status differs from its Feedback's Status, or has none yet, is _pending_: the Feedback wins until the Tracker has converged to it.
_Avoid_: Synced status, Last sync source.

### Diagnostics

**Diagnostic Trail**:
The console and network history captured leading up to a Feedback submission, attached to that Feedback to aid reproduction. With a narrated Recording it covers more: the recent history before the Recording started, everything during it, pauses and full page loads included, and what followed the stop until the Reviewer sent the Feedback. It stays bounded: when it is full, the least useful entries go first, successful requests and plain messages before errors and failed requests, and the Trail says how many were left out. The team can remove a Recording and keep the Trail.
_Avoid_: Session, Logs, Recording (the Recording replays the page; the Trail is the console and network history).

**Console Entry**:
One captured `console.*` call: level (`log`/`info`/`warn`/`error`/`debug`), message, timestamp. All levels captured.

**Network Entry**:
One captured `fetch`/`XHR` call: method, URL, status, duration, timestamp. Metadata only — request/response bodies are not captured in v1.

**Ring Buffer**:
The fixed-size in-memory store the Widget fills from page load; oldest entries drop when full. A Diagnostic Trail is a snapshot of this buffer at submission time, except with a narrated Recording, where the buffer supplies only the history before the start and after the stop.

**Custom metadata**:
Key/value pairs the customer's site declares in its Widget configuration and that travel with every Feedback submitted from it: a user ID in the customer's system, a release version, a tenant, a feature flag. Declared by the developer, never captured by the Widget; one flat set per Feedback, fixed at submission; shown to the team in the inbox, in mirrored Issues and on the agent surface, never to a Reviewer. Distinct from the **Diagnostic Trail** (what the Widget observed) and unaffected by turning capture off.
_Avoid_: Metadata (the Widget's own element-context and pin-placement bag, which the Widget reads back), Tags, Context, Attributes, User properties.

## Relationships

- An **Organization** has many **Members**, owns many **Projects**, and has zero or one active **Subscription**
- A **User** may be a **Member** of several **Organizations**, with one **Role** in each
- A **Feedback** has zero or one **Diagnostic Trail**
- A **Feedback** has zero or one **Recording**, only when it is about a page, in one form only: a narrated Recording replaces the automatic one. An automatic Recording ends at the Feedback's **Selection** and complements it, never replaces it; a narrated Recording stands in place of the Selection. Two Feedbacks never share a Recording, though their Recordings may cover the same moments
- A **Testimonial** is given by one **User** on behalf of one **Organization**; it is the outcome of at most one **Testimonial request**
- A **Testimonial** is deleted with its **User**; it outlives its **Organization**, whose name it carries as a snapshot
- A **Feedback** has zero or one set of **Custom metadata**, declared by the customer's site at submission; it is never returned to a **Reviewer**
- A **Feedback** has exactly one **Selection**, or none when it is about a narrated Recording, and zero or one **Screenshot**; a **Selection frame** exists only when the Feedback has the Selection's geometry and a Screenshot or a Recording to draw it on
- A **Feedback** belongs to one **Project** and is about either a page of its website or one of its **Videos**, never both; its **Selection** takes the shape of that subject. A Feedback about a page is about either a Selection or a narrated Recording, never both; with a narrated Recording, the page is the one where it was started
- A **Project** holds many **Videos**; a **Video** belongs to exactly one **Project** and is deleted with it
- A **Video** has zero or one **Poster**
- A **Video** has exactly one **Share link** at a time; a **Reviewer** who gives Feedback on a Video does so through that link
- A **Reviewer** belongs to exactly one **Project**; a Reviewer who came through a **Share link** is also bound to that **Video**, where their name is unique
- A **Tracker** mirrors and a **Notification channel** announces every Feedback of a **Project** through its **Project links**, page and video alike
- A video Feedback's **Screenshot** is the frame captured at its **Selection**
- A **Pin** marks a Feedback that has a Selection on the live page, so a Feedback with a narrated Recording has none; a **Selection frame** marks the same Selection on its Screenshot and at the end of its Recording
- A **Feedback** has zero or one **Rank**, valid only within its current **Status**; the Rank is internal to the team and never shown to a **Reviewer**
- A **Diagnostic Trail** contains many **Console Entries** and many **Network Entries**
- The **Widget** maintains one **Ring Buffer** per page session; submitting Feedback snapshots it into a **Diagnostic Trail**
- A page session starts at a full page load and at a return to the page through the browser's back or forward; a change of route without a load continues it. An automatic **Recording** and a **Diagnostic Trail** never reach back before the start of their page session; a narrated Recording may span several page sessions, and so does its Diagnostic Trail, which still never reaches back before the page session the Recording started in
- An **Integration** is either a **Tracker** or a **Notification channel**
- A **Project** has zero or one **Project link** per **Integration**
- A **Feedback** has zero or one **Issue link** per **Tracker**
- An Issue's state _mirrors_ a **Status** when the Tracker would accept it for that Status; one state may mirror several (a Jira issue in Done mirrors Resolved and Archived)
- A **Tracker** sets a Feedback's **Status** only when its **Issue link** is not pending and the Issue's state has changed since its **Mirrored Status** into one that does not mirror the current Status; an edit that leaves the state as it was (a comment, an assignee) never moves the Feedback
- A **Reviewer** submits **Feedback** through the **Widget**; Reviewers are not authenticated app users
- A **Widget** is installed through exactly one **Embed**; Embeds differ in install mechanism only, never in behaviour or customization
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
- **"Integration" vs "external system"**: the glossary said "external system" while the UI and the team said "integration". Resolved: **Integration** is the canonical umbrella term; **Tracker** and **Notification channel** are its two categories, and **Installation** and **Project link** apply to both.
- **"metadata"** — the Widget's HTTP payload and `Feedback` record carry a `metadata` bag holding the element context and pin placement the Widget itself writes and reads back, and the API reference once labelled it "Custom metadata". Resolved: that bag has no domain name and is widget-internal; the developer-declared pairs are **Custom metadata**, a separate concept with its own field, and the bare word "metadata" is not used for them.
- **"API key"** — the widget historically embedded an `apiKey` stored like a secret (SHA-256 hash, last-4 shown, "regenerate" flow). Resolved: the widget surface has **no secret**. It embeds the public **Project public ID**, secured by the **allowed origins** (domain + subdomains) + **Reviewer token**. Genuine secrets exist only on the agent surface (**Agent token**). The widget `apiKey` is being removed.
