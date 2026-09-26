import { FeedbackStatusEnum } from "@/app/_domains/feedback";
import { eventType, type EventType, type StandardSchemaV1 } from "inngest";
import { z } from "zod";

// The event registry of the durable function client. Each definition is both a
// trigger, which types `event.data` in the handler and validates it before the
// run starts, and the contract every emitter builds its payload against.
// The name strings are the running system's identity: never rename one.

export const feedbackCreatedEvent = eventType("feedback/created", {
  schema: z.object({ feedbackId: z.string() }),
});

export const feedbackIntegrationIssueRequestedEvent = eventType(
  "feedback/integration-issue-requested",
  {
    schema: z.object({
      feedbackId: z.string(),
      target: z.enum(["github", "linear", "jira"]),
    }),
  },
);

export const feedbackStatusChangedEvent = eventType("feedback/status-changed", {
  schema: z.object({
    feedbackId: z.string(),
    newStatus: FeedbackStatusEnum,
    // Set when a Tracker webhook drove the change, so that Tracker is not echoed back.
    origin: z.enum(["github", "linear", "jira"]).optional(),
    actor: z.enum(["user", "agent", "tracker"]),
  }),
});

export const userEmailVerifiedEvent = eventType("user/email-verified", {
  schema: z.object({ userId: z.string() }),
});

export const githubWebhookIssuesEvent = eventType("github/webhook.issues", {
  schema: z.object({
    action: z.string(),
    issueNumber: z.number(),
    issueState: z.string(),
    repoFullName: z.string(),
  }),
});

export const linearWebhookIssueEvent = eventType("linear/webhook.issue", {
  schema: z.object({
    action: z.string(),
    organizationId: z.string(),
    installationId: z.string(),
    // Linear's raw issue payload: its types are not installed.
    issue: z.record(z.string(), z.unknown()).optional(),
  }),
});

export const linearOAuthRevokedEvent = eventType("linear/oauth.revoked", {
  schema: z.object({ organizationId: z.string(), installationId: z.string() }),
});

export const jiraWebhookIssueEvent = eventType("jira/webhook.issue", {
  schema: z.object({
    installationId: z.string(),
    issueId: z.string(),
    webhookEvent: z.string(),
  }),
});

export const jiraOAuthRevokedEvent = eventType("jira/oauth.revoked", {
  schema: z.object({ installationId: z.string() }),
});

export const jiraWebhooksRefreshRequestedEvent = eventType(
  "jira/webhooks.refresh-requested",
  { schema: z.object({ installationId: z.string() }) },
);

type AnyEventType = EventType<
  string,
  StandardSchemaV1<Record<string, unknown>>
>;

type EventData<TEvent extends AnyEventType> =
  TEvent["schema"] extends StandardSchemaV1<infer TData> ? TData : never;

/**
 * Builds a `{ name, data }` payload for `inngest.send`, type-checked against
 * the event's schema. Not `EventType.create`: that one attaches a `validate`
 * closure and empty `id`, `ts` and `v` keys to the payload, and the handler
 * side validates against the same schema before any run starts.
 */
export function buildEvent<TEvent extends AnyEventType>(
  event: TEvent,
  data: EventData<TEvent>,
): { name: TEvent["name"]; data: EventData<TEvent> } {
  return { name: event.name, data };
}
