# Agent API rate limit is an abuse backstop, keyed per organization

The agent write rate limit (`update_feedback_status`, `create_feedbacks`) exists only to stop runaway loops and contain a leaked token — not to meter value or protect authorization. It is keyed on the **organization**, set generously for paid orgs, and pairs with a fan-out guard that skips the integration sync when a status change is a no-op.

## Why

Writes are already protected on the dimensions that matter for correctness: scope (`require-agent-auth`), ownership (the feedback-belongs-to-org query), and resource volume (`create_feedbacks` plan cap). Those answer "can you touch this?" The rate limit only answers "how often?" — so its single job is abuse/runaway/cost protection, and it should be invisible in normal use.

The original design fought the product's core loop (Claude Code draining a feedback queue): `agent:write` was capped at 50/hour, shared across create and status, keyed per token, and non-atomic. A normal triage pass (`in_progress` then `resolved` per ticket) is 2 writes/ticket, so ~25 tickets exhausted the budget — the exact "completed fixes can't sync back" symptom a customer reported.

Key decisions, each chosen against a simpler or more elaborate alternative:

- **Goal is abuse protection, not monetization.** So the limit is _not_ tiered to sell throughput. The real cost of a write is its **fan-out** (`feedback/status-changed` → GitHub/Linear/Slack), and fan-out is a Pro/Agency-only feature — i.e. the expensive writes belong to paying customers. Metering paid writes _more tightly_ would punish exactly the customers we want to serve. Instead, the runaway-fan-out vector (re-resolving an already-resolved ticket in a loop) is killed at the source: **skip the inngest send when `newStatus === previousStatus`**, independent of any numeric limit.
- **Keyed per organization, not per token.** Per-token keying is bypassable — mint N tokens, get N× budget — which defeats an abuse control. The org is the cost unit and the billing unit. A leaked token sharing the org bucket is contained by _revocation_ (already supported), and its abuse surfaces as the legit automation getting throttled, which is a useful signal.
- **Rolling fixed window, made atomic — not a token bucket.** A token bucket shapes _sustained_ traffic smoothly; we only need "stop a loop." Automation is bursty and a generous fixed ceiling welcomes bursts. The existing rolling-reset window is kept; its only real defects (tiny number, per-token key, non-atomic increment) are fixed. Simpler is more robust for a backstop.
- **One shared write bucket for create + status.** `create_feedbacks` is batched (few calls even for huge imports) and already plan-capped, so a separate bucket would solve a non-problem. Row-flooding, if it ever matters, is a per-batch schema cap, not a rate-limit concern.
- **429 is agent-actionable.** The caller is an LLM reading a tool result, not code parsing headers. The 429 body states remaining budget, seconds-until-retry, and reset time; `Retry-After` and `X-RateLimit-*` headers are also emitted for non-agent clients. The agent self-paces with zero client changes.

Limits: Free 120 writes/hour (a full pass over the 50-feedback cap is 100), Paid 1000/hour (≈500 tickets/pass — past "most won't have thousands"), self-hosted unlimited (`!isCloud()` skips the check; it is the customer's own infra).

## Consequences

- `checkRateLimit` returns a structured result (`allowed`, `limit`, `remaining`, `resetAt`, `retryAfterSeconds`) instead of a boolean; all callers updated.
- Limit selection requires the org plan, already loaded on the resolved agent token — no extra query on the hot path beyond the existing plan resolution.
- Re-keying from token hash to org id orphans old `rateLimit` rows; they age out via the rolling window. No schema migration.
- A genuine one-off onboarding burst (e.g. importing then triaging a multi-thousand-ticket backlog) can still hit the paid ceiling. That is accepted: the agent reads the retry window and resumes, rather than the limit being raised to cover the rarest case.
- Skipping fan-out on no-op status changes means a redundant `resolved → resolved` call returns success without re-syncing the tracker. This is intended; the tracker is already in the target state.
- **The skip is asymmetric on purpose and stays that way.** The dashboard's `inbox/_services/update-feedback-status.ts` emits `feedback/status-changed` even on a redundant set; the agent API's own `update-feedback-status.ts` does not. An agent loops over a queue re-setting what it just read, and fan-out is the costly half; a human toggling a Status in the inbox does not. Closing the gap is worse in either direction: making the dashboard skip changes inbox behaviour, and making the agent emit puts unobservable events on the bus.
